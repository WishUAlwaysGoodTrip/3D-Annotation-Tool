import {create} from 'zustand';
import persistStorage from "./Store.js";
import {persist} from "zustand/middleware";


const useToolbarStore = create(
    persist(
        (set) => ({
            mode: 'dragging', // initial state
            activeButton: 'button4',
            isPanelVisible: false,
            brushOpacity:0.5,
            brushColor:'#FFFF00',
            brushSize:2,
            setMode: (newMode) => set({ mode: newMode }), // function to update state
            setActiveButton: (activeButton) => set({ activeButton: activeButton }),
            setIsPanelVisible: (state) => set({ isPanelVisible: state }),
            closePanel: () => set({ isPanelVisible: false }),
            setBrushOpacity:(newValue) => set({ brushOpacity: newValue }),
            setBrushColor:(newColor) => set({ brushColor: newColor }),
            setBrushSize:(newValue) => set({ brushColor: newValue }),
        }),
        {
            name: 'toolbar-storage',
            getStorage: () => persistStorage,
        }
    )
);

export default useToolbarStore;

