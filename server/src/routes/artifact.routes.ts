import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
    deleteArtifact,
    generateBriefing,
    generateFaq,
    generateStudyGuide,
    generateTimeline,
    generateSummary,
    generateClauseExtractor,
    getArtifact,
    listArtifacts,
} from "../controllers/artifact.controller.js";

export const artifactRoutes = Router({ mergeParams: true });

artifactRoutes.get("/", asyncHandler(listArtifacts));
artifactRoutes.get("/:artifactId", asyncHandler(getArtifact));
artifactRoutes.delete("/:artifactId", asyncHandler(deleteArtifact));
artifactRoutes.post("/study-guide", asyncHandler(generateStudyGuide));
artifactRoutes.post("/faq", asyncHandler(generateFaq));
artifactRoutes.post("/briefing", asyncHandler(generateBriefing));
artifactRoutes.post("/timeline", asyncHandler(generateTimeline));
artifactRoutes.post("/summary", asyncHandler(generateSummary));
artifactRoutes.post("/clause-extractor", asyncHandler(generateClauseExtractor));
