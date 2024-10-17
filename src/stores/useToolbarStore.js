import {create} from 'zustand';
import persistStorage from "./Store.js";
import {persist} from "zustand/middleware";


const useToolbarStore = create(
    persist(
        (set) => ({
            mode: 'dragging', // initial state
            activeButton: 'button4',
            isPanelVisible: false,
            cursorOpacity:0.5,
            cursorColor:'#FFFF00',
            cursorSize:2.0,
            cursorShape: 'circle', // New state for shape
            setMode: (newMode) => set({ mode: newMode }), // function to update state
            setActiveButton: (activeButton) => set({ activeButton: activeButton }),
            setIsPanelVisible: (state) => set({ isPanelVisible: state }),
            closePanel: () => set({ isPanelVisible: false }),
            setCursorOpacity:(newValue) => set({ cursorOpacity: newValue }),
            setCursorColor:(newColor) => set({ cursorColor: newColor }),
            setCursorSize:(newValue) => set({ cursorSize: newValue }),
            setCursorShape: (newShape) => set({ cursorShape: newShape }),  // Function to update shape
        }),
        {
            name: 'toolbar-storage',
            getStorage: () => persistStorage,
        }
    )
);

export default useToolbarStore;

