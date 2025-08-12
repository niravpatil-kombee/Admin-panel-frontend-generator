import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import generatorRoutes from "./utils/generator"; 

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
// Serve uploaded files statically from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==========================================================
// DYNAMIC ROUTE LOADING FUNCTION
// ==========================================================
/**
 * Loads all generated .routes.ts files from the generated-backend directory.
 * This should be called after generation and before the server starts listening for requests
 * on subsequent runs.
 */
const loadGeneratedRoutes = () => {
  console.log("🔄 Attempting to load generated API routes...");
  const routesPath = path.join(__dirname, "./generated-backend/routes");

  if (fs.existsSync(routesPath)) {
    try {
      const routeFiles = fs.readdirSync(routesPath);
      if (routeFiles.length === 0) {
        console.log("🟡 Routes directory is empty. No custom routes to load.");
        return;
      }

      routeFiles.forEach((file) => {
        if (file.endsWith('.routes.js')) { // In a running app, these will be compiled to JS
          const routerPath = path.join(routesPath, file);
          const { default: router } = require(routerPath);
          if (router) {
            app.use(router); // Mount the dynamically loaded router
            console.log(`👍 Successfully loaded API routes from: ${file}`);
          }
        }
      });
    } catch (error) {
      console.error("❌ An error occurred while loading dynamic routes:", error);
    }
  } else {
    console.log("⚠️ 'generated-backend/routes' not found. Skipping route loading (normal on first run).");
  }
};

// ==========================================================
// API ENDPOINTS
// ==========================================================
// Use the dedicated router for the '/generate' endpoint
app.use(generatorRoutes);

// ==========================================================
// SERVER STARTUP
// ==========================================================
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/admin-panel-generator")
  .then(() => {
    console.log("✅ MongoDB Connected successfully");

    // Load any existing routes before the server starts
    loadGeneratedRoutes();

    app.listen(PORT, () => {
      console.log(`⚙️  Server is running at http://localhost:${PORT}`);
      console.log("🚀 Send a POST request with an Excel file to /generate to begin.");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error. Please ensure MongoDB is running.", err);
  });