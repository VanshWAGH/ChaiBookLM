"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Note } from "@/lib/types";
import { toast } from "@/components/ui/toast";

export function useNotes(workspaceId: string) {
    return useQuery({
        queryKey: ["notes", workspaceId],
        queryFn: () =>
            apiFetch<Note[]>(`/api/workspaces/${workspaceId}/notes`),
        enabled: Boolean(workspaceId),
    });
}

export function useCreateNote(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { title: string; content?: string }) =>
            apiFetch<Note>(`/api/workspaces/${workspaceId}/notes`, {
                method: "POST",
                json: data,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes", workspaceId] });
            toast.add({ type: "success", title: "Note created" });
        },
        onError: (error: Error) => {
            toast.add({
                type: "error",
                title: "Failed to create note",
                description: error.message,
            });
        },
    });
}

export function useUpdateNote(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            noteId,
            data,
        }: {
            noteId: string;
            data: { title?: string; content?: string; isPinned?: boolean };
        }) =>
            apiFetch<Note>(`/api/workspaces/${workspaceId}/notes/${noteId}`, {
                method: "PATCH",
                json: data,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes", workspaceId] });
        },
        onError: (error: Error) => {
            toast.add({
                type: "error",
                title: "Failed to update note",
                description: error.message,
            });
        },
    });
}

export function useDeleteNote(workspaceId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (noteId: string) =>
            apiFetch<void>(`/api/workspaces/${workspaceId}/notes/${noteId}`, {
                method: "DELETE",
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notes", workspaceId] });
            toast.add({ type: "success", title: "Note deleted" });
        },
        onError: (error: Error) => {
            toast.add({
                type: "error",
                title: "Failed to delete note",
                description: error.message,
            });
        },
    });
}
