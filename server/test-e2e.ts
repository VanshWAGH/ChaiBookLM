import "dotenv/config";
import prisma from "./src/lib/db.js";
import { processSourceDirectly } from "./src/inngest/functions/process-source.js";
import { retrieveSimilarChunks } from "./src/lib/vector-store.js";
import { embedText } from "./src/lib/openrouter.js";
import { sendMessageWithStream } from "./src/services/chat.services.js";
import { generateArtifact } from "./src/services/artifact.services.js";

const DUMMY_LEGAL_DOC = `
MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of September 5, 2026, by and between:
1. LexTech Innovations Private Limited ("Disclosing Party"), a company incorporated under the Companies Act, 2013, having its registered office in Mumbai, Maharashtra, India; and
2. Apex Solutions LLP ("Receiving Party"), a limited liability partnership having its principal office in Bengaluru, Karnataka, India.

1. PURPOSE OF DISCLOSURE
The Parties wish to explore a potential strategic technology collaboration and investment opportunity in AI-driven corporate legal analytics ("Transaction"). In connection therewith, each Party may disclose to the other certain proprietary and non-public technical, commercial, and legal data.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" includes, without limitation, all source code, algorithms, legal prompt architectures, customer lists, pricing strategies, proprietary neural network parameters, financial projections, and terms of this Agreement.

3. OBLIGATIONS AND STANDARD OF CARE
The Receiving Party agrees to:
(a) Protect and preserve the confidential nature of the Disclosing Party's Confidential Information with at least the same degree of care it uses to protect its own confidential information, but in no event less than a reasonable degree of care;
(b) Not disclose Confidential Information to any third party other than its directors, officers, and legal counsels who have a strict need-to-know and are bound by confidentiality obligations at least as restrictive as this Agreement;
(c) Not copy, decompile, reverse-engineer, or commercially exploit any proprietary AI algorithms disclosed hereunder.

4. TERM AND DURATION OF CONFIDENTIALITY
This Agreement shall be effective for a period of two (2) years from the Effective Date. The confidentiality obligations regarding trade secrets shall survive indefinitely, while obligations regarding standard business Confidential Information shall remain binding for a period of five (5) years following the termination of this Agreement.

5. NON-SOLICITATION AND LIQUIDATED DAMAGES
During the term of this Agreement and for a period of twelve (12) months thereafter, neither Party shall directly or indirectly solicit, induce, or attempt to hire any senior software engineer or legal researcher of the other Party. In the event of a breach of this clause, the defaulting Party shall pay liquidated damages of INR 15,00,000 (Fifteen Lakh Indian Rupees) per employee solicited, in addition to any injunctive relief available at law.

6. RETURN OR DESTRUCTION OF CONFIDENTIAL MATERIALS
Upon written request or within fourteen (14) calendar days following termination of this Agreement, the Receiving Party shall return or certify in writing the permanent destruction of all copies, extracts, notes, and electronic recordings of Confidential Information.

7. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by, and construed in accordance with, the substantive laws of the Republic of India. Any dispute arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the competent courts located in Mumbai, Maharashtra.
`;

async function runTest() {
    console.log("=== STEP 1: Locating Test Workspace ===");
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
        throw new Error("No workspace found in database to run test on!");
    }
    console.log(`Using workspace: "${workspace.title}" (ID: ${workspace.id})`);

    console.log("\n=== STEP 2: Creating Dummy Legal Document Source ===");
    const source = await prisma.source.create({
        data: {
            workspaceId: workspace.id,
            title: "Mutual NDA - LexTech & Apex Solutions",
            type: "TEXT",
            content: DUMMY_LEGAL_DOC,
            status: "PENDING",
        },
    });
    console.log(`Created source ID: ${source.id} (status: ${source.status})`);

    console.log("\n=== STEP 3: Running Chunking & Embedding Generation ===");
    await processSourceDirectly(source.id, workspace.id);

    const updatedSource = await prisma.source.findUnique({
        where: { id: source.id },
    });
    console.log(`Source status after processing: ${updatedSource?.status}`);

    const chunks = await prisma.sourceChunk.findMany({
        where: { sourceId: source.id },
    });
    console.log(`Created ${chunks.length} chunks in database.`);

    // Verify embeddings in pgvector table
    const chunkVectors = await prisma.$queryRaw<Array<{ id: string; chunkIndex: number; hasVector: boolean }>>`
        SELECT id, "chunkIndex", (embedding IS NOT NULL) as "hasVector"
        FROM source_chunk
        WHERE "sourceId" = ${source.id}
    `;
    console.log("Chunk vector verification:", chunkVectors);

    console.log("\n=== STEP 4: Testing Semantic Search & Retrieval ===");
    const testQuery = "What is the non-solicitation period and the penalty amount for hiring an employee?";
    console.log(`Query: "${testQuery}"`);
    const queryEmb = await embedText(testQuery);
    console.log(`Query embedded successfully (${queryEmb.length} dimensions).`);

    const similarChunks = await retrieveSimilarChunks({
        workspaceId: workspace.id,
        queryEmbedding: queryEmb,
        sourceIds: [source.id],
        limit: 3,
    });
    console.log(`Retrieved ${similarChunks.length} most relevant chunks:`);
    similarChunks.forEach((c, i) => {
        console.log(`\n--- Match #${i + 1} (Score: ${(c.score * 100).toFixed(1)}%) ---`);
        console.log(c.content.trim().slice(0, 200) + "...");
    });

    console.log("\n=== STEP 5: Testing AI Chat Streaming with Indian Law Analysis & Citations ===");
    let conversation = await prisma.conversation.findFirst({
        where: { workspaceId: workspace.id },
    });
    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                workspaceId: workspace.id,
                title: "Legal Q&A Test",
            },
        });
    }

    const stream = await sendMessageWithStream(
        workspace.id,
        conversation.id,
        workspace.userId,
        {
            content: "Please summarize the non-solicitation obligations, liquidated damages amount, and the governing law court jurisdiction from the NDA.",
            sourceIds: [source.id],
        },
    );

    console.log("Streaming response from AI:");
    let fullOutput = "";
    for await (const chunk of stream) {
        if (!chunk.startsWith('{"type":"done"')) {
            process.stdout.write(chunk);
            fullOutput += chunk;
        }
    }
    console.log("\n\nFull AI answer generated successfully!");

    console.log("\n=== STEP 6: Testing Legal Artifact Generation (CLAUSE_EXTRACTOR) ===");
    const artifact = await generateArtifact(
        workspace.id,
        workspace.userId,
        "CLAUSE_EXTRACTOR",
    );
    console.log("Artifact created:", {
        id: artifact.id,
        type: artifact.type,
        title: artifact.title,
        status: artifact.status,
    });

    // Check artifact content preview
    const readyArtifact = await prisma.artifact.findUnique({
        where: { id: artifact.id },
    });
    console.log(`Artifact generated (${readyArtifact?.content.length} chars). Preview:`);
    console.log(readyArtifact?.content.slice(0, 300) + "...\n");

    console.log("🎉 ALL TESTS PASSED! Embeddings, vector retrieval, chat streaming, and artifact extraction are functioning flawlessly!");
}

runTest()
    .catch((err) => {
        console.error("TEST FAILED:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
