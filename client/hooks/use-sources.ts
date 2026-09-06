"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiUpload } from "@/lib/api";
import type { Source } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export function useSources(workspaceId: string) {
    return useQuery({
        queryKey: ["sources", workspaceId],
        queryFn: () =>
            apiFetch<Source[]>(`/api/workspaces/${workspaceId}/sources`),
        enabled: Boolean(workspaceId),
        refetchInterval: (query) => {
            const sources = query.state.data;
            if (sources?.some((s) => s.status === "PENDING" || s.status === "PROCESSING")) {
                return 3000;
            }
            return false;
        },
    });
}

export function useSource(workspaceId: string, sourceId: string | null) {
    return useQuery({
        queryKey: ["sources", workspaceId, sourceId],
        queryFn: () =>
            apiFetch<Source>(`/api/workspaces/${workspaceId}/sources/${sourceId}`),
        enabled: Boolean(workspaceId && sourceId),
    });
}

export function useCreateTextSource(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            type: "TEXT" | "MARKDOWN";
            title: string;
            content: string;
        }) =>
            apiFetch<Source>(`/api/workspaces/${workspaceId}/sources`, {
                method: "POST",
                json: data,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
            toast.add({ type: "success", title: "Text source created" });
        },
        onError: (error) => {
            toast.add({ type: "error", title: "Failed to create source", description: error.message });
        },
    });
}

export function useUploadPdf(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { file: File; title?: string }) => {
            const form = new FormData();
            form.append("file", data.file);
            if (data.title) {
                form.append("title", data.title);
            }
            return apiUpload<Source>(
                `/api/workspaces/${workspaceId}/sources/upload`,
                form,
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
            toast.add({ type: "success", title: "PDF uploaded successfully" });
        },
        onError: (error) => {
            toast.add({ type: "error", title: "Failed to upload PDF", description: error.message });
        },
    });
}

export function useImportWebsite(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { url: string; title?: string }) =>
            apiFetch<Source>(
                `/api/workspaces/${workspaceId}/sources/import/website`,
                { method: "POST", json: data },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
        },
    });
}

export function useImportYoutube(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { url: string; title?: string }) =>
            apiFetch<Source>(
                `/api/workspaces/${workspaceId}/sources/import/youtube`,
                { method: "POST", json: data },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
        },
    });
}

export function useDeleteSource(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sourceId: string) =>
            apiFetch<void>(
                `/api/workspaces/${workspaceId}/sources/${sourceId}`,
                { method: "DELETE" },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sources", workspaceId] });
            toast.add({ type: "success", title: "Source deleted" });
        },
        onError: (error) => {
            toast.add({ type: "error", title: "Failed to delete source", description: error.message });
        },
    });
}
