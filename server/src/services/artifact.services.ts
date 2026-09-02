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
        `Perform a comprehensive Risk Audit on these legal documents. Identify all potential legal risks, unfavorable clauses, missing protections, and liability concerns. For each risk, explain the issue in plain English, rate its severity (High/Medium/Low), and suggest a remediation. Use markdown with clear sections.\n\nDocuments:\n${context}`,
    FAQ: (context) =>
        `Extract and explain the 10-15 most important clauses from these legal documents. For each clause, provide the original text, a plain-English explanation, and note if it is standard or unusual. Use markdown.\n\nDocuments:\n${context}`,
    BRIEFING: (context) =>
        `Write a Legal Brief summarizing these documents for a startup founder. Include: parties involved, key obligations, important dates/deadlines, financial terms, termination conditions, and any non-standard provisions. Use markdown.\n\nDocuments:\n${context}`,
    TIMELINE: (context) =>
        `Create a Compliance Checklist based on these legal documents. List all obligations, deadlines, filing requirements, and compliance items that the parties must fulfill. Include references to relevant Indian laws (Companies Act 2013, FEMA, etc.) where applicable. Use markdown with checkboxes.\n\nDocuments:\n${context}`,
};

const ARTIFACT_TITLES: Record<ArtifactType, string> = {
    STUDY_GUIDE: "Risk Audit",
    FAQ: "Key Clauses Analysis",
    BRIEFING: "Legal Brief",
    TIMELINE: "Compliance Checklist",
};

async function getWorkspaceContext(workspaceId: string) {
    const sources = await prisma.source.findMany({
        where: { workspaceId, status: "READY" },
        select: { title: true, content: true },
    });

    if (sources.length === 0) {
        throw new NotFoundError(
            "No ready documents found. Upload and process legal documents first.",
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
                        "You are an expert legal analyst specializing in Indian corporate law. Generate well-structured markdown documents analyzing legal contracts and agreements. Always include a disclaimer that this is AI-assisted analysis and not professional legal advice.",
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
