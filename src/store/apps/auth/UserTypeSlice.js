import { createSlice } from '@reduxjs/toolkit';

// Initial State
const initialState = {
  userType: null,
};

// Slice Definition - User Role Type (admin/client)
const userTypeSlice = createSlice({
  name: 'userType',
  initialState,
  reducers: {
    setUserType: (state, action) => {
      state.userType = action.payload;
    },
    clearUserType: (state) => {
      state.userType = null;
    },
  },
});

// Exported Actions
export const { setUserType, clearUserType } = userTypeSlice.actions;
export default userTypeSlice.reducer;
