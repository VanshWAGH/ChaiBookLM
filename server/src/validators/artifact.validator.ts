import { z } from "zod";

export const artifactIdParamSchema = z.object({
    workspaceId: z.string().trim().min(1),
    artifactId: z.string().trim().min(1),
});

export const generateArtifactSchema = z.object({
    title: z.string().trim().max(200).optional(),
});

export type GenerateArtifactInput = z.infer<typeof generateArtifactSchema>;
