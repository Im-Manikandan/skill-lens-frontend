import { createSlice } from '@reduxjs/toolkit';

// Initial State
const initialState = {
  notes: [],
  notesContent: 0,
  noteSearch: '',
};

// Slice Definition
export const NotesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    SearchNotes: (state, action) => {
      state.noteSearch = action.payload;
    },
    SelectNote: (state, action) => {
      state.notesContent = action.payload;
    },
  },
});

// Exported Actions
export const { SearchNotes } = NotesSlice.actions;

export default NotesSlice.reducer;
