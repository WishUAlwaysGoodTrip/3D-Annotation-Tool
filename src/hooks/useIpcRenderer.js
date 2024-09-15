import { useEffect } from 'react';
import { useDrawingStore } from '../stores/DrawingStore'; // 导入 zustand store

export const useIpcRenderer = (
  setUploadedFile,
  setUploadedFiles,
  setFolderPath,
  convertFileObjectToBlob,
  setShowRecentFiles
) => {
  // 从 zustand store 中获取 undoOperation 函数
  const undoOperation = useDrawingStore((state) => state.undoOperation);
  const redoOperation = useDrawingStore((state) => state.redoOperation);
  const addOperation = useDrawingStore((state) => state.addOperation); 
  useEffect(() => {
    const { ipcRenderer } = window.require('electron');

    ipcRenderer.on('file-selected', (event, fileObject) => {
      const file = convertFileObjectToBlob(fileObject);
      setUploadedFile(file);
    });

    ipcRenderer.on('folder-selected', (event, { folderPath, files }) => {
      const stlFiles = files.map((fileObject) => convertFileObjectToBlob(fileObject));
      setUploadedFiles(stlFiles);
      setFolderPath(folderPath);
      if (stlFiles.length > 0) {
        setUploadedFile(stlFiles[0]);
      }
    });

    ipcRenderer.on('open-recent', () => {
      setShowRecentFiles(true);
    });

    ipcRenderer.on('undo', () => {
      undoOperation(); // 调用从 zustand store 中获取的 undoOperation 函数
    });
    
    ipcRenderer.on('redo', () => {
      redoOperation();  // 确保这里调用的是已经定义的 redoOperation
    });
    ipcRenderer.on('add-operation', (event, operation) => {
      addOperation(operation);  // 调用 addOperation 函数
    });

    return () => {
      ipcRenderer.removeAllListeners('file-selected');
      ipcRenderer.removeAllListeners('folder-selected');
      ipcRenderer.removeAllListeners('open-recent');
      ipcRenderer.removeAllListeners('undo');
      ipcRenderer.removeAllListeners('redo');
      ipcRenderer.removeAllListeners('add-operation'); 
    };
  }, [
    setUploadedFile,
    setUploadedFiles,
    setFolderPath,
    convertFileObjectToBlob,
    setShowRecentFiles,
    undoOperation, // 将 undoOperation 添加到依赖数组中
    redoOperation,
    addOperation,
  ]);
};
