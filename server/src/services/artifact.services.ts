import prisma from "../lib/db.js";
import { chatComplete } from "../lib/openrouter.js";
import type { ArtifactType } from "../generated/prisma/enums.js";
import {
    createArtifactRecord,
    findArtifactById,
    findArtifactsByWorkspace,
    updateArtifactRecord,
} from "../repository/artifact.repository.js";
import { NotFoundError } from "../types/app-error.js";
import { getWorkspaceByIdForUser } from "./workspace.services.js";

const ARTIFACT_PROMPTS: Record<
    ArtifactType,
    (context: string) => string
> = {
    STUDY_GUIDE: (context) =>
        `Create a detailed study guide from these sources. Use markdown with clear sections, key concepts, definitions, and review questions.\n\nSources:\n${context}`,
    FAQ: (context) =>
        `Create a FAQ document with 10-15 question and answer pairs based on these sources. Use markdown.\n\nSources:\n${context}`,
    BRIEFING: (context) =>
        `Write an executive briefing document summarizing the key points, insights, and recommendations from these sources. Use markdown.\n\nSources:\n${context}`,
    TIMELINE: (context) =>
        `Extract a chronological timeline of events from these sources. Use markdown with dates and descriptions.\n\nSources:\n${context}`,
};

const ARTIFACT_TITLES: Record<ArtifactType, string> = {
    STUDY_GUIDE: "Study Guide",
    FAQ: "FAQ",
    BRIEFING: "Briefing Document",
    TIMELINE: "Timeline",
};

async function getWorkspaceContext(workspaceId: string) {
    const sources = await prisma.source.findMany({
        where: { workspaceId, status: "READY" },
        select: { title: true, content: true },
    });

    if (sources.length === 0) {
        throw new NotFoundError(
            "No ready sources found. Add and process sources first.",
        );
    }

    return sources
        .map((s) => `## ${s.title}\n${s.content ?? ""}`)
        .join("\n\n");
}

export async function listArtifactsForWorkspace(
    workspaceId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);
    return findArtifactsByWorkspace(workspaceId);
}

export async function getArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const artifact = await findArtifactById(artifactId, workspaceId);
    if (!artifact) {
        throw new NotFoundError("Artifact not found");
    }

    return artifact;
}

export async function generateArtifact(
    workspaceId: string,
    userId: string,
    type: ArtifactType,
    title?: string,
) {
    const workspace = await getWorkspaceByIdForUser(workspaceId, userId);
    const context = await getWorkspaceContext(workspaceId);

    const artifact = await createArtifactRecord({
        workspaceId,
        type,
        title: title ?? ARTIFACT_TITLES[type],
    });

    try {
        const prompt = ARTIFACT_PROMPTS[type](context);
        const content = await chatComplete(
            [
                {
                    role: "system",
                    content:
                        "You generate well-structured markdown documents from research sources.",
                },
                { role: "user", content: prompt },
            ],
            workspace.defaultModel,
        );

        return updateArtifactRecord(artifact.id, {
            content,
            status: "READY",
        });
    } catch (error) {
        await updateArtifactRecord(artifact.id, {
            status: "FAILED",
            content:
                error instanceof Error ? error.message : "Generation failed",
        });
        throw error;
    }
}

export async function deleteArtifactForWorkspace(
    workspaceId: string,
    artifactId: string,
    userId: string,
) {
    await getArtifactForWorkspace(workspaceId, artifactId, userId);
    const { deleteArtifactRecord } = await import(
        "../repository/artifact.repository.js"
    );
    await deleteArtifactRecord(artifactId);
}
