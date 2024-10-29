import {create} from 'zustand';


const useFolderToolbarStore = create((set) => ({
    listWidth: 200, 
    isListVisible: true, 
    isFileListLoaded: false,

    setListWidth: (width) => set({ listWidth: width }),
    setIsListVisible: (state) => set({ isListVisible: state}),
    setIsFileListLoaded: (state) => set({ isFileListLoaded: state}),
}));

export default useFolderToolbarStore;

