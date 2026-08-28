import { inngest } from "./client.js";
import { processSourceFunction } from "./functions/process-source.js";

export const functions = [processSourceFunction];
