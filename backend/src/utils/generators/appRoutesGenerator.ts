// src/utils/generators/appRoutesGenerator.ts
import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateAppRoutes(modelNames: string[]): void {
  const appPath = path.join(getBaseDir(), "src", "App.tsx");

  const imports = modelNames.map(name => {
    const capitalizedName = capitalize(name);
    const formPath = `./pages/${capitalizedName}/${capitalizedName}Form`;
    const tablePath = `./pages/${capitalizedName}/${capitalizedName}DataTable`;

    return `import { ${capitalizedName}Form } from '${formPath}';
import { ${capitalizedName}DataTable } from '${tablePath}';`;
  }).join("\n");

  const routeTags = modelNames.map(name => {
    const lower = name.toLowerCase();
    const plural = `${lower}s`;
    return `
        {/* Routes for ${capitalize(name)} */}
        <Route path="/${plural}" element={<${capitalize(name)}DataTable />} /> 
        <Route path="/${lower}/create" element={<${capitalize(name)}Form />} />
        <Route path="/${lower}/edit/:id" element={<${capitalize(name)}Form />} />
        <Route path="/${lower}/view/:id" element={<${capitalize(name)}Form />} />
    `;
  }).join("\n");

  const content = `
import './App.css';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './components/Dashboard'; 
import { LoginPage } from './pages/Auth/LoginPage';
${imports}

function App() {
  return (
    <Routes>

     {/* Auth routes are rendered outside the main dashboard layout */}
      <Route path="/login" element={<LoginPage />} />

       {/* Main application routes are protected by the DashboardLayout */}
      <Route path="/" element={<DashboardLayout />}>
        {/* UPDATED: Set Dashboard as the index route */}
        <Route index element={<Dashboard />} />
        ${routeTags}
      </Route>
    </Routes>
  );
}

export default App;
`;
  fs.writeFileSync(appPath, content, "utf8");
  console.log("✅ Updated App.tsx to use the new Dashboard component.");
}