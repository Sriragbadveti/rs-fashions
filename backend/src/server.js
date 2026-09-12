import express from "express";
import cors from "cors";
import { ENV, validateEnv } from "./config/env.js";
import { checkDatabaseConnection } from "./config/supabase.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { successResponse } from "./utils/response.js";
import apiRouter from "./routes/index.js";

validateEnv();

const app = express();
const PORT = ENV.PORT;

// Standard Middlewares
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(requestLogger);

// System Health & Diagnostics
app.get("/api/health", async (req, res) => {
  const dbHealth = await checkDatabaseConnection();
  return successResponse(res, {
    status: "healthy",
    database: dbHealth,
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
  }, "RS Fashions Backend Service is active and healthy");
});

// Central API Router
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.send("RS Fashions Unified API Service is operational.");
});

// Centralized Error Handling
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`[RS Fashions] Clean MVC Backend API running on port ${PORT}`);
  console.log(`[RS Fashions] Health check: http://localhost:${PORT}/api/health`);
});
