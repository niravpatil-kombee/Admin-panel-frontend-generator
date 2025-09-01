// src/utils/generators/routesGenerator.ts
import fs from "fs";
import path from "path";
import { ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateAppRoutes(models: Record<string, ModelConfig>): void {
  const dir = path.join(getBaseDir(), "src", "routes");

  // Generate imports - only need DataTable imports since forms are in drawers
  const imports = Object.keys(models)
    .map((modelName) => {
      const capitalizedName = capitalize(modelName);
      return `import { ${capitalizedName}DataTable } from '../pages/${capitalizedName}/${capitalizedName}DataTable';`;
    })
    .join("\n");

  // Generate routes - only listing pages since create/edit are handled by drawers
  const routeTags = Object.keys(models)
    .map((modelName) => {
      const capitalizedName = capitalize(modelName);
      const lower = modelName.toLowerCase();
      const plural = `${lower}s`;

      return `      // Routes for ${capitalizedName} (Drawer CRUD)
      {
        path: "/${plural}",
        element: <${capitalizedName}DataTable />
      }`;
    })
    .join(",\n");

  const content = `
import '../App.css';
import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import Dashboard from '../pages/Dashboard';

import { LoginPage } from '../pages/Auth/LoginPage';
${imports}

const routes = [
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
${routeTags}
    ]
  }
];

export default createBrowserRouter(routes);
`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, "routes.tsx"), content, "utf8");
  console.log(
    "✅ Generated App routes with drawer-based CRUD for all models."
  );
}