import { processSourceDirectly } from "../inngest/functions/process-source.js";
import { inngest } from "../inngest/client.js";

export interface SourceProcessingEvent {
    sourceId: string;
    workspaceId: string;
}

export async function enqueueSourceProcessing(
    event: SourceProcessingEvent,
): Promise<void> {
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
