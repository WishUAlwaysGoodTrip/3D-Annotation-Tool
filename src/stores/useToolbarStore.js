import {create} from 'zustand';
//import { persist } from 'zustand/middleware'


const useToolbarStore = create((set) => ({
    mode: 'dragging', // initial state
    activeButton: 'button4',
    setMode: (newMode) => set({ mode: newMode }), // function to update state
    setActiveButton: (activeButton) => set({ activeButton: activeButton }),
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

export default useToolbarStore;