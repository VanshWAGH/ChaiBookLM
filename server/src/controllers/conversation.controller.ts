import type { Request, Response } from "express";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";
import {
    conversationIdParamSchema,
    createConversationSchema,
    sendMessageSchema,
} from "../validators/conversation.validator.js";
import { workspaceIdParamSchema } from "../validators/workspace.validator.js";
import {
    createConversationForWorkspace,
    deleteConversationForWorkspace,
    getConversationForWorkspace,
    getMessagesForConversation,
    listConversationsForWorkspace,
    sendMessageWithStream,
} from "../services/chat.services.js";

export async function listConversations(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const conversations = await listConversationsForWorkspace(
        workspaceId,
        req.auth.userId!,
    );
    res.json(conversations);
}

export async function createConversation(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const parsed = createConversationSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationError(
            "Validation failed",
            getZodFieldErrors(parsed.error),
        );
    }

    const conversation = await createConversationForWorkspace(
        workspaceId,
        req.auth.userId!,
        parsed.data.title,
    );
    res.status(201).json(conversation);
}

export async function getConversation(req: Request, res: Response) {
    const params = conversationIdParamSchema.parse(req.params);
    const conversation = await getConversationForWorkspace(
        params.workspaceId,
        params.conversationId,
        req.auth.userId!,
    );
    res.json(conversation);
}

export async function listMessages(req: Request, res: Response) {
    const params = conversationIdParamSchema.parse(req.params);
    const messages = await getMessagesForConversation(
        params.workspaceId,
        params.conversationId,
        req.auth.userId!,
    );
    res.json(messages);
}

export async function sendMessage(req: Request, res: Response) {
    const params = conversationIdParamSchema.parse(req.params);
    const parsed = sendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationError(
            "Validation failed",
            getZodFieldErrors(parsed.error),
        );
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
        const stream = await sendMessageWithStream(
            params.workspaceId,
            params.conversationId,
            req.auth.userId!,
            parsed.data,
        );

        for await (const chunk of stream) {
            if (chunk.startsWith('{"type":"done"')) {
                res.write(`event: done\ndata: ${chunk}\n\n`);
            } else {
                res.write(`event: token\ndata: ${JSON.stringify({ token: chunk })}\n\n`);
            }
        }

        res.write("event: end\ndata: {}\n\n");
        res.end();
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Chat failed";
        res.write(
            `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`,
        );
        res.end();
    }
}

export async function deleteConversation(req: Request, res: Response) {
    const params = conversationIdParamSchema.parse(req.params);
    await deleteConversationForWorkspace(
        params.workspaceId,
        params.conversationId,
        req.auth.userId!,
    );
    res.status(204).send();
}
