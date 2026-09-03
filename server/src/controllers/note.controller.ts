import type { Request, Response } from "express";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";
import {
    createNoteSchema,
    noteIdParamSchema,
    updateNoteSchema,
} from "../validators/note.validator.js";
import { workspaceIdParamSchema } from "../validators/workspace.validator.js";
import {
    createNoteForWorkspace,
    deleteNoteForWorkspace,
    listNotesForWorkspace,
    updateNoteForWorkspace,
} from "../services/note.services.js";

export async function listNotes(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const notes = await listNotesForWorkspace(workspaceId, req.auth.userId!);
    res.json(notes);
}

export async function createNote(req: Request, res: Response) {
    const { workspaceId } = workspaceIdParamSchema.parse(req.params);
    const parsed = createNoteSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationError(
            "Validation failed",
            getZodFieldErrors(parsed.error),
        );
    }

    const note = await createNoteForWorkspace(
        workspaceId,
        req.auth.userId!,
        parsed.data,
    );
    res.status(201).json(note);
}

export async function updateNote(req: Request, res: Response) {
    const params = noteIdParamSchema.parse(req.params);
    const parsed = updateNoteSchema.safeParse(req.body);

    if (!parsed.success) {
        throw new ValidationError(
            "Validation failed",
            getZodFieldErrors(parsed.error),
        );
    }

    const note = await updateNoteForWorkspace(
        params.workspaceId,
        params.noteId,
        req.auth.userId!,
        parsed.data,
    );
    res.json(note);
}

export async function deleteNote(req: Request, res: Response) {
    const params = noteIdParamSchema.parse(req.params);
    await deleteNoteForWorkspace(
        params.workspaceId,
        params.noteId,
        req.auth.userId!,
    );
    res.status(204).send();
}
