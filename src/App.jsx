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
import CursorCirclePanel from './Component/CursorCirclePanel.jsx';

const App = () => {
  const [selectedColor, setSelectedColor] = useState(''); // 保存从 AnnotationPanel 选择的颜色
  const [currentAnnotationName, setCurrentAnnotationName] = useState(''); // 保存当前选中的注释名称
  const [selecttoothColor, setToothColors] = useState(''); // 保存牙齿ID和对应的颜色
  const [selectedToothId, setSelectedToothId] = useState(''); // 保存当前选中的牙齿ID
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
  };

  const handleToothColorChange = (toothId, color) => {
    setToothColors(color);  // 保存牙齿ID和颜色
    setSelectedToothId(toothId);  // 保存当前选中的牙齿ID
    console.log('tooth color app', toothId, color);
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

      <CursorCirclePanel />

      <Render 
        file={uploadedFile} 
        brushColor={selectedColor} 
        annotationName={currentAnnotationName} 
        toothColor={selecttoothColor}  // 将牙齿颜色传递给 Render 组件
        toothId={selectedToothId}  // 将牙齿ID传递给 Render 组件
      />

      <AnnotationPanel 
        onColorChange={handleColorChange} 
        onToothColorChange={handleToothColorChange}  // 传递牙齿颜色变化处理函数
      />
    </div>
  );
};
export default App;
