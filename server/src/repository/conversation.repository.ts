import type { Prisma } from "../generated/prisma/client.js";
import prisma from "../lib/db.js";

export const conversationSelect = {
    id: true,
    workspaceId: true,
    title: true,
    createdAt: true,
    updatedAt: true,
} as const;

export const messageSelect = {
    id: true,
    conversationId: true,
    role: true,
    content: true,
    citations: true,
    createdAt: true,
} as const;

export function findConversationsByWorkspace(workspaceId: string) {
    return prisma.conversation.findMany({
        where: { workspaceId },
        select: conversationSelect,
        orderBy: { updatedAt: "desc" },
    });
}

export function findConversationById(conversationId: string, workspaceId: string) {
    return prisma.conversation.findFirst({
        where: { id: conversationId, workspaceId },
        select: conversationSelect,
    });
}

export function createConversationRecord(workspaceId: string, title?: string) {
    return prisma.conversation.create({
        data: { workspaceId, title: title ?? "New chat" },
        select: conversationSelect,
    });
}

export function findMessagesByConversation(conversationId: string) {
    return prisma.message.findMany({
        where: { conversationId },
        select: messageSelect,
        orderBy: { createdAt: "asc" },
    });
}

export function createMessageRecord(data: {
    conversationId: string;
    role: "USER" | "ASSISTANT";
    content: string;
    citations?: unknown;
}) {
    return prisma.message.create({
        data: {
            conversationId: data.conversationId,
            role: data.role,
            content: data.content,
            ...(data.citations !== undefined
                ? { citations: data.citations as Prisma.InputJsonValue }
                : {}),
        },
        select: messageSelect,
    });
}

export async function touchConversation(conversationId: string) {
    await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
    });
}

export function updateConversationTitle(conversationId: string, title: string) {
    return prisma.conversation.update({
        where: { id: conversationId },
        data: { title },
        select: conversationSelect,
    });
}

export function deleteConversationRecord(conversationId: string) {
    return prisma.conversation.delete({ where: { id: conversationId } });
}
