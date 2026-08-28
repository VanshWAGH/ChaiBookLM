import type { Request, Response } from "express";
import type { ArtifactType } from "../generated/prisma/enums.js";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";
import {
    artifactIdParamSchema,
    generateArtifactSchema,
} from "../validators/artifact.validator.js";
import { workspaceIdParamSchema } from "../validators/workspace.validator.js";
import {
    deleteArtifactForWorkspace,
    generateArtifact,
    getArtifactForWorkspace,
    listArtifactsForWorkspace,
} from "../services/artifact.services.js";

async function handleGenerate(
    req: Request,
    res: Response,
    type: ArtifactType,
) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const parsed = generateArtifactSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationError(
            "Validation failed",
            getZodFieldErrors(parsed.error),
        );
    }

    const artifact = await generateArtifact(
        workspaceId,
        req.auth.userId!,
        type,
        parsed.data.title,
    );
    res.status(201).json(artifact);
}

export async function listArtifacts(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const artifacts = await listArtifactsForWorkspace(
        workspaceId,
        req.auth.userId!,
    );
    res.json(artifacts);
}

export async function getArtifact(req: Request, res: Response) {
    const params = artifactIdParamSchema.parse(req.params);
    const artifact = await getArtifactForWorkspace(
        params.workspaceId,
        params.artifactId,
        req.auth.userId!,
    );
    res.json(artifact);
}

export async function deleteArtifact(req: Request, res: Response) {
    const params = artifactIdParamSchema.parse(req.params);
    await deleteArtifactForWorkspace(
        params.workspaceId,
        params.artifactId,
        req.auth.userId!,
    );
    res.status(204).send();
}

export async function generateStudyGuide(req: Request, res: Response) {
    await handleGenerate(req, res, "STUDY_GUIDE");
}

export async function generateFaq(req: Request, res: Response) {
    await handleGenerate(req, res, "FAQ");
}

export async function generateBriefing(req: Request, res: Response) {
    await handleGenerate(req, res, "BRIEFING");
}

export async function generateTimeline(req: Request, res: Response) {
    await handleGenerate(req, res, "TIMELINE");
}
