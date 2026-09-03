import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
    createNote,
    deleteNote,
    listNotes,
    updateNote,
} from "../controllers/note.controller.js";

export const noteRoutes = Router({ mergeParams: true });

noteRoutes.get("/", asyncHandler(listNotes));
noteRoutes.post("/", asyncHandler(createNote));
noteRoutes.patch("/:noteId", asyncHandler(updateNote));
noteRoutes.delete("/:noteId", asyncHandler(deleteNote));
