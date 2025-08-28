import fs from "fs";
import path from "path";

const getBaseDir = () => path.resolve(process.cwd(), "..", "frontend");

export function generateReduxThunks(): void {
  const storeDir = path.join(getBaseDir(), "src", "store");
  const thunksDir = path.join(storeDir, "thunks");
  const slicesDir = path.join(storeDir, "slices");

  // Create directories if they don't exist
  if (!fs.existsSync(thunksDir)) fs.mkdirSync(thunksDir, { recursive: true });
  if (!fs.existsSync(slicesDir)) fs.mkdirSync(slicesDir, { recursive: true });

  // --- File 1: The Generic Thunk Creator ---
  const apiThunkPath = path.join(thunksDir, "apiThunk.ts");
  const apiThunkContent = `
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api'; // The base Axios instance

/**
 * A generic async thunk creator for making API calls.
 * It standardizes the process of handling pending, fulfilled, and rejected states.
 *
 * @param typePrefix The prefix for the generated action types (e.g., 'users/fetchAll').
 * @param apiCall A function that receives arguments and returns the API call promise.
 *
 * @example
 * export const fetchUsers = createApiThunk('users/fetchAll', () => api.get('/users'));
 * export const createUser = createApiThunk('users/create', (userData) => api.post('/users', userData));
 */
export const createApiThunk = <Returned, ThunkArg>(
  typePrefix: string,
  apiCall: (arg: ThunkArg) => Promise<any>
) => {
  return createAsyncThunk<Returned, ThunkArg>(
    typePrefix,
    async (arg, { rejectWithValue }) => {
      try {
        const response = await apiCall(arg);
        return response.data;
      } catch (error: any) {
        // The Axios interceptor already formats the error nicely
        return rejectWithValue(error);
      }
    }
  );
};
`;
  fs.writeFileSync(apiThunkPath, apiThunkContent, "utf8");
  console.log(`✅ Generated generic API Thunk creator at: ${apiThunkPath}`);

  // --- File 2: Example User Slice using the Thunk Creator ---
  const userSlicePath = path.join(slicesDir, "userSlice.ts");
  const userSliceContent = `
import { createSlice, createSelector } from '@reduxjs/toolkit';
import { createApiThunk } from '../thunks/apiThunk';
import { RootState } from '../store';

// Define the shape of a User and the state
// You would replace this with the actual User type from your list page generator
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserState {
  users: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null | undefined;
}

const initialState: UserState = {
  users: [],
  status: 'idle',
  error: null,
};

// --- Define Async Thunks using the generic creator ---

// Thunk for fetching all users (no arguments needed)
export const fetchUsers = createApiThunk<User[], void>('users/fetchAll', () => api.get('/users'));

// Thunk for creating a new user (expects user data as an argument)
export const createUser = createApiThunk<User, Omit<User, 'id'>>('users/create', (userData) => api.post('/users', userData));

// --- Create the Slice ---
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Standard reducers can go here if needed
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchUsers lifecycle
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Handle createUser lifecycle
      .addCase(createUser.pending, (state) => {
        // You could set a specific 'isCreating' status if needed
        state.status = 'loading';
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add the new user to the state
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

// --- Selectors for accessing data in components ---
const selectUsersState = (state: RootState) => state.users;

export const selectAllUsers = createSelector(
  [selectUsersState],
  (usersState) => usersState.users
);

export const selectUserStatus = createSelector(
  [selectUsersState],
  (usersState) => usersState.status
);

export const selectUserError = createSelector(
  [selectUsersState],
  (usersState) => usersState.error
);

export default userSlice.reducer;
`;
  fs.writeFileSync(userSlicePath, userSliceContent, "utf8");
  console.log(`✅ Generated example userSlice at: ${userSlicePath}`);
}