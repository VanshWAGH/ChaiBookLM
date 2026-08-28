import OpenAI from "openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const DEFAULT_CHAT_MODEL =
    process.env.OPENROUTER_CHAT_MODEL ?? "google/gemma-4-26b-a4b-it:free";

export const DEFAULT_EMBED_MODEL =
    process.env.OPENROUTER_EMBED_MODEL ?? "nvidia/nemotron-3-embed-1b:free";

function getClient() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is not configured");
    }

    return new OpenAI({
        apiKey,
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: {
            "HTTP-Referer": process.env.CLIENT_URL ?? "http://localhost:3000",
            "X-Title": "NotebookLM Clone",
        },
    });
}

export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export async function chatComplete(
    messages: ChatMessage[],
    model = DEFAULT_CHAT_MODEL,
) {
    const client = getClient();
    const response = await client.chat.completions.create({
        model,
        messages,
    });

    return response.choices[0]?.message?.content ?? "";
}

export async function* chatStream(
    messages: ChatMessage[],
    model = DEFAULT_CHAT_MODEL,
) {
    const client = getClient();
    const stream = await client.chat.completions.create({
        model,
        messages,
        stream: true,
    });

    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
            yield text;
        }
    }
}

export async function embedTexts(
    inputs: string[],
    model = DEFAULT_EMBED_MODEL,
): Promise<number[][]> {
    if (inputs.length === 0) {
        return [];
    }

    const client = getClient();
    const response = await client.embeddings.create({
        model,
        input: inputs,
        encoding_format: "float",
    });

    return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
}

export async function embedText(
    input: string,
    model = DEFAULT_EMBED_MODEL,
): Promise<number[]> {
    const [embedding] = await embedTexts([input], model);
    return embedding ?? [];
}
