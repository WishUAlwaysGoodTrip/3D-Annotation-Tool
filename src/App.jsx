import React, { useState } from 'react';
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
  const [selectedColor, setSelectedColor] = useState(''); // 保存从 AnnotationPanel 选择的颜色
  const [currentAnnotationName, setCurrentAnnotationName] = useState(''); // 保存当前选中的注释名称
  const { uploadedFile, uploadedFiles, folderPath, handleDirectoryChange, setUploadedFile, setUploadedFiles, setFolderPath } = useFileUploadStore();
  const { recentFiles, showRecentFiles, toggleRecentFiles, setRecentFiles, setShowRecentFiles } = useRecentFiles(uploadedFile);

  useIpcRenderer(setUploadedFile, setUploadedFiles, setFolderPath, convertFileObjectToBlob, setShowRecentFiles);

    
  const handleFileSelect = (file) => {
    setUploadedFile(file);  // 设置当前激活的文件
  };

  // 处理 AnnotationPanel 颜色变化
  const handleColorChange = (color, annotationName) => {
    setSelectedColor(color); 
    setCurrentAnnotationName(annotationName); // 保存当前注释名称
    console.log('color app', color, annotationName);
  };

  return (
    <div className="app">
      <header className="app-header">
        <FolderUploadButton 
          onFolderUpload={handleFileSelect}
          handleDirectoryChange={handleDirectoryChange}
          fileList={uploadedFiles}
          folderPath={folderPath}  // 传递文件夹路径
        />
      </header>

      {/* 显示/隐藏最近文件列表 */}
      {showRecentFiles && (
        <RecentFilesList 
          recentFiles={recentFiles} 
          onFileSelect={handleFileSelect} 
          toggleRecentFiles={toggleRecentFiles} 
        />
      )}

      <Toolbar />

      <Render 
        file={uploadedFile} 
        brushColor={selectedColor} 
        annotationName={currentAnnotationName} 
      />

      <AnnotationPanel onColorChange={handleColorChange} />
    </div>
  );
};
export default App;
