import {
    createNoteRecord,
    deleteNoteRecord,
    findNoteById,
    findNotesByWorkspace,
    updateNoteRecord,
} from "../repository/note.repository.js";
import { NotFoundError } from "../types/app-error.js";
import { getWorkspaceByIdForUser } from "./workspace.services.js";
import type {
    CreateNoteInput,
    UpdateNoteInput,
} from "../validators/note.validator.js";

async function assertWorkspace(workspaceId: string, userId: string) {
    return getWorkspaceByIdForUser(workspaceId, userId);
}

export async function listNotesForWorkspace(
    workspaceId: string,
    userId: string,
) {
    await assertWorkspace(workspaceId, userId);
    return findNotesByWorkspace(workspaceId);
}

export async function getNoteForWorkspace(
    workspaceId: string,
    noteId: string,
    userId: string,
) {
    await assertWorkspace(workspaceId, userId);

    const note = await findNoteById(noteId, workspaceId);
    if (!note) {
        throw new NotFoundError("Note not found");
    }

    return note;
}

export async function createNoteForWorkspace(
    workspaceId: string,
    userId: string,
    input: CreateNoteInput,
) {
    await assertWorkspace(workspaceId, userId);
    
    const data: { workspaceId: string; title: string; content?: string } = {
        workspaceId,
        title: input.title,
    };
    if (input.content !== undefined) data.content = input.content;

    return createNoteRecord(data);
}

export async function updateNoteForWorkspace(
    workspaceId: string,
    noteId: string,
    userId: string,
    input: UpdateNoteInput,
) {
    await getNoteForWorkspace(workspaceId, noteId, userId);
    
    const updateData: { title?: string; content?: string; isPinned?: boolean } = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.isPinned !== undefined) updateData.isPinned = input.isPinned;

    return updateNoteRecord(noteId, updateData);
}

export async function deleteNoteForWorkspace(
    workspaceId: string,
    noteId: string,
    userId: string,
) {
    await getNoteForWorkspace(workspaceId, noteId, userId);
    await deleteNoteRecord(noteId);
}
