// src/utils/setupFrontend.ts

import fs from "fs";
import path from "path";
import { execSync, ExecSyncOptions } from "child_process";
import { parse } from "jsonc-parser";

export function setupFrontendProject(): void {
  const parentDir = path.resolve(process.cwd(), "..");
  const baseDir = path.join(parentDir, "frontend");
  console.log(`📦 Scaffolding frontend project at: ${baseDir}`);

  const execOptions: ExecSyncOptions = {
    stdio: "inherit",
    shell: process.platform === "win32" ? "cmd.exe" : undefined,
  };

  // Step 1: Create Vite project (React + TS)
  if (!fs.existsSync(baseDir)) {
    execSync(`npm create vite@latest frontend -- --template react-ts`, {
      ...execOptions,
      cwd: parentDir,
    });
  } else {
    console.log("⚠️ Frontend folder already exists, skipping Vite init.");
  }

  const frontendExecOptions: ExecSyncOptions = { ...execOptions, cwd: baseDir };

  // Step 2: Install general dependencies
  console.log("📦 Installing app dependencies...");
  execSync(
    `npm install axios react-router-dom lucide-react class-variance-authority tailwind-variants react-hook-form zod @hookform/resolvers clsx tailwind-merge`,
    frontendExecOptions
  );

  // Step 3: Install TailwindCSS v3 (Shadcn compatible)
  console.log("🎨 Installing TailwindCSS and dev dependencies...");
  execSync(
    `npm install tailwindcss @tailwindcss/vite tailwindcss-animate @types/node`,
    frontendExecOptions
  );

  // Step 3: index.css for Tailwind directives
  const indexCssPath = path.join(baseDir, "src", "index.css");
  console.log("🎨 Creating index.css...");
  if (fs.existsSync(indexCssPath)) {
    fs.writeFileSync(indexCssPath, `@import "tailwindcss";`);
  }

  // Step 4: Setup alias in tsconfig.json BEFORE running shadcn init
  // Replace your existing updateTsConfigPaths function with this one:
  const updateTsConfigPaths = (tsconfigFile: string) => {
    const tsconfigPath = path.join(baseDir, tsconfigFile);

    if (!fs.existsSync(tsconfigPath)) {
      console.warn(`⚠️ ${tsconfigFile} not found, skipping.`);
      return;
    }

    const tsconfigRaw = fs.readFileSync(tsconfigPath, "utf8");
    const tsconfig = parse(tsconfigRaw) || {};

    if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
    tsconfig.compilerOptions.baseUrl = ".";
    tsconfig.compilerOptions.paths = {
      ...(tsconfig.compilerOptions.paths || {}),
      "@/*": ["./src/*"],
    };

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log(`✅ Updated ${tsconfigFile} with baseUrl and @/* path alias`);
  };

  // Call for both configs
  updateTsConfigPaths("tsconfig.json");
  updateTsConfigPaths("tsconfig.app.json");

  // Step 5: Write vite.config.ts with __dirname fix for ESM
  fs.writeFileSync(
    path.join(baseDir, "vite.config.ts"),
    `import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`
  );

  // Step 6: Configure and Install Shadcn UI by creating components.json manually
  console.log("🎨 Configuring and installing Shadcn UI...");
  const shadcnUiDir = path.join(baseDir, "src", "components", "ui");

  if (!fs.existsSync(shadcnUiDir)) {
    // 6.1: Create components.json
    const componentsJsonPath = path.join(baseDir, "components.json");
    if (!fs.existsSync(componentsJsonPath)) {
      const componentsJsonContent = {
        $schema: "https://ui.shadcn.com/schema.json",
        style: "default",
        rsc: false,
        tsx: true,
        tailwind: {
          config: "",
          css: "src/App.css",
          baseColor: "slate",
          cssVariables: true,
          prefix: "",
        },
        aliases: {
          components: "@/components",
          utils: "@/lib/utils",
          ui: "@/components/ui",
          lib: "@/lib",
          hooks: "@/hooks",
        },
        iconLibrary: "lucide",
      };
      fs.writeFileSync(
        componentsJsonPath,
        JSON.stringify(componentsJsonContent, null, 2)
      );
      console.log("✅ Created components.json configuration.");
    }

    // 6.2: Create the lib directory and the utils.ts file
    const libDir = path.join(baseDir, "src", "lib");
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }
    const utilsPath = path.join(libDir, "utils.ts");
    if (!fs.existsSync(utilsPath)) {
      fs.writeFileSync(
        utilsPath,
        `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
      );
      console.log("✅ Generated Shadcn UI utils file.");
    }

    // 6.3: Run 'shadcn add' which will now work correctly
    try {
      console.log("📦 Adding Shadcn UI components...");
      execSync(
        `npx shadcn@latest add button input label select textarea checkbox radio-group form --yes`,
        frontendExecOptions
      );
    } catch (error) {
      const e = error as any;
      console.error(
        "❌ shadcn add failed:",
        e.stdout?.toString(),
        e.stderr?.toString()
      );
      throw error;
    }
  } else {
    console.log("⚠️ Shadcn UI components already exist, skipping.");
  }

  // Step 7
  ["src/pages", "src/services"].forEach((d) => {
    const full = path.join(baseDir, d);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  });

  // Step 8: index.html
  const indexHtmlPath = path.join(baseDir, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    fs.writeFileSync(
      indexHtmlPath,
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated Admin Panel</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    );
  }

  // Step 9: main.tsx
  const mainTsxPath = path.join(baseDir, "src", "main.tsx");
  if (!fs.existsSync(mainTsxPath)) {
    fs.writeFileSync(
      mainTsxPath,
      `import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`
    );
  }

  // Step 10: Routes placeholder
  //   const routesPath = path.join(baseDir, "src", "routes.tsx");
  //   if (!fs.existsSync(routesPath)) {
  //     fs.writeFileSync(
  //       routesPath,
  //       `import React from "react";
  // import { Routes, Route } from "react-router-dom";

  // export default function RoutesFile() {
  //   return (
  //     <Routes>
  //       <Route path="/" element={<div className="p-4">Welcome to Generated Admin Panel</div>} />
  //     </Routes>
  //   );
  // }
  // `
  //     );
  //   }

  // Step 11: App.tsx
  const appPath = path.join(baseDir, "src", "App.tsx");
  if (fs.existsSync(appPath)) {
    fs.writeFileSync(
      appPath,
      `import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
       

        {/* Optional: default route */}
        <Route path="/" element={<h1>Home Page</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
`
    );
  }

  console.log(
    "✅ Frontend project setup with Tailwind v3 + @tailwindcss/vite + Shadcn UI complete"
  );
}
