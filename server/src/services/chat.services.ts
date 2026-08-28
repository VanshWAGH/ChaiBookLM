import prisma from "../lib/db.js";
import { chatComplete, chatStream, embedText } from "../lib/openrouter.js";
import { retrieveSimilarChunks } from "../lib/vector-store.js";
import {
    createConversationRecord,
    createMessageRecord,
    findConversationById,
    findConversationsByWorkspace,
    findMessagesByConversation,
    touchConversation,
    updateConversationTitle,
} from "../repository/conversation.repository.js";
import { NotFoundError } from "../types/app-error.js";
import type { SendMessageInput } from "../validators/conversation.validator.js";
import { getWorkspaceByIdForUser } from "./workspace.services.js";

export type Citation = {
    index: number;
    sourceId: string;
    chunkId: string;
    excerpt: string;
    sourceTitle?: string;
};

async function assertWorkspace(workspaceId: string, userId: string) {
    return getWorkspaceByIdForUser(workspaceId, userId);
}

export async function listConversationsForWorkspace(
    workspaceId: string,
    userId: string,
) {
    await assertWorkspace(workspaceId, userId);
    return findConversationsByWorkspace(workspaceId);
}

export async function createConversationForWorkspace(
    workspaceId: string,
    userId: string,
    title?: string,
) {
    await assertWorkspace(workspaceId, userId);
    return createConversationRecord(workspaceId, title);
}

export async function getConversationForWorkspace(
    workspaceId: string,
    conversationId: string,
    userId: string,
) {
    await assertWorkspace(workspaceId, userId);

    const conversation = await findConversationById(conversationId, workspaceId);
    if (!conversation) {
        throw new NotFoundError("Conversation not found");
    }

    return conversation;
}

export async function getMessagesForConversation(
    workspaceId: string,
    conversationId: string,
    userId: string,
) {
    await getConversationForWorkspace(workspaceId, conversationId, userId);
    return findMessagesByConversation(conversationId);
}

async function buildContext(
    workspaceId: string,
    query: string,
    sourceIds?: string[],
) {
    const readySources = await prisma.source.findMany({
        where: {
            workspaceId,
            status: "READY",
            ...(sourceIds?.length ? { id: { in: sourceIds } } : {}),
        },
        select: { id: true, title: true, content: true },
    });

    if (readySources.length === 0) {
        return { contextBlock: "", citations: [] as Citation[] };
    }

    const totalChars = readySources.reduce(
        (sum, s) => sum + (s.content?.length ?? 0),
        0,
    );

    // Small notebooks: inject full source text
    if (totalChars <= 120_000) {
        const citations: Citation[] = readySources.map((source, index) => ({
            index: index + 1,
            sourceId: source.id,
            chunkId: source.id,
            excerpt: (source.content ?? "").slice(0, 200),
            sourceTitle: source.title,
        }));

        const contextBlock = readySources
            .map(
                (source, index) =>
                    `[${index + 1}] Source: ${source.title}\n${source.content ?? ""}`,
            )
            .join("\n\n---\n\n");

        return { contextBlock, citations };
    }

    const queryEmbedding = await embedText(query);
    const chunks = await retrieveSimilarChunks({
        workspaceId,
        queryEmbedding,
        ...(sourceIds?.length ? { sourceIds } : {}),
        limit: 10,
    });

    const citations: Citation[] = chunks.map((chunk, index) => ({
        index: index + 1,
        sourceId: chunk.sourceId,
        chunkId: chunk.id,
        excerpt: chunk.content.slice(0, 200),
        ...(chunk.sourceTitle ? { sourceTitle: chunk.sourceTitle } : {}),
    }));

    const contextBlock = chunks
        .map(
            (chunk, index) =>
                `[${index + 1}] Source: ${chunk.sourceTitle ?? chunk.sourceId}\n${chunk.content}`,
        )
        .join("\n\n---\n\n");

    return { contextBlock, citations };
}

export async function sendMessageWithStream(
    workspaceId: string,
    conversationId: string,
    userId: string,
    input: SendMessageInput,
) {
    const workspace = await assertWorkspace(workspaceId, userId);
    await getConversationForWorkspace(workspaceId, conversationId, userId);

    const history = await findMessagesByConversation(conversationId);
    const { contextBlock, citations } = await buildContext(
        workspaceId,
        input.content,
        input.sourceIds,
    );

    await createMessageRecord({
        conversationId,
        role: "USER",
        content: input.content,
    });

    if (history.length === 0) {
        const title = input.content.slice(0, 60);
        await updateConversationTitle(conversationId, title);
    }

    const systemPrompt = contextBlock
        ? `You are a helpful research assistant for a notebook workspace. Answer using ONLY the provided sources. Cite sources inline using [1], [2], etc.\n\nSources:\n${contextBlock}`
        : "You are a helpful research assistant. The user has not added any sources yet. Answer generally and suggest they add sources to the notebook.";

    const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map((msg) => ({
            role: msg.role.toLowerCase() as "user" | "assistant",
            content: msg.content,
        })),
        { role: "user" as const, content: input.content },
    ];

    let fullResponse = "";

    async function* stream() {
        for await (const token of chatStream(messages, workspace.defaultModel)) {
            fullResponse += token;
            yield token;
        }

        const assistantMessage = await createMessageRecord({
            conversationId,
            role: "ASSISTANT",
            content: fullResponse,
            citations,
        });

        await touchConversation(conversationId);

        yield JSON.stringify({
            type: "done",
            message: assistantMessage,
            citations,
        });
    }

    return stream();
}

export async function deleteConversationForWorkspace(
    workspaceId: string,
    conversationId: string,
    userId: string,
) {
    await getConversationForWorkspace(workspaceId, conversationId, userId);
    const { deleteConversationRecord } = await import(
        "../repository/conversation.repository.js"
    );
    await deleteConversationRecord(conversationId);
}

export async function sendMessageSync(
    workspaceId: string,
    conversationId: string,
    userId: string,
    input: SendMessageInput,
) {
    const workspace = await assertWorkspace(workspaceId, userId);
    await getConversationForWorkspace(workspaceId, conversationId, userId);

    const history = await findMessagesByConversation(conversationId);
    const { contextBlock, citations } = await buildContext(
        workspaceId,
        input.content,
        input.sourceIds,
    );

    await createMessageRecord({
        conversationId,
        role: "USER",
        content: input.content,
    });

    const systemPrompt = contextBlock
        ? `You are a helpful research assistant. Use the sources and cite with [1], [2].\n\nSources:\n${contextBlock}`
        : "You are a helpful research assistant.";

    const messages = [
        { role: "system" as const, content: systemPrompt },
        ...history.map((msg) => ({
            role: msg.role.toLowerCase() as "user" | "assistant",
            content: msg.content,
        })),
        { role: "user" as const, content: input.content },
    ];

    const content = await chatComplete(messages, workspace.defaultModel);

    const assistantMessage = await createMessageRecord({
        conversationId,
        role: "ASSISTANT",
        content,
        citations,
    });

    await touchConversation(conversationId);

    return { message: assistantMessage, citations };
}
