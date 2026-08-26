import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  clientInfo: null,
  accessMap: {},
};

const clientInfoSlice = createSlice({
  name: 'clientInfo',
  initialState,
  reducers: {
    setClientInfo: (state, action) => {
      state.clientInfo = action.payload;
    },
    setAccessMap: (state, action) => {
      state.accessMap = action.payload || {};
    },
    clearClientInfo: (state) => {
      state.clientInfo = null;
      state.accessMap = {};
    },
  },
});

export const { setClientInfo, setAccessMap, clearClientInfo } = clientInfoSlice.actions;
export default clientInfoSlice.reducer;
