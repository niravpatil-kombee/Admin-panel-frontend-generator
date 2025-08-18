// src/utils/generators/appRoutesGenerator.ts
import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateAppRoutes(modelNames: string[]): void {
  const appPath = path.join(getBaseDir(), "src", "App.tsx");

  const imports = modelNames.map(name =>
    // UPDATED: Import the new DataTable component name
    `import { ${capitalize(name)}Form } from './components/generated/${capitalize(name)}Form';
import { ${capitalize(name)}DataTable } from './components/generated/${capitalize(name)}DataTable';`
  ).join("\n");

  const routeTags = modelNames.map(name => {
    const lower = name.toLowerCase();
    const plural = `${lower}s`;
    return `
        {/* Routes for ${capitalize(name)} */}
        <Route path="/${plural}" element={<${capitalize(name)}DataTable />} /> 
        <Route path="/${lower}/create" element={<${capitalize(name)}Form />} />
        <Route path="/${lower}/edit/:id" element={<${capitalize(name)}Form />} />
    `;
  }).join("\n");

  const content = `
import './App.css';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
${imports}

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={
          <div className="text-center p-8">
            <h1 className="text-4xl font-bold text-slate-800">Welcome to the Dashboard</h1>
            <p className="text-lg mt-2 text-gray-600">Select a section from the sidebar to begin.</p>
          </div>
        } />
        ${routeTags}
      </Route>
    </Routes>
  );
}

export default App;
`;
  fs.writeFileSync(appPath, content, "utf8");
  console.log("✅ Updated App.tsx with advanced data table routes.");
}