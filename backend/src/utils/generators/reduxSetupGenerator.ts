// src/utils/generators/reduxSetupGenerator.ts
import fs from "fs";
import path from "path";
import { ModelConfig } from "../excelParser";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateReduxSetup(models: Record<string, ModelConfig>): void {
  const reduxDir = path.join(getBaseDir(), "src", "redux");
  const featuresDir = path.join(reduxDir, "features");
  const typesDir = path.join(getBaseDir(), "src", "types");

  if (!fs.existsSync(reduxDir)) fs.mkdirSync(reduxDir, { recursive: true });
  if (!fs.existsSync(featuresDir)) fs.mkdirSync(featuresDir, { recursive: true });
  if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir, { recursive: true });

  // Generate slices & types for each model
  Object.entries(models).forEach(([modelName, modelConfig]) => {
    generateModelSlice(featuresDir, modelName, modelConfig);
    generateModelTypes(typesDir, modelName, modelConfig);
  });

  generateTypesIndex(typesDir, models);
  generateStore(reduxDir, models);
  generateReduxHooks(reduxDir);
  generateReduxIndex(reduxDir, models);

  console.log("\n✅ Redux Toolkit + Types Setup Complete!");
  console.log("📦 Run: npm install @reduxjs/toolkit react-redux");
}

function generateModelSlice(featuresDir: string, modelName: string, modelConfig: ModelConfig): void {
  const sliceName = `${modelName.toLowerCase()}Slice`;

  const content = `import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ${modelName} } from '@/types/${modelName}';

export interface ${modelName}State {
  items: ${modelName}[];
  loading: boolean;
  error: string | null;
}

const initialState: ${modelName}State = {
  items: [],
  loading: false,
  error: null,
};

export const ${sliceName} = createSlice({
  name: '${modelName.toLowerCase()}',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<${modelName}[]>) => {
      state.items = action.payload;
    },
    addItem: (state, action: PayloadAction<${modelName}>) => {
      state.items.push(action.payload);
    },
    removeItem: (state, action: PayloadAction<string | number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// ✅ Prefixed exports to avoid name collisions
export const {
  setItems: set${modelName}Items,
  addItem: add${modelName}Item,
  removeItem: remove${modelName}Item,
  setLoading: set${modelName}Loading,
  setError: set${modelName}Error,
} = ${sliceName}.actions;

// Selectors
export const select${modelName}Items = (state: { ${modelName.toLowerCase()}: ${modelName}State }) => state.${modelName.toLowerCase()}.items;
export const select${modelName}Loading = (state: { ${modelName.toLowerCase()}: ${modelName}State }) => state.${modelName.toLowerCase()}.loading;
export const select${modelName}Error = (state: { ${modelName.toLowerCase()}: ${modelName}State }) => state.${modelName.toLowerCase()}.error;

export default ${sliceName}.reducer;`;

  fs.writeFileSync(path.join(featuresDir, `${sliceName}.ts`), content, "utf8");
  console.log(`✅ Generated slice for model: ${modelName}`);
}

function generateModelTypes(typesDir: string, modelName: string, modelConfig: ModelConfig): void {
  const fields = modelConfig.fields
    .map((field) => `  ${field.fieldName}: ${mapExcelTypeToTS(field.zodType)};`)
    .join("\n");

  const typeContent = `export interface ${modelName} {
${fields}
}`;
  fs.writeFileSync(path.join(typesDir, `${modelName}.ts`), typeContent, "utf8");
  console.log(`✅ Generated type for model: ${modelName}`);
}

function generateTypesIndex(typesDir: string, models: Record<string, ModelConfig>): void {
  const exports = Object.keys(models)
    .map((m) => `export * from './${m}';`)
    .join("\n");

  fs.writeFileSync(path.join(typesDir, "index.ts"), exports, "utf8");
  console.log("✅ Generated types/index.ts");
}

function mapExcelTypeToTS(zodType: string): string {
  const typeMap: Record<string, string> = {
    string: "string",
    number: "number",
    boolean: "boolean",
    date: "Date",
    any: "any",
  };
  return typeMap[zodType.toLowerCase()] || "any";
}

function generateStore(reduxDir: string, models: Record<string, ModelConfig>): void {
  const imports = Object.keys(models)
    .map(
      (m) => `import ${m.toLowerCase()}Reducer from './features/${m.toLowerCase()}Slice';`
    )
    .join("\n");

  const reducers = Object.keys(models)
    .map((m) => `    ${m.toLowerCase()}: ${m.toLowerCase()}Reducer,`)
    .join("\n");

  const storeContent = `import { configureStore } from '@reduxjs/toolkit';
${imports}

export const store = configureStore({
  reducer: {
${reducers}
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;`;

  fs.writeFileSync(path.join(reduxDir, "store.ts"), storeContent, "utf8");
  console.log("✅ Generated store.ts with model reducers only");
}

function generateReduxHooks(reduxDir: string): void {
  const hooksContent = `import { useDispatch, useSelector, useStore } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore: () => typeof import('./store').store = useStore;`;

  fs.writeFileSync(path.join(reduxDir, "hooks.ts"), hooksContent, "utf8");
  console.log("✅ Generated hooks.ts");
}

function generateReduxIndex(reduxDir: string, models: Record<string, ModelConfig>): void {
  const exports = Object.keys(models)
    .map((m) => `export * from './features/${m.toLowerCase()}Slice';`)
    .join("\n");

  const indexContent = `// Redux setup
export * from './store';
export * from './hooks';

${exports}
`;

  fs.writeFileSync(path.join(reduxDir, "index.ts"), indexContent, "utf8");
  console.log("✅ Generated index.ts with model slices only");
}
