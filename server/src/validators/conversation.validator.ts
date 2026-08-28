import { z } from "zod";

export const conversationIdParamSchema = z.object({
    workspaceId: z.string().trim().min(1),
    conversationId: z.string().trim().min(1),
});

export const createConversationSchema = z.object({
    title: z.string().trim().max(120).optional(),
});

export const sendMessageSchema = z.object({
    content: z.string().trim().min(1, "Message is required").max(8000),
    sourceIds: z.array(z.string().trim().min(1)).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
