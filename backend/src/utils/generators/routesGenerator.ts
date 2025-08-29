// src/utils/generators/appRoutesGenerator.ts
import fs from "fs";
import path from "path";
// UPDATED: Import the ModelConfig interface to understand the data structure
import { ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// UPDATED: Function now accepts the entire models object, not just names
export function generateAppRoutes(models: Record<string, ModelConfig>): void {
  const dir = path.join(getBaseDir(), "src", "routes");

  // NOW SMART: Generate imports conditionally
  const imports = Object.entries(models)
    .map(([modelName, config]) => {
      const capitalizedName = capitalize(modelName);

      // Every model gets a DataTable import
      const tableImport = `import { ${capitalizedName}DataTable } from '../pages/${capitalizedName}/${capitalizedName}DataTable';`;

      // ONLY regular (non-popup) models get a Form import for routing
      if (!config.isPopup) {
        const formImport = `import { ${capitalizedName}Form } from '../pages/${capitalizedName}/${capitalizedName}Form';`;
        return `${tableImport}\n${formImport}`;
      }

      return tableImport;
    })
    .join("\n");

  // NOW SMART: Generate routes conditionally
  const routeTags = Object.entries(models)
    .map(([modelName, config]) => {
      const capitalizedName = capitalize(modelName);
      const lower = modelName.toLowerCase();
      const plural = `${lower}s`;

      // The listing page route is always generated for every model
      const listingRoute = `{
    path: "/${plural}",
    element: <${capitalizedName}DataTable />
  }`;

      // ONLY regular (non-popup) models get create/edit routes
      if (!config.isPopup) {
        return `
      // Routes for ${capitalizedName} (Full Page CRUD)
      ${listingRoute},
      {
        path: "/${lower}/create",
        element: <${capitalizedName}Form />
      },
      {
        path: "/${lower}/edit/:id",
        element: <${capitalizedName}Form />
      }`;
      }

      // Popup models only need the listing route
      return `
      // Routes for ${capitalizedName} (Popup CRUD)
      ${listingRoute}`;
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
  fs.writeFileSync(path.join(dir, "routes.tsx"), content, "utf8");
  console.log(
    "✅ Updated App.tsx with smart routing for popup and page-based models."
  );
}
