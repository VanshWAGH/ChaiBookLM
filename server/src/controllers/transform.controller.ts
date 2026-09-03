import type { Request, Response } from "express";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";
import { transformSchema, type TransformInput } from "../validators/note.validator.js";
import { workspaceIdParamSchema } from "../validators/workspace.validator.js";
import { getWorkspaceByIdForUser } from "../services/workspace.services.js";
import { chatStream } from "../lib/openrouter.js";

const TRANSFORM_PROMPTS: Record<TransformInput["type"], (text: string) => string> = {
    SUMMARIZE: (text) =>
        `Summarize the following text concisely while preserving all key information and legal significance. Output in well-structured markdown.\n\nText:\n${text}`,
    SIMPLIFY: (text) =>
        `Rewrite the following text in simple, plain English. Replace legal jargon with everyday language. Keep the meaning intact. Output in well-structured markdown.\n\nText:\n${text}`,
    TRANSLATE: (text) =>
        `Translate the following text to Hindi while preserving the legal meaning and nuance. If it's already in Hindi, translate to English. Output in well-structured markdown.\n\nText:\n${text}`,
    EXPAND: (text) =>
        `Expand the following text with more details, explanations, and context. Add relevant legal context and implications where applicable. Output in well-structured markdown.\n\nText:\n${text}`,
    FORMAL: (text) =>
        `Rewrite the following text in a formal, professional legal tone suitable for official correspondence or legal documents. Output in well-structured markdown.\n\nText:\n${text}`,
    CASUAL: (text) =>
        `Rewrite the following text in a casual, conversational tone as if explaining it to a friend with no legal background. Keep it friendly and easy to understand. Output in well-structured markdown.\n\nText:\n${text}`,
};

export async function transformText(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const parsed = transformSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationError(
            "Validation failed",
            getZodFieldErrors(parsed.error),
        );
    }

    const workspace = await getWorkspaceByIdForUser(
        workspaceId,
        req.auth.userId!,
    );

    const prompt = TRANSFORM_PROMPTS[parsed.data.type](parsed.data.text);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
        const stream = chatStream(
            [
                {
                    role: "system",
                    content:
                        "You are an expert legal writing assistant. Transform the given text according to the instructions. Be accurate and preserve the core meaning.",
                },
                { role: "user", content: prompt },
            ],
            workspace.defaultModel,
        );

        for await (const token of stream) {
            res.write(
                `event: token\ndata: ${JSON.stringify({ token })}\n\n`,
            );
        }

        res.write(`event: done\ndata: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
    } catch (error) {
        console.error("Transform streaming error:", error);
        const message =
            error instanceof Error ? error.message : "Transform failed";
        res.write(
            `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`,
        );
        res.end();
    }
}
