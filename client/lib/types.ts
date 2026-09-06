export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

export type Workspace = {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    defaultModel: string;
    createdAt: string;
    updatedAt: string;
};

export type SourceType = "PDF" | "WEBSITE" | "YOUTUBE" | "TEXT" | "MARKDOWN";
export type SourceStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type Source = {
    id: string;
    workspaceId: string;
    type: SourceType;
    title: string;
    content: string | null;
    url: string | null;
    status: SourceStatus;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
};

export type Conversation = {
    id: string;
    workspaceId: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
};

export type Citation = {
    index: number;
    sourceId: string;
    chunkId: string;
    excerpt: string;
    sourceTitle?: string;
};

export type Message = {
    id: string;
    conversationId: string;
    role: "USER" | "ASSISTANT";
    content: string;
    citations: Citation[] | null;
    createdAt: string;
};

export type ArtifactType = "STUDY_GUIDE" | "FAQ" | "BRIEFING" | "TIMELINE" | "SUMMARY" | "CLAUSE_EXTRACTOR";
export type ArtifactStatus = "GENERATING" | "READY" | "FAILED";

export type Note = {
    id: string;
    workspaceId: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
};

export type TransformType = "SUMMARIZE" | "SIMPLIFY" | "TRANSLATE" | "EXPAND" | "FORMAL" | "CASUAL";

export type Artifact = {
    id: string;
    workspaceId: string;
    type: ArtifactType;
    title: string;
    content: string;
    status: ArtifactStatus;
    createdAt: string;
    updatedAt: string;
};

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public details?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}
