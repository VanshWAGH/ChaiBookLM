import { Prisma } from "../generated/prisma/client.js";
import prisma from "./db.js";

export type StoredChunk = {
    id: string;
    sourceId: string;
    workspaceId: string;
    content: string;
    chunkIndex: number;
    embedding: number[] | null;
    metadata: unknown;
};

export type RetrievedChunk = StoredChunk & {
    score: number;
    sourceTitle?: string;
};

export async function deleteChunksForSource(sourceId: string) {
    await prisma.sourceChunk.deleteMany({ where: { sourceId } });
}

export async function deleteChunksForWorkspace(workspaceId: string) {
    await prisma.sourceChunk.deleteMany({ where: { workspaceId } });
}

export async function insertChunks(
    chunks: Array<{
        sourceId: string;
        workspaceId: string;
        content: string;
        chunkIndex: number;
        embedding: number[];
        metadata?: Record<string, unknown>;
    }>,
) {
    if (chunks.length === 0) {
        return;
    }

    const queries = chunks.map(chunk => {
        const embeddingStr = `[${chunk.embedding.join(",")}]`;
        const metadataStr = chunk.metadata ? JSON.stringify(chunk.metadata) : null;
        return prisma.$executeRaw`
            INSERT INTO source_chunk (id, "sourceId", "workspaceId", content, "chunkIndex", embedding, metadata, "createdAt")
            VALUES (gen_random_uuid(), ${chunk.sourceId}, ${chunk.workspaceId}, ${chunk.content}, ${chunk.chunkIndex}, ${embeddingStr}::vector, ${metadataStr ? Prisma.sql`${metadataStr}::jsonb` : Prisma.sql`NULL`}, NOW())
        `;
    });

    await prisma.$transaction(queries);
}

export async function retrieveSimilarChunks(options: {
    workspaceId: string;
    queryEmbedding: number[];
    sourceIds?: string[];
    limit?: number;
}): Promise<RetrievedChunk[]> {
    const { workspaceId, queryEmbedding, sourceIds, limit = 8 } = options;

    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    let rows: any[];
    if (sourceIds && sourceIds.length > 0) {
        rows = await prisma.$queryRaw`
            SELECT sc.id, sc."sourceId", sc."workspaceId", sc.content, sc."chunkIndex", sc.metadata,
                   (1 - (sc.embedding <=> ${embeddingStr}::vector)) as score,
                   s.title as "sourceTitle"
            FROM source_chunk sc
            JOIN source s ON sc."sourceId" = s.id
            WHERE sc."workspaceId" = ${workspaceId}
              AND sc."sourceId" IN (${Prisma.join(sourceIds)})
            ORDER BY sc.embedding <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `;
    } else {
        rows = await prisma.$queryRaw`
            SELECT sc.id, sc."sourceId", sc."workspaceId", sc.content, sc."chunkIndex", sc.metadata,
                   (1 - (sc.embedding <=> ${embeddingStr}::vector)) as score,
                   s.title as "sourceTitle"
            FROM source_chunk sc
            JOIN source s ON sc."sourceId" = s.id
            WHERE sc."workspaceId" = ${workspaceId}
            ORDER BY sc.embedding <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `;
    }

    return rows.map((row) => ({
        id: row.id,
        sourceId: row.sourceId,
        workspaceId: row.workspaceId,
        content: row.content,
        chunkIndex: row.chunkIndex,
        embedding: null,
        metadata: row.metadata,
        score: Number(row.score),
        sourceTitle: row.sourceTitle,
    }));
}

/** @deprecated Use deleteChunksForWorkspace */
export async function deleteWorkspaceVectors(workspaceId: string) {
    await deleteChunksForWorkspace(workspaceId);
}
