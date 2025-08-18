// src/utils/generators/mainTsxGenerator.ts

import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateMainTsx(): void {
    const mainTsxPath = path.join(getBaseDir(), "src", "main.tsx");

    const content = `
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "@/components/theme-provider"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
`;
    fs.writeFileSync(mainTsxPath, content, "utf8");
    console.log("✅ Generated main.tsx with ThemeProvider.");
}