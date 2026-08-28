import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { registerRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { inngest } from "./inngest/client.js";
import { serve } from "inngest/express";
import { functions } from "./inngest/index.js"
const app = express();
const PORT = process.env.PORT ?? "8081";
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3001";

app.use(
    cors({
        origin: (origin, callback) => callback(null, true),
        credentials: true,
    }),
);

app.use(clerkMiddleware());

app.use(express.json());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});


registerRoutes(app);

app.use(errorHandler)


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});