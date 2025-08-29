import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend"); // Adjust if your frontend is in a different relative path

export function generateApiSetup(): void {
  const storeDir = path.join(getBaseDir(), "src", "store");
  const apiServicePath = path.join(getBaseDir(), "src", "api", "apiService.ts");
  const rootReducerPath = path.join(storeDir, "rootReducer.ts");
  const storePath = path.join(storeDir, "index.ts");
  const apiDir = path.join(getBaseDir(), "src", "api");

  // Ensure directories exist
  [storeDir, apiDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Generate apiService.ts
  const apiServiceContent = `import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'; // Adjust as needed

const apiService = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or wherever you store your token
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      console.error('Unauthorized, redirecting to login...');
      // window.location.href = '/login'; // Example redirection
    }
    return Promise.reject(error);
  }
);

export default apiService;
`;
  fs.writeFileSync(apiServicePath, apiServiceContent, "utf8");
  console.log(`✅ Generated API service at: ${apiServicePath}`);

  // Generate rootReducer.ts
  const rootReducerContent = `import { combineReducers } from '@reduxjs/toolkit';
// import appReducer from './appSlice'; // Will be generated or dynamically imported

const rootReducer = combineReducers({
  // app: appReducer, // Add your slices here
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
`;
  fs.writeFileSync(rootReducerPath, rootReducerContent, "utf8");
  console.log(`✅ Generated rootReducer at: ${rootReducerPath}`);

  // Generate Redux store index.ts
  const storeContent = `import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // You might want to disable serializableCheck for FormData if you're using it directly in actions/state
      serializableCheck: {
        ignoredActions: [], // Add action types that carry non-serializable data
        ignoredPaths: [], // Add paths to your state that might contain non-serializable data
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;
export default store;
`;
  fs.writeFileSync(storePath, storeContent, "utf8");
  console.log(`✅ Generated Redux store at: ${storePath}`);
}