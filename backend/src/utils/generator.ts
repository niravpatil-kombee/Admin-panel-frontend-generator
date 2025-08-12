// src/utils/generator.ts
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

// ✅ Import execSync types if needed later
// import { ExecSyncOptions } from "child_process";

// ✅ Use the shared setup function instead of redefining it
import { setupFrontendProject } from "./setupFrontend";

import { parseExcel } from "./excelParser";
import { generateFormComponent } from "./formGenerator";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/generate", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No Excel file uploaded. Please attach a file with the key 'file'.",
      });
    }

    console.log("\n🚀 Admin Panel Generation Process Started 🚀");

    // ✅ Now calling the shared setup function
    setupFrontendProject();

    console.log("Parsing your Excel sheet...");
    const models = parseExcel(req.file.path);

    // Cleanup upload
    fs.unlinkSync(req.file.path);

    if (Object.keys(models).length === 0) {
      return res.status(400).json({
        message: "No models found in the Excel file. Ensure at least one sheet has rows with `is_input_form` set to 'Y'.",
      });
    }

    console.log(`Found models to generate: ${Object.keys(models).join(", ")}`);

    console.log("Generating type-safe Shadcn UI forms...");
    for (const modelName in models) {
      generateFormComponent(modelName, models[modelName]);
    }

    console.log("\n✅ Generation Complete! Your forms are ready in 'frontend/src/components/generated'");
    res.status(200).json({
      message: "Project setup and form generation completed successfully!",
      modelsGenerated: Object.keys(models),
    });

  } catch (error) {
    const err = error as Error;
    console.error("❌ A critical error occurred during code generation:", err);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Code generation failed",
      error: err.message,
      stack: err.stack,
    });
  }
});

export default router;
