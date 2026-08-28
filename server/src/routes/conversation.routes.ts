import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
    createConversation,
    deleteConversation,
    getConversation,
    listConversations,
    listMessages,
    sendMessage,
} from "../controllers/conversation.controller.js";

export const conversationRoutes = Router({ mergeParams: true });

conversationRoutes.get("/", asyncHandler(listConversations));
conversationRoutes.post("/", asyncHandler(createConversation));
conversationRoutes.get("/:conversationId", asyncHandler(getConversation));
conversationRoutes.get("/:conversationId/messages", asyncHandler(listMessages));
conversationRoutes.post("/:conversationId/messages", asyncHandler(sendMessage));
conversationRoutes.delete("/:conversationId", asyncHandler(deleteConversation));
