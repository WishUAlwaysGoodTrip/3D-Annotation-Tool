import {create} from 'zustand';

const useModeStore = create((set) => ({
  mode: 'dragging', //used by render
  setMode: (newMode) => set({ mode: newMode }), //used by toolbar
}));

export default useModeStore;