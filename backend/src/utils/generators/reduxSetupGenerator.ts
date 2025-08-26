// src/utils/generators/apiSetupGenerator.ts

import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateApiSetup(): void {
  const libDir = path.join(getBaseDir(), "src", "lib");
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const apiFilePath = path.join(libDir, "api.ts");
  const envExampleFilePath = path.join(getBaseDir(), ".env.example"); 

  const apiContent = `
import axios from 'axios';

// 1. Create a new Axios instance with a custom configuration
const api = axios.create({
  // --- IMPORTANT ---
  // The base URL should be set in your .env file
  // VITE_API_BASE_URL=http://localhost:5000/api
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

// 2. Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage (or your state management)
    const token = localStorage.getItem('authToken'); 
    
    if (token) {
      // If the token exists, add it to the Authorization header
      config.headers['Authorization'] = \`Bearer \${token}\`;
    }
    
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// 3. Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx causes this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx causes this function to trigger
    
    // Example: Handle 401 Unauthorized errors (e.g., token expired)
    if (error.response && error.response.status === 401) {
      // localStorage.removeItem('authToken');
      // window.location.href = '/login'; // Redirect to login page
      console.error("Unauthorized! Redirecting to login.");
    }

    // Return a structured error object for consistent handling in your components
    return Promise.reject(error.response ? error.response.data : error);
  }
);

// 4. Define wrapper functions for common methods
const get = <T>(url: string, params?: object) => api.get<T>(url, { params });
const post = <T>(url: string, data: object) => api.post<T>(url, data);
const put = <T>(url: string, data: object) => api.put<T>(url, data);
const patch = <T>(url: string, data: object) => api.patch<T>(url, data);
// Use 'del' as 'delete' is a reserved keyword
const del = <T>(url: string) => api.delete<T>(url);

export const apiService = {
  get,
  post,
  put,
  patch,
  del,
};

export default api;
`;

  const envExampleContent = `
# This is an example environment file.
# Copy this file to .env.local and fill in your actual API URL.

VITE_API_BASE_URL=http://localhost:5000/api
`;

  fs.writeFileSync(apiFilePath, apiContent, "utf8");
  console.log(`✅ Generated Axios setup at: ${apiFilePath}`);

  fs.writeFileSync(envExampleFilePath, envExampleContent, "utf8");
  console.log(`✅ Generated .env.example file in the project root.`);
}