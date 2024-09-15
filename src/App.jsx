// App.jsx
import React, { useState, useEffect } from 'react';
import { useDrawingStore } from './stores/DrawingStore'; // 正确导入 store
import './App.css';
import Render from './Component/Render.jsx';
import Toolbar from './Component/Toolbar.jsx';
import FolderUploadButton from './Component/FolderUploadButton.jsx';
import RecentFilesList from './Component/RecentFilesList.jsx';
import { convertFileObjectToBlob } from './Component/convertFileObjectToBlob';
import { useFileUploadStore } from './stores/useFileUploadStore.js';
import { useRecentFiles } from './hooks/useRecentFiles';
import { useIpcRenderer } from './hooks/useIpcRenderer';
import AnnotationPanel from './Component/AnnotationPanel.jsx';

const App = () => {
  const [listWidth, setListWidth] = useState(250); // 默认宽度

  const { uploadedFile, uploadedFiles, folderPath, handleDirectoryChange, setUploadedFile, setUploadedFiles, setFolderPath } = useFileUploadStore();
  const { recentFiles, showRecentFiles, toggleRecentFiles, setRecentFiles, setShowRecentFiles } = useRecentFiles(uploadedFile);

  useIpcRenderer(setUploadedFile, setUploadedFiles, setFolderPath, convertFileObjectToBlob, setShowRecentFiles);
  const { ipcRenderer } = window.require('electron');
  const addOperation = useDrawingStore((state) => state.addOperation); // 获取 addOperation 函数
  const undo = useDrawingStore((state) => state.undoOperation); // 获取 undo 函数
  const redo = useDrawingStore((state) => state.redoOperation); // 获取 redo 函数

  useEffect(() => {
    ipcRenderer.on('undo', () => {
      undo(); // 调用 undo
    });

    ipcRenderer.on('redo', () => {
      redo(); // 调用 redo
    });

    return () => {
      ipcRenderer.removeAllListeners('undo');
      ipcRenderer.removeAllListeners('redo');
    };
  }, [undo, redo]);

  const handleResize = (newWidth) => {
    setListWidth(newWidth); // 更新文件列表的宽度
  };

  const handleFileSelect = (file) => {
    setUploadedFile(file);  // 只设置当前激活的文件
  };

  return (
    <div className="app">
      <header className="app-header">
        <FolderUploadButton 
          onFolderUpload={handleFileSelect}
          handleDirectoryChange={handleDirectoryChange}
          fileList={uploadedFiles}
          listWidth={listWidth}
          handleResize={handleResize}
          folderPath={folderPath}
        />
      </header>
      {showRecentFiles && (
        <RecentFilesList 
          recentFiles={recentFiles} 
          onFileSelect={handleFileSelect} 
          listWidth={listWidth} 
          toggleRecentFiles={toggleRecentFiles} 
        />
      )}
      <Toolbar />
      
      {/* 将 addOperation 作为 prop 传递给 Render 组件 */}
      <Render file={uploadedFile} addOperation={addOperation} />
      <AnnotationPanel />
    </div>
  );
};

export default App;
