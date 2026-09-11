import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import productsRouter from "./routes/products.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import couponsRouter from "./routes/coupons.routes.js";
import cmsRouter from "./routes/cms.routes.js";
import paymentsRouter from "./routes/payments.routes.js";
import inventoryRouter from "./routes/inventory.routes.js";
import uploadRouter from "./routes/upload.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/cms", cmsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/upload", uploadRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    service: "RS Fashions Backend API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// Root welcome message
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #FAF7F2; min-height: 100vh; color: #2A2421;">
      <h1 style="font-family: Georgia, serif; font-size: 2.5rem; color: #8E3D51;">RS Fashions Backend Server</h1>
      <p style="font-size: 1.1rem; color: #6E6359; max-width: 600px; margin: 15px auto;">
        High-performance Node.js API with Supabase integration powering product inventory, order management, promo codes, and website CMS.
      </p>
      <div style="margin-top: 30px;">
        <a href="/api/health" style="background: #2A2421; color: #FAF7F2; padding: 10px 20px; border-radius: 99px; text-decoration: none; font-size: 0.9rem; margin: 0 8px;">Health Check</a>
        <a href="/api/products" style="background: #8E3D51; color: #FAF7F2; padding: 10px 20px; border-radius: 99px; text-decoration: none; font-size: 0.9rem; margin: 0 8px;">Products API</a>
      </div>
    </div>
  `);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error occurred",
  });
});

app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`✨ RS Fashions Backend Server is running!`);
  console.log(`🚀 Port: http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
  console.log(`🎁 Coupons API: http://localhost:${PORT}/api/coupons`);
  console.log(`📋 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`🎨 CMS API: http://localhost:${PORT}/api/cms`);
  console.log(`=================================================\n`);
});

export default app;
