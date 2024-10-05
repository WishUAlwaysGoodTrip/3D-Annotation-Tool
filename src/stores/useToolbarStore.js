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
            setMode: (newMode) => set({ mode: newMode }), // function to update state
            setActiveButton: (activeButton) => set({ activeButton: activeButton }),
            setIsPanelVisible: (state) => set({ isPanelVisible: state }),
            closePanel: () => set({ isPanelVisible: false }),
            setCursorOpacity:(newValue) => set({ cursorOpacity: newValue }),
            setCursorColor:(newColor) => set({ cursorColor: newColor }),
            setCursorSize:(newValue) => set({ cursorSize: newValue }),
        }),
        {
            name: 'toolbar-storage',
            getStorage: () => persistStorage,
        }
    )
);

export default useToolbarStore;

