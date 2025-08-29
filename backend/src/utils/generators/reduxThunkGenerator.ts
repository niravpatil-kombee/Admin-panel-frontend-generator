import fs from "fs";
import path from "path";
import { ModelConfig, Field } from "../excelParser"; // Assuming excelParser is in the same utils folder

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateReduxThunks(
  modelNames: string[],
  models: Record<string, ModelConfig>
): void {
  const storeDir = path.join(getBaseDir(), "src", "store");
  const slicesDir = path.join(storeDir, "slices");
  const rootReducerPath = path.join(storeDir, "rootReducer.ts");

  if (!fs.existsSync(slicesDir)) {
    fs.mkdirSync(slicesDir, { recursive: true });
  }

  const sliceImports: string[] = [];
  const sliceReducers: string[] = [];

  // Generate a placeholder "app" slice
  const appSlicePath = path.join(slicesDir, "appSlice.ts");
  const appSliceContent = `import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  message: string | null;
}

const initialState: AppState = {
  status: 'idle',
  error: null,
  message: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state) => {
      state.status = 'loading';
      state.error = null;
      state.message = null;
    },
    setSuccess: (state, action: PayloadAction<string | null>) => {
      state.status = 'succeeded';
      state.message = action.payload;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
      state.message = null;
    },
    clearStatus: (state) => {
      state.status = 'idle';
      state.error = null;
      state.message = null;
    },
  },
});

export const { setLoading, setSuccess, setError, clearStatus } = appSlice.actions;
export default appSlice.reducer;
`;
  fs.writeFileSync(appSlicePath, appSliceContent, "utf8");
  console.log(`✅ Generated appSlice at: ${appSlicePath}`);
  sliceImports.push(`import appReducer from './slices/appSlice';`);
  sliceReducers.push(`  app: appReducer,`);

  // Generate slices for each model
  for (const modelName of modelNames) {
    const capitalizedModelName = capitalize(modelName);
    const modelTypeName = capitalizedModelName; // For the TypeScript type
    const modelSchema = models[modelName];
    const fieldsForType = modelSchema.fields
      .map((field) => {
        let tsType;
        switch (field.zodType) {
          case "string":
            tsType = "string";
            break;
          case "number":
            tsType = "number";
            break;
          case "boolean":
            tsType = "boolean";
            break;
          case "date":
            tsType = "string"; // Representing date as string for simplicity in initial setup
            break;
          case "any": // For files or other complex types
            tsType = "any";
            break;
          default:
            tsType = "any";
        }
        return `  ${field.fieldName}: ${tsType};`;
      })
      .join("\n");

    const modelSliceContent = `import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import apiService from '@/api/apiService'; // Adjust path if necessary
import { setLoading, setSuccess, setError, clearStatus } from '../slices/appSlice'; // Global status

// Define the type for a single ${modelTypeName} item
export interface ${modelTypeName} {
  id: string | number; // Assuming an ID field
${fieldsForType}
}

// Define the state for the ${modelTypeName} slice
interface ${modelTypeName}State {
  items: ${modelTypeName}[];
  item: ${modelTypeName} | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ${modelTypeName}State = {
  items: [],
  item: null,
  status: 'idle',
  error: null,
};

// Async thunks for CRUD operations
export const fetch${modelTypeName}s = createAsyncThunk(
  '${modelName}/fetch${modelTypeName}s',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading());
      const response = await apiService.get<${modelTypeName}[]>(\`/${modelName.toLowerCase()}\`); // Adjust endpoint
      dispatch(clearStatus()); // Clear global status
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch ${modelName}s';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const fetch${modelTypeName}ById = createAsyncThunk(
  '${modelName}/fetch${modelTypeName}ById',
  async (id: string | number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading());
      const response = await apiService.get<${modelTypeName}>(\`/${modelName.toLowerCase()}/\${id}\`);
      dispatch(clearStatus());
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch ${modelName}';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const create${modelTypeName} = createAsyncThunk(
  '${modelName}/create${modelTypeName}',
  async (newData: Partial<${modelTypeName}> | FormData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading());
      const config = newData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const response = await apiService.post<${modelTypeName}>(\`/${modelName.toLowerCase()}\`, newData, config);
      dispatch(setSuccess('${modelTypeName} created successfully!'));
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create ${modelTypeName}';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const update${modelTypeName} = createAsyncThunk(
  '${modelName}/update${modelTypeName}',
  async ({ id, updatedData }: { id: string | number; updatedData: Partial<${modelTypeName}> | FormData }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading());
      const config = updatedData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
      const response = await apiService.patch<${modelTypeName}>(\`/${modelName.toLowerCase()}/\${id}\`, updatedData, config); // Use PATCH for partial updates
      dispatch(setSuccess('${modelTypeName} updated successfully!'));
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update ${modelTypeName}';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

export const delete${modelTypeName} = createAsyncThunk(
  '${modelName}/delete${modelTypeName}',
  async (id: string | number, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading());
      await apiService.delete(\`/${modelName.toLowerCase()}/\${id}\`);
      dispatch(setSuccess('${modelTypeName} deleted successfully!'));
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete ${modelTypeName}';
      dispatch(setError(message));
      return rejectWithValue(message);
    }
  }
);

// Create the slice
const ${modelName}Slice = createSlice({
  name: '${modelName}',
  initialState,
  reducers: {
    // Standard reducers if needed
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetch${modelTypeName}s.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetch${modelTypeName}s.fulfilled, (state, action: PayloadAction<${modelTypeName}[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetch${modelTypeName}s.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Fetch by ID
      .addCase(fetch${modelTypeName}ById.pending, (state) => {
        state.status = 'loading';
        state.item = null; // Clear previous item when fetching new one
      })
      .addCase(fetch${modelTypeName}ById.fulfilled, (state, action: PayloadAction<${modelTypeName}>) => {
        state.status = 'succeeded';
        state.item = action.payload;
      })
      .addCase(fetch${modelTypeName}ById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Create
      .addCase(create${modelTypeName}.fulfilled, (state, action: PayloadAction<${modelTypeName}>) => {
        state.status = 'succeeded';
        state.items.push(action.payload); // Add new item to list
      })
      .addCase(create${modelTypeName}.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Update
      .addCase(update${modelTypeName}.fulfilled, (state, action: PayloadAction<${modelTypeName}>) => {
        state.status = 'succeeded';
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload; // Update item in list
        }
        if (state.item?.id === action.payload.id) {
          state.item = action.payload; // Update currently viewed item if it's the one being updated
        }
      })
      .addCase(update${modelTypeName}.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Delete
      .addCase(delete${modelTypeName}.fulfilled, (state, action: PayloadAction<string | number>) => {
        state.status = 'succeeded';
        state.items = state.items.filter(item => item.id !== action.payload); // Remove deleted item
      })
      .addCase(delete${modelTypeName}.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export default ${modelName}Slice.reducer;
`;
    const modelSlicePath = path.join(slicesDir, `${modelName}Slice.ts`);
    fs.writeFileSync(modelSlicePath, modelSliceContent, "utf8");
    console.log(`✅ Generated ${modelName}Slice at: ${modelSlicePath}`);

    sliceImports.push(`import ${modelName}Reducer from './slices/${modelName}Slice';`);
    sliceReducers.push(`  ${modelName.toLowerCase()}: ${modelName}Reducer,`);
  }

  // Update rootReducer.ts with all generated slices
  const updatedRootReducerContent = `import { combineReducers } from '@reduxjs/toolkit';
${sliceImports.join("\n")}

const rootReducer = combineReducers({
${sliceReducers.join("\n")}
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
`;
  fs.writeFileSync(rootReducerPath, updatedRootReducerContent, "utf8");
  console.log(`✅ Updated rootReducer with all model slices.`);
}