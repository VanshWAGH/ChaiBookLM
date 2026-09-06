"use client";

import { useCallback, useState } from "react";
import { API_URL, type TransformType } from "@/lib/types";
import { getAuthToken } from "@/lib/auth-token";

export function useTransformStream(workspaceId: string) {
    const [streaming, setStreaming] = useState(false);
    const [streamText, setStreamText] = useState("");

    const transform = useCallback(
        async (text: string, type: TransformType) => {
            if (!text.trim()) return;

            setStreaming(true);
            setStreamText("");

            try {
                const token = await getAuthToken();
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const response = await fetch(
                    `${API_URL}/api/workspaces/${workspaceId}/transform`,
                    {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ text, type }),
                    }
                );

                if (!response.ok || !response.body) {
                    throw new Error("Failed to start transformation");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split("\n\n");
                    buffer = parts.pop() ?? "";

                    for (const part of parts) {
                        const lines = part.split("\n");
                        const eventLine = lines.find((l) => l.startsWith("event:"));
                        const dataLine = lines.find((l) => l.startsWith("data:"));

                        if (!dataLine) continue;

                        const event = eventLine?.replace("event: ", "") ?? "token";
                        const data = dataLine.replace("data: ", "");

                        if (event === "token") {
                            const parsed = JSON.parse(data) as { token: string };
                            setStreamText((prev) => prev + parsed.token);
                        } else if (event === "error") {
                            const parsed = JSON.parse(data) as { error: string };
                            throw new Error(parsed.error || "Transform error");
                        }
                    }
                }
            } catch (error) {
                console.error("Transform stream error:", error);
                throw error;
            } finally {
                setStreaming(false);
            }
        },
        [workspaceId]
    );

    const reset = useCallback(() => {
        setStreamText("");
        setStreaming(false);
    }, []);

    return { transform, streaming, streamText, reset };
}
