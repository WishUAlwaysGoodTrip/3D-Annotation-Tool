import {create} from 'zustand';
//import { persist } from 'zustand/middleware'


const useModeStore = create((set) => ({
    mode: 'dragging', // initial state
    setMode: (newMode) => set({ mode: newMode }), // function to update state
  })
);
  /*
  persist(
    (set) => ({
      mode: 'dragging', // initial state
      setMode: (newMode) => set({ mode: newMode }), // function to update state
    }),
    {
      name: 'mode-storage', // name of the item in the storage
      Storage: () => sharedStore,
    }
  )
);
*/

export default useModeStore;