import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosclient.js';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/register', userData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);


export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/login', credentials);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/user/check');
      return data.user;
    } catch (error) {
      if (error.response?.status === 401) {
        return null; // Special case for no session
      }
      return rejectWithValue(error.response?.data || { message: error.message });;
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/user/logout');
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    initializing: true,
    error: null
  },
  reducers: {
    // Clears any stale error from previous auth attempt
    // Called when Login/Signup pages mount so old errors don't show immediately
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Register User Cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      })

      // Login User Cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : action.payload?.message || 'Invalid credentials. Please try again.';
        state.isAuthenticated = false;
        state.user = null;
      })

      // Check Auth Cases
      .addCase(checkAuth.pending, (state) => {
        state.initializing = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.initializing = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.initializing = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      })

      // Logout User Cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      });
  }
});

export default authSlice.reducer;
// Export the clearError action so pages can clear stale errors on mount
export const { clearError, updateUser } = authSlice.actions;



// This is the best way to understand how Redux communicates. Whenever your checkAuth thunk runs, Redux Toolkit generates a specific Action Object based on the outcome.
// Here are the three objects visualized exactly as they appear in Redux:
// Case 1: Request Fulfilled (Success)
// This happens when your backend returns a 200 OK and the line return data.user; (Line 34) is executed.
// code
// JavaScript
// {
//   type: 'auth/check/fulfilled', // Action type
//   payload: {                    // This is your 'data.user' from backend
//     _id: "65abc123...",
//     name: "John Doe",
//     email: "john@example.com",
//     role: "user"
//   },
//   meta: {
//     arg: undefined,             // Since you passed nothing to checkAuth()
//     requestId: 'a1b2c3...',
//     requestStatus: 'fulfilled'
//   }
// }
// Case 2: Rejected with rejectWithValue(null)
// This happens when the backend returns a 401 (Line 37). You explicitly told Redux to send null.
// code
// JavaScript
// {
//   type: 'auth/check/rejected',
//   payload: null,               // <--- This is the 'null' you passed
//   meta: {
//     arg: undefined,
//     requestId: 'x9y8z7...',
//     rejectedWithValue: true,   // RTK adds this flag to show it was manual
//     requestStatus: 'rejected'
//   },
//   error: {                     // RTK adds a basic error summary here automatically
//     message: "Rejected"
//   }
// }
// Case 3: Rejected with rejectWithValue(error)
// This happens if the server is down or a 500 error occurs (Line 39). Axios generates a complex error object.
// Note: Since Redux prefers "serializable" data (plain objects), Axios error objects look like this when passed through rejectWithValue:
// code
// JavaScript
// {
//   type: 'auth/check/rejected',
//   payload: {                    // The full Axios error converted to an object
//     message: "Network Error",
//     name: "AxiosError",
//     code: "ERR_NETWORK",
//     response: {                 // If the server responded with something else (like 500)
//        status: 500,
//        data: "Internal Server Error"
//     }
//   },
//   meta: {
//     arg: undefined,
//     requestId: 'p5q4r3...',
//     rejectedWithValue: true,
//     requestStatus: 'rejected'
//   },
//   error: {
//     message: "Rejected"
//   }
// }
// Summary of the Difference:
// Fulfilled: The payload contains the actual data you wanted.
// Rejected (null): The payload is empty (null). You use this in your reducer to say: "Okay, no user found, just clear the state quietly."
// Rejected (error): The payload contains details of the crash. You use this in your reducer to say: "Show a red alert box to the user with action.payload.message."
// Where do you see these?
// If you use the Redux DevTools extension in your browser, you will see these exact objects appearing in the "Action" tab every time your API is called!