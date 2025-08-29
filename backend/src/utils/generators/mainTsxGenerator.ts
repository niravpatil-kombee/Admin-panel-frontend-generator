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
import './i18n';
import { Provider } from 'react-redux';
import store from './store';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <React.Suspense fallback="Loading...">
     <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </Provider> 
    </I18nextProvider>
    </React.Suspense>
  </React.StrictMode>
);
`;
  fs.writeFileSync(mainTsxPath, content, "utf8");
  console.log("✅ Generated main.tsx with ThemeProvider.");
}
