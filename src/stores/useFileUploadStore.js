import {create} from 'zustand';

export const useFileUploadStore = create((set) => ({
  uploadedFile: null,
  uploadedFiles: [],
  folderPath: '',
  handleDirectoryChange: (event) => {
    const files = event.target.files;
    const stlFiles = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].webkitRelativePath.includes('/') && files[i].name.endsWith('.stl')) {
        stlFiles.push(files[i]);
      }
    }
    set({ uploadedFiles: stlFiles });
    if (stlFiles.length > 0) {
      const folderPath = files[0].webkitRelativePath.split('/')[0];
      set({ folderPath: folderPath, uploadedFile: stlFiles[0] });
    } else {
      alert("No STL files found in the selected folder.");
    }
  },
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setUploadedFiles: (files) => set({ uploadedFiles: files }),
  setFolderPath: (path) => set({ folderPath: path }),
}));