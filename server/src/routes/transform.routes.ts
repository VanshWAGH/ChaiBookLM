import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { transformText } from "../controllers/transform.controller.js";

export const transformRoutes = Router({ mergeParams: true });

transformRoutes.post("/", asyncHandler(transformText));
