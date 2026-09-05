import { processSourceDirectly } from "../inngest/functions/process-source.js";
import { inngest } from "../inngest/client.js";

export interface SourceProcessingEvent {
    sourceId: string;
    workspaceId: string;
}

export async function enqueueSourceProcessing(
    event: SourceProcessingEvent,
): Promise<void> {
    if (process.env.NODE_ENV !== "production" && !process.env.INNGEST_EVENT_KEY) {
        console.log("Processing source directly (local mode)");
        void processSourceDirectly(event.sourceId, event.workspaceId);
        return;
    }

    try {
        await inngest.send({
            name: "source/process",
            data: event,
        });
    } catch (error) {
        console.warn(
            "Inngest unavailable, processing source directly:",
            error instanceof Error ? error.message : error,
        );
        void processSourceDirectly(event.sourceId, event.workspaceId);
    }
}
