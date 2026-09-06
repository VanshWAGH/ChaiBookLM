"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Workspace } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export function useWorkspaces() {
    return useQuery({
        queryKey: ["workspaces"],
        queryFn: () => apiFetch<Workspace[]>("/api/workspaces"),
    });
}

export function useWorkspace(workspaceId: string) {
    return useQuery({
        queryKey: ["workspaces", workspaceId],
        queryFn: () => apiFetch<Workspace>(`/api/workspaces/${workspaceId}`),
        enabled: Boolean(workspaceId),
    });
}

export function useCreateWorkspace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            title: string;
            description?: string;
            icon?: string;
        }) => apiFetch<Workspace>("/api/workspaces", { method: "POST", json: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            toast.add({ type: "success", title: "Notebook created" });
        },
        onError: (error) => {
            toast.add({ type: "error", title: "Failed to create notebook", description: error.message });
        },
    });
}

export function useUpdateWorkspace(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<{ title: string; description: string; icon: string; defaultModel: string }>) =>
            apiFetch<Workspace>(`/api/workspaces/${workspaceId}`, {
                method: "PATCH",
                json: data,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId] });
            toast.add({ type: "success", title: "Notebook updated" });
        },
        onError: (error) => {
            toast.add({ type: "error", title: "Failed to update notebook", description: error.message });
        },
    });
}

export function useDeleteWorkspace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (workspaceId: string) =>
            apiFetch<void>(`/api/workspaces/${workspaceId}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            toast.add({ type: "success", title: "Notebook deleted" });
        },
        onError: (error) => {
            toast.add({ type: "error", title: "Failed to delete notebook", description: error.message });
        },
    });
}
