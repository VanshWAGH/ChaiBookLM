import { inngest } from "../client.js";
import prisma from "../../lib/db.js";
import { chunkText } from "../../lib/chunk.js";
import { embedTexts } from "../../lib/openrouter.js";
import { extractPdfFromCloudinary } from "../../lib/pdf.js";
import {
    deleteChunksForSource,
    insertChunks,
} from "../../lib/vector-store.js";

async function extractSourceContent(sourceId: string): Promise<string> {
    const source = await prisma.source.findUnique({
        where: { id: sourceId },
    });

    if (!source) {
        throw new Error("Source not found");
    }

    if (source.content?.trim()) {
        return source.content.trim();
    }

    if (source.type === "PDF") {
        const metadata = source.metadata as {
            fileUrl?: string;
            publicId?: string;
            resourceType?: "raw" | "image";
        } | null;

        if (!metadata?.fileUrl) {
            throw new Error("PDF source missing file URL");
        }

        const extracted = await extractPdfFromCloudinary({
            fileUrl: metadata.fileUrl,
            ...(metadata.publicId ? { publicId: metadata.publicId } : {}),
            ...(metadata.resourceType
                ? { resourceType: metadata.resourceType }
                : {}),
        });

        await prisma.source.update({
            where: { id: sourceId },
            data: { content: extracted.text },
        });

        return extracted.text;
    }

    throw new Error("No content available for source");
}

async function chunkAndEmbedSource(
    sourceId: string,
    workspaceId: string,
    content: string,
) {
    await deleteChunksForSource(sourceId);

    const chunks = chunkText(content);
    if (chunks.length === 0) {
        throw new Error("No chunks produced from content");
    }

    const embeddings = await embedTexts(chunks);

    await insertChunks(
        chunks.map((chunk, index) => ({
            sourceId,
            workspaceId,
            content: chunk,
            chunkIndex: index,
            embedding: embeddings[index] ?? [],
        })),
    );
}

export async function processSourceDirectly(
    sourceId: string,
    workspaceId: string,
) {
    await prisma.source.update({
        where: { id: sourceId },
        data: { status: "PROCESSING" },
    });

    try {
        const content = await extractSourceContent(sourceId);
        await chunkAndEmbedSource(sourceId, workspaceId, content);

        await prisma.source.update({
            where: { id: sourceId },
            data: { status: "READY" },
        });
    } catch (error) {
        await prisma.source.update({
            where: { id: sourceId },
            data: { status: "FAILED" },
        });
        throw error;
    }
}

export const processSourceFunction = inngest.createFunction(
    {
        id: "process-source",
        retries: 2,
        triggers: [{ event: "source/process" }],
    },
    async ({ event, step }) => {
        const { sourceId, workspaceId } = event.data;

        await step.run("mark-processing", async () => {
            await prisma.source.update({
                where: { id: sourceId },
                data: { status: "PROCESSING" },
            });
        });

        try {
            const content = await step.run("extract-content", () =>
                extractSourceContent(sourceId),
            );

            await step.run("chunk-and-embed", () =>
                chunkAndEmbedSource(sourceId, workspaceId, content),
            );

            await step.run("mark-ready", async () => {
                await prisma.source.update({
                    where: { id: sourceId },
                    data: { status: "READY" },
                });
            });

            return { sourceId, status: "READY" };
        } catch (error) {
            await step.run("mark-failed", async () => {
                await prisma.source.update({
                    where: { id: sourceId },
                    data: { status: "FAILED" },
                });
            });

            throw error;
        }
    },
);
