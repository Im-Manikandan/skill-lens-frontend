import { createSlice } from '@reduxjs/toolkit';

// Initial State
const initialState = {
  accessToken: null,
  tokenType: null,
  expiresIn: null,
};

// Slice Definition - Auth Token Management
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken: (state, action) => {
      state.accessToken = action.payload.access_token;
      state.tokenType = action.payload.token_type;
      state.expiresIn = action.payload.expires_in;
    },
    clearAuthToken: (state) => {
      state.accessToken = null;
      state.tokenType = null;
      state.expiresIn = null;
    },
  },
});

// Exported Actions
export const { setAuthToken, clearAuthToken } = authSlice.actions;
export default authSlice.reducer;
