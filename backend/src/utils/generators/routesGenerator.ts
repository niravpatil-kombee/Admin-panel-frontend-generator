import fs from "fs";
import path from "path";
import { ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateAppRoutes(models: Record<string, ModelConfig>): void {
  const dir = path.join(getBaseDir(), "src", "routes");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Generate imports conditionally based on isPopup flag
  const imports = Object.entries(models)
    .map(([modelName, config]) => {
      const capitalizedName = capitalize(modelName);
      
      // Every model gets a DataTable import
      const tableImport = `import { ${capitalizedName}DataTable } from '../pages/${capitalizedName}/${capitalizedName}DataTable';`;
      
      // ONLY page-based (non-popup) models get Form imports for routing
      if (!config.isPopup) {
        const formImport = `import { ${capitalizedName}Form } from '../components/forms/${capitalizedName}/${capitalizedName}Form';`;
        return `${tableImport}\n${formImport}`;
      }
      
      return tableImport;
    })
    .join("\n");

  // Generate routes conditionally based on isPopup flag
  const routeTags = Object.entries(models)
    .map(([modelName, config]) => {
      const capitalizedName = capitalize(modelName);
      const lower = modelName.toLowerCase();

      if (config.isPopup) {
        // Popup models: Only listing route (forms handled in drawers)
        return `
        // ${capitalizedName} - Popup Forms (Drawer-based)
        {
          path: "/${lower}",
          element: <${capitalizedName}DataTable />
        }`;
      } else {
        // Page models: Full CRUD routes
        return `
        // ${capitalizedName} - Page Forms (Route-based)
        {
          path: "/${lower}",
          element: <${capitalizedName}DataTable />
        },
        {
          path: "/${lower}/create",
          element: <${capitalizedName}Form 
            onSubmit={(values) => {
              console.log('Creating ${lower}:', values);
              // Handle creation logic here
            }}
            onCancel={() => window.history.back()}
            title="Create ${capitalizedName}"
           
          />
        },
        {
          path: "/${lower}/edit/:id",
          element: <${capitalizedName}Form 
            onSubmit={(values) => {
              console.log('Updating ${lower}:', values);
              // Handle update logic here
            }}
            onCancel={() => window.history.back()}
            title="Edit ${capitalizedName}"
          
          />
        }`;
      }
    })
    .join(",");

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
      },${routeTags}
    ]
  }
];

export default createBrowserRouter(routes);
`;

  fs.writeFileSync(path.join(dir, "routes.tsx"), content, "utf8");
  console.log("✅ Generated smart routing with isPopup flag support - popup models use drawers, page models use dedicated routes.");
}