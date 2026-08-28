import prisma from "../lib/db.js";
import type { ArtifactStatus, ArtifactType } from "../generated/prisma/enums.js";

export const artifactSelect = {
    id: true,
    workspaceId: true,
    type: true,
    title: true,
    content: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

export function findArtifactsByWorkspace(workspaceId: string) {
    return prisma.artifact.findMany({
        where: { workspaceId },
        select: artifactSelect,
        orderBy: { createdAt: "desc" },
    });
}

export function findArtifactById(artifactId: string, workspaceId: string) {
    return prisma.artifact.findFirst({
        where: { id: artifactId, workspaceId },
        select: artifactSelect,
    });
}

export function createArtifactRecord(data: {
    workspaceId: string;
    type: ArtifactType;
    title: string;
    status?: ArtifactStatus;
}) {
    return prisma.artifact.create({
        data: {
            workspaceId: data.workspaceId,
            type: data.type,
            title: data.title,
            status: data.status ?? "GENERATING",
        },
        select: artifactSelect,
    });
}

export function updateArtifactRecord(
    artifactId: string,
    data: {
        content?: string;
        status?: ArtifactStatus;
        title?: string;
    },
) {
    return prisma.artifact.update({
        where: { id: artifactId },
        data,
        select: artifactSelect,
    });
}

export function deleteArtifactRecord(artifactId: string) {
    return prisma.artifact.delete({ where: { id: artifactId } });
}
