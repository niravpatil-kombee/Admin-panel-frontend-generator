// src/utils/generator.ts

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import { setupFrontendProject } from "./setupFrontend";
import { parseExcel } from "./excelParser";

// Import all generators
import { generateFormComponent } from "./generators/formGenerator";
import { generateDashboardLayout } from "./generators/dashboardLayoutGenerator";
import { generateHeader } from "./generators/headerGenerator";
import { generateSidebar } from "./generators/sidebarGenerator";
import { generateAppRoutes } from "./generators/appRoutesGenerator";
import { generateListPage } from "./generators/listPageGenerator";
import { generateDashboard } from "./generators/dashboardGenerator";
import { generateIndexCss } from "./generators/indexCssGenerator";
import { generateLogin } from "./generators/loginGenerator";
// UPDATED: Import new theme and main.tsx generators
import {
  generateThemeProvider,
  generateThemeToggle,
} from "./generators/themeGenerator";
import { generateMainTsx } from "./generators/mainTsxGenerator";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/generate", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file." });

    console.log("\n🚀 Admin Panel Generation Process Started 🚀");
    setupFrontendProject();

    const models = parseExcel(req.file.path);
    const modelNames = Object.keys(models);
    fs.unlinkSync(req.file.path);

    if (modelNames.length === 0)
      return res.status(400).json({ message: "No models found." });

    console.log("Generating theme components...");
    generateThemeProvider();
    generateThemeToggle();


    console.log("Generating Login pages...");
    generateLogin();

    console.log("Generating layout...");
    generateDashboardLayout();
    generateHeader();
    generateSidebar(models);

    console.log("Generating dashboard page...");
    generateDashboard(modelNames);

    console.log("Generating CRUD components...");
    for (const modelName in models) {
      generateFormComponent(modelName, models[modelName]);
      generateListPage(modelName, models[modelName]);
    }

    console.log("Generating routes and application root...");
    generateAppRoutes(models);
    generateIndexCss();
    generateMainTsx(); // Generate the main entry point

    console.log(
      "\n✅ Generation Complete! Frontend is ready with theme toggling."
    );
    res
      .status(200)
      .json({ message: "Generation successful!", modelsGenerated: modelNames });
  } catch (error) {
    // ... (error handling)
  }
});

export default router;
