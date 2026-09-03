import { z } from "zod";

export const noteIdParamSchema = z.object({
    workspaceId: z.string().trim().min(1),
    noteId: z.string().trim().min(1),
});

export const createNoteSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    content: z.string().max(50000).optional(),
});

export const updateNoteSchema = z
    .object({
        title: z.string().trim().min(1).max(200).optional(),
        content: z.string().max(50000).optional(),
        isPinned: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field is required",
    });

export const transformSchema = z.object({
    text: z.string().trim().min(1, "Text is required").max(50000),
    type: z.enum([
        "SUMMARIZE",
        "SIMPLIFY",
        "TRANSLATE",
        "EXPAND",
        "FORMAL",
        "CASUAL",
    ]),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type TransformInput = z.infer<typeof transformSchema>;
