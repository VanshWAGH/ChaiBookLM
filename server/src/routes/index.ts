import type { Express } from "express";
import { workspaceRoutes } from "./workspace.routes.js";
import { sourceRoutes } from "./source.routes.js";
import { conversationRoutes } from "./conversation.routes.js";
import { artifactRoutes } from "./artifact.routes.js";
import { noteRoutes } from "./note.routes.js";
import { transformRoutes } from "./transform.routes.js";

export function registerRoutes(app: Express): void {
    workspaceRoutes.use("/:workspaceId/sources", sourceRoutes);
    workspaceRoutes.use("/:workspaceId/conversations", conversationRoutes);
    workspaceRoutes.use("/:workspaceId/artifacts", artifactRoutes);
    workspaceRoutes.use("/:workspaceId/notes", noteRoutes);
    workspaceRoutes.use("/:workspaceId/transform", transformRoutes);
    app.use("/api/workspaces", workspaceRoutes);
}
