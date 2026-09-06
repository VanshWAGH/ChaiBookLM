import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { API_URL } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { getAuthToken } from "@/lib/auth-token";
import type { Citation, Conversation, Message } from "@/lib/types";

export function useConversations(workspaceId: string) {
    return useQuery({
        queryKey: ["conversations", workspaceId],
        queryFn: () =>
            apiFetch<Conversation[]>(
                `/api/workspaces/${workspaceId}/conversations`,
            ),
        enabled: Boolean(workspaceId),
    });
}

export function useMessages(workspaceId: string, conversationId: string | null) {
    return useQuery({
        queryKey: ["messages", workspaceId, conversationId],
        queryFn: () =>
            apiFetch<Message[]>(
                `/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
            ),
        enabled: Boolean(workspaceId && conversationId),
    });
}

export function useCreateConversation(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (title?: string) =>
            apiFetch<Conversation>(
                `/api/workspaces/${workspaceId}/conversations`,
                { method: "POST", json: { title } },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["conversations", workspaceId],
            });
        },
    });
}

export function useDeleteConversation(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (conversationId: string) =>
            apiFetch<void>(
                `/api/workspaces/${workspaceId}/conversations/${conversationId}`,
                { method: "DELETE" },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["conversations", workspaceId],
            });
        },
    });
}

export function useChatStream(workspaceId: string, conversationId: string | null) {
    const queryClient = useQueryClient();
    const [streaming, setStreaming] = useState(false);
    const [streamText, setStreamText] = useState("");
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const sendMessage = useCallback(
        async (content: string, sourceIds?: string[]) => {
            if (!conversationId) {
                return;
            }

            setStreaming(true);
            setStreamText("");
            setError(null);

            try {
                await queryClient.invalidateQueries({
                    queryKey: ["messages", workspaceId, conversationId],
                });

                const token = await getAuthToken();
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const response = await fetch(
                    `${API_URL}/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
                    {
                        method: "POST",
                        headers,
                        body: JSON.stringify({ content, sourceIds }),
                    },
                );

                if (!response.ok || !response.body) {
                    const errData = await response.json().catch(() => null);
                    throw new Error(errData?.error || `Request failed with status ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split("\n\n");
                    buffer = parts.pop() ?? "";

                    for (const part of parts) {
                        const lines = part.split("\n");
                        const eventLine = lines.find((l) => l.startsWith("event:"));
                        const dataLine = lines.find((l) => l.startsWith("data:"));

                        if (!dataLine) {
                            continue;
                        }

                        const event = eventLine?.replace("event: ", "") ?? "token";
                        const data = dataLine.replace("data: ", "");

                        if (event === "token") {
                            const parsed = JSON.parse(data) as { token: string };
                            setStreamText((prev) => prev + parsed.token);
                        } else if (event === "error") {
                            const parsed = JSON.parse(data) as { error: string };
                            throw new Error(parsed.error || "Stream error");
                        }
                    }
                }
            } catch (err: any) {
                console.error("Chat stream error:", err);
                setError(err?.message || "Failed to send message");
            } finally {
                setStreaming(false);
                setStreamText("");
                await queryClient.invalidateQueries({
                    queryKey: ["messages", workspaceId, conversationId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["conversations", workspaceId],
                });
            }
        },
        [conversationId, queryClient, workspaceId],
    );

    return { sendMessage, streaming, streamText, error, clearError };
}

export type { Citation };
