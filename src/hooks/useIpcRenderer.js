import { useEffect } from 'react';

export const useIpcRenderer = (setUploadedFile, setUploadedFiles, setFolderPath, convertFileObjectToBlob, setShowRecentFiles) => {
  useEffect(() => {
    const { ipcRenderer } = window.require('electron');

    ipcRenderer.on('file-selected', (event, fileObject) => {
      const file = convertFileObjectToBlob(fileObject);
      setUploadedFile(file);
    });

    ipcRenderer.on('folder-selected', (event, { folderPath, files }) => {
      const stlFiles = files.map(fileObject => convertFileObjectToBlob(fileObject));
      setUploadedFiles(stlFiles);
      setFolderPath(folderPath);
      if (stlFiles.length > 0) {
        setUploadedFile(stlFiles[0]);
      }
    });

    ipcRenderer.on('open-recent', () => {
      setShowRecentFiles(true);
    });

    return () => {
      ipcRenderer.removeAllListeners('file-selected');
      ipcRenderer.removeAllListeners('folder-selected');
      ipcRenderer.removeAllListeners('open-recent');
    };
  }, [setUploadedFile, setUploadedFiles, setFolderPath, convertFileObjectToBlob]);
};
