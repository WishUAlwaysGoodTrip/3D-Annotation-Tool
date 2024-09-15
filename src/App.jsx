import React, { useState} from 'react';
import './App.css';
import Render from './Component/Render.jsx';
import Toolbar from './Component/Toolbar.jsx';
import FolderUploadButton from './Component/FolderUploadButton.jsx';
import RecentFilesList from './Component/RecentFilesList.jsx';
import { convertFileObjectToBlob } from './Component/convertFileObjectToBlob';
//import { useFileUpload } from './hooks/useFileUpload.js'
import { useFileUploadStore } from './stores/useFileUploadStore.js'
import { useRecentFiles } from './hooks/useRecentFiles';
//import { useRecentFilesStore } from './stores/useRecentFilesStore.js'
import { useIpcRenderer } from './hooks/useIpcRenderer';
import AnnotationPanel from './Component/AnnotationPanel.jsx';

const App = () => {
  const [listWidth, setListWidth] = useState(250); // 默认宽度，可调整
  const [selectedColor, setSelectedColor] = useState(''); // 新增: 用于保存从 AnnotationPanel 选择的颜色
  const [currentAnnotationName, setCurrentAnnotationName] = useState(''); // 新增: 用于保存当前选中的注释名称

  // const [showFileList, setShowFileList] = useState(false); // 控制显示文件列表

  //const { uploadedFile, uploadedFiles, folderPath, handleDirectoryChange, setUploadedFile, setUploadedFiles, setFolderPath } = useFileUpload();
  const { uploadedFile, uploadedFiles, folderPath, handleDirectoryChange, setUploadedFile, setUploadedFiles, setFolderPath } = useFileUploadStore();

  const { recentFiles, showRecentFiles, toggleRecentFiles, setRecentFiles, setShowRecentFiles } = useRecentFiles(uploadedFile);

  useIpcRenderer(setUploadedFile, setUploadedFiles, setFolderPath, convertFileObjectToBlob, setShowRecentFiles);

  const handleResize = (newWidth) => {
    setListWidth(newWidth); // 更新文件列表的宽度
  };

  const handleFileSelect = (file) => {
    setUploadedFile(file);  // 只设置当前激活的文件
  };
  // 新增: 当 AnnotationPanel 选择颜色时，更新 App 组件的颜色状态
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
      <Toolbar />
      <Render file={uploadedFile} brushColor={selectedColor} annotationName={currentAnnotationName} />
      <AnnotationPanel onColorChange={handleColorChange} />
    </div>
  );
};

export default App;
