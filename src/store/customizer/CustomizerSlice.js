import { createSlice } from '@reduxjs/toolkit';

// Initial State - Theme & Layout Defaults
const initialState = {
  topbarBg: 'white',
  customizerSidebar: false,
  isRTL: false,
  isDark: true,
  isMiniSidebar: false,
  sidebarBg: 'dark',
  isTopbarFixed: true,
  isMobileSidebar: false,
  isSidebarFixed: true,
  isInnerRightPart: false, // this is for the three column layout right part show hide in table & mobile
};

// Slice Definition - Theme Customizer Reducers
export const CustomizerSlice = createSlice({
  name: 'customizer',
  initialState,
  reducers: {
    ChangeTopbarColor: (state, action) => {
      state.topbarBg = action.payload;
    },
    ToggleCustomizer: (state) => {
      state.customizerSidebar = !state.customizerSidebar;
    },
    ChangeDirection: (state, action) => {
      state.isRTL = action.payload;
    },
    ChangeDarkMode: (state, action) => {
      state.isDark = action.payload;
    },
    ToggleMiniSidebar: (state) => {
      state.isMiniSidebar = !state.isMiniSidebar;
    },
    ChangeSidebarColor: (state, action) => {
      state.sidebarBg = action.payload;
    },
    ToggleTopbar: (state, action) => {
      state.isTopbarFixed = action.payload;
    },
    ToggleMobileSidebar: (state) => {
      state.isMobileSidebar = !state.isMobileSidebar;
    },
    FixedSidebar: (state) => {
      state.isSidebarFixed = !state.isSidebarFixed;
    },
    ToggleInnerRightPart: (state) => {
      state.isInnerRightPart = !state.isInnerRightPart;
    },
  },
});

// Exported Actions
export const {
  ChangeTopbarColor,
  ToggleCustomizer,
  ChangeDirection,
  ChangeDarkMode,
  ToggleMiniSidebar,
  ChangeSidebarColor,
  ToggleTopbar,
  ToggleMobileSidebar,
  FixedSidebar,
  ToggleInnerRightPart,
} = CustomizerSlice.actions;

export default CustomizerSlice.reducer;
