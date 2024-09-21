import {create} from 'zustand';
import persistStorage from "./Store.js";
import {persist} from "zustand/middleware";


const useToolbarStore = create(
    persist(
        (set) => ({
            mode: 'dragging', // initial state
            activeButton: 'button4',
            isPanelVisible: false,
            setMode: (newMode) => set({ mode: newMode }), // function to update state
            setActiveButton: (activeButton) => set({ activeButton: activeButton }),
            setIsPanelVisible: (state) => set({ isPanelVisible: state }),
            closePanel: () => set({ isPanelVisible: false })
        
        }),
        {
            name: 'toolbar-storage',
            getStorage: () => persistStorage,
        }
    )
);

export default useToolbarStore;

