import type { Express } from "express";
import { workspaceRoutes } from "./workspace.routes.js";
import { sourceRoutes } from "./source.routes.js";
import { conversationRoutes } from "./conversation.routes.js";
import { artifactRoutes } from "./artifact.routes.js";

export function registerRoutes(app: Express): void {
    workspaceRoutes.use("/:workspaceId/sources", sourceRoutes);
    workspaceRoutes.use("/:workspaceId/conversations", conversationRoutes);
    workspaceRoutes.use("/:workspaceId/artifacts", artifactRoutes);
    app.use("/api/workspaces", workspaceRoutes);
}
