/** Split text into overlapping chunks (~800 chars with 100 char overlap). */
export function chunkText(
    text: string,
    chunkSize = 800,
    overlap = 100,
): string[] {
    const normalized = text.replace(/\r\n/g, "\n").trim();
    if (!normalized) {
        return [];
    }

    if (normalized.length <= chunkSize) {
        return [normalized];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
        const end = Math.min(start + chunkSize, normalized.length);
        chunks.push(normalized.slice(start, end));

        if (end >= normalized.length) {
            break;
        }

        start = Math.max(0, end - overlap);
    }

    return chunks;
}

export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0 || a.length !== b.length) {
        return 0;
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i]! * b[i]!;
        normA += a[i]! * a[i]!;
        normB += b[i]! * b[i]!;
    }

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
