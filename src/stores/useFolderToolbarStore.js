import {create} from 'zustand';


const useFolderToolbarStore = create((set) => ({
    listWidth: 200, // 文件列表的默认宽度
    isListVisible: true, // 文件列表的可见性状态
    isFileListLoaded: false,

    setListWidth: (width) => set({ listWidth: width }),
    setIsListVisible: (state) => set({ isListVisible: state}),
    setIsFileListLoaded: (state) => set({ isFileListLoaded: state}),
}));

export default useFolderToolbarStore;

