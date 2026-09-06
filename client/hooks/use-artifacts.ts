"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Artifact, ArtifactType } from "@/lib/types";
import { toast } from "@/components/ui/toast";

const artifactEndpoints: Record<ArtifactType, string> = {
    STUDY_GUIDE: "study-guide",
    FAQ: "faq",
    BRIEFING: "briefing",
    TIMELINE: "timeline",
    SUMMARY: "summary",
    CLAUSE_EXTRACTOR: "clause-extractor",
};

export function useArtifacts(workspaceId: string) {
    return useQuery({
        queryKey: ["artifacts", workspaceId],
        queryFn: () =>
            apiFetch<Artifact[]>(`/api/workspaces/${workspaceId}/artifacts`),
        enabled: Boolean(workspaceId),
        refetchInterval: (query) => {
            const artifacts = query.state.data;
            if (artifacts?.some((a) => a.status === "GENERATING")) {
                return 3000;
            }
            return false;
        },
    });
}

export function useGenerateArtifact(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (type: ArtifactType) =>
            apiFetch<Artifact>(
                `/api/workspaces/${workspaceId}/artifacts/${artifactEndpoints[type]}`,
                { method: "POST", json: {} },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["artifacts", workspaceId] });
            toast.add({ type: "success", title: "Artifact generation started" });
        },
        onError: (error) => {
            toast.add({ type: "error", title: "Failed to generate artifact", description: error.message });
        },
    });
}

export function useDeleteArtifact(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (artifactId: string) =>
            apiFetch<void>(
                `/api/workspaces/${workspaceId}/artifacts/${artifactId}`,
                { method: "DELETE" },
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["artifacts", workspaceId] });
            toast.add({ type: "success", title: "Artifact deleted" });
        },
        onError: (error) => {
            toast.add({ type: "error", title: "Failed to delete artifact", description: error.message });
        },
    });
}
