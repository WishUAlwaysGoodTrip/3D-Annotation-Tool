import React, { useState, useEffect } from 'react';
import './App.css';
import Render from './Component/Render.jsx';
import ToolbarButton from './Component/ToolbarButton.jsx';
import FolderUploadButton from './Component/FolderUploadButton.jsx';
import RecentFilesList from './Component/RecentFilesList.jsx';
import { convertFileObjectToBlob } from './Component/convertFileObjectToBlob';
import { useFileUpload } from './hooks/useFileUpload.js'
import { useRecentFiles } from './hooks/useRecentFiles';
import { useIpcRenderer } from './hooks/useIpcRenderer';

const App = () => {
  const [activeButton, setActiveButton] = useState('button4');
  const [mode, setMode] = useState('dragging'); 
  const [listWidth, setListWidth] = useState(250); // 默认宽度，可调整
  // const [showFileList, setShowFileList] = useState(false); // 控制显示文件列表

  const { uploadedFile, uploadedFiles, folderPath, handleDirectoryChange, setUploadedFile, setUploadedFiles, setFolderPath } = useFileUpload();

  const { recentFiles, showRecentFiles, toggleRecentFiles, setRecentFiles, setShowRecentFiles } = useRecentFiles(uploadedFile);

  useIpcRenderer(setUploadedFile, setUploadedFiles, setFolderPath, convertFileObjectToBlob, setShowRecentFiles);
  
  const handleResize = (newWidth) => {
    setListWidth(newWidth); // 更新文件列表的宽度
  };

  const handleButtonClick = (buttonId, newMode = mode) => {
    setActiveButton(buttonId);
    setMode(newMode);
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
          folderPath={folderPath}  // 传递文件夹路径
        />

      </header>
      {/* 显示/隐藏最近文件列表 */}
      {showRecentFiles && (
        <RecentFilesList 
          recentFiles={recentFiles} 
          onFileSelect={handleFileSelect} 
          listWidth={listWidth} 
          toggleRecentFiles={toggleRecentFiles} 
        />
      )}
      <div id="toolbar">
        <ToolbarButton 
          normalIcon="./assets/normal_u110.svg" 
          hoverIcon="./assets/mouseover_u110_mouseover.svg" 
          isActive={activeButton === 'button1'} 
          onClick={() => handleButtonClick('button1')} 
          id="button1" 
        />
        <ToolbarButton 
          normalIcon="./assets/normal_u111.svg" 
          hoverIcon="./assets/mouseover_u111_mouseover.svg" 
          isActive={activeButton === 'button2'} 
          onClick={() => handleButtonClick('button2')} 
          id="button2" 
        />
        <ToolbarButton 
          normalIcon="./assets/normal_u105.svg" 
          hoverIcon="./assets/mouseover_u105_mouseover.svg" 
          isActive={activeButton === 'button3'} 
          onClick={() => handleButtonClick('button3', 'painting')} 
          id="button3" 
        />
        <ToolbarButton 
          normalIcon="./assets/normal_u109.svg" 
          hoverIcon="./assets/mouseover_u109_mouseover.svg" 
          isActive={activeButton === 'button4'} 
          onClick={() => handleButtonClick('button4', 'dragging')} 
          id="button4" 
        />
      </div>
      <Render mode={mode} file={uploadedFile} />
    </div>
  );
};

export default App;
