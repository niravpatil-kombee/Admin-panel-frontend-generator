// src/utils/generators/AppTsxGenerator.ts
import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateAppTsx(): void {
  const appTsxPath = path.join(getBaseDir(), "src", "App.tsx");

  const content = `
import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { Provider } from "react-redux";
import store from "./store";
import { RouterProvider } from "react-router-dom";
import routes from "@/routes/routes";

function App() {
  return (
    <React.Suspense fallback="Loading...">
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <RouterProvider router={routes} />
          </ThemeProvider>
        </Provider>
      </I18nextProvider>
    </React.Suspense>
  );
}

export default App;
`;

  fs.writeFileSync(appTsxPath, content.trimStart(), "utf8");
  console.log("✅ Generated App.tsx");
}
