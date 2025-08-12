// utils/generateLoginSystem.ts
import fs from "fs";
import path from "path";
import { Field } from "./excelParser";

const baseDir = path.resolve(__dirname, "../../../frontend");
const srcDir = path.join(baseDir, "src");

export function generateLoginSystem(modelName: string, fields: Field[]) {
  // ensure services dir
  const svcDir = path.join(srcDir, "services");
  if (!fs.existsSync(svcDir)) fs.mkdirSync(svcDir, { recursive: true });

  // auth.service.ts
  const authServicePath = path.join(svcDir, "auth.service.ts");
  const authService = `import axios from "axios";
const base = "/api/auth";
export const AuthService = {
  login: (payload: any) => axios.post(base + "/login", payload).then(r => r.data),
  me: () => axios.get(base + "/me").then(r => r.data),
  logout: () => axios.post(base + "/logout").then(r => r.data),
};`;
  fs.writeFileSync(authServicePath, authService);

  // Login page
  const pagesDir = path.join(srcDir, "pages");
  if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir, { recursive: true });

  const loginPage = `import React from "react";
import { useForm } from "react-hook-form";
import { AuthService } from "../services/auth.service";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const nav = useNavigate();
  const onSubmit = (data: any) => {
    AuthService.login(data).then(() => nav("/"));
  };
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Sign in</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className="block mb-3">
            <div className="text-sm mb-1">Email</div>
            <input {...register("email")} className="w-full p-2 border rounded"/>
          </label>
          <label className="block mb-3">
            <div className="text-sm mb-1">Password</div>
            <input type="password" {...register("password")} className="w-full p-2 border rounded"/>
          </label>
          <button className="w-full py-2 bg-indigo-600 text-white rounded">Sign in</button>
        </form>
      </div>
    </div>
  );
}`;
  fs.writeFileSync(path.join(pagesDir, "Login.tsx"), loginPage);

  // Add routes entry
  const routesPath = path.join(srcDir, "routes.tsx");
  let routes = fs.existsSync(routesPath) ? fs.readFileSync(routesPath, "utf-8") : `import React from "react";
import { Routes, Route } from "react-router-dom";
export default function RoutesFile(){ return (<Routes>{/* ROUTES_INJECTED */}</Routes>); }`;
  if (routes.includes("/* ROUTES_INJECTED */")) {
    routes = routes.replace("/* ROUTES_INJECTED */", `<Route path="/login" element={React.createElement(require("./pages/Login").default)} />\n      /* ROUTES_INJECTED */`);
  } else {
    routes = routes + `\nimport Login from "./pages/Login";\n`;
  }
  fs.writeFileSync(routesPath, routes);

  console.log(" -> Generated login system");
}
