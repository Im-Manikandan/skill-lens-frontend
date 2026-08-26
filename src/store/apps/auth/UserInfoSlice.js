import { createSlice } from '@reduxjs/toolkit';

// Initial State
const initialState = {
  userInfo: null,
};

// Slice Definition - Authenticated User Info
const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    clearUserInfo: (state) => {
      state.userInfo = null;
    },
  },
});

// Exported Actions
export const { setUserInfo, clearUserInfo } = userInfoSlice.actions;
export default userInfoSlice.reducer;
