import React, { useState, useEffect } from 'react';
import './App.css';
import Render from './Component/Render.jsx';
import Toolbar from './Component/Toolbar.jsx';
import FolderUploadButton from './Component/FolderUploadButton.jsx';
import RecentFilesList from './Component/RecentFilesList.jsx';
import { convertFileObjectToBlob } from './Component/convertFileObjectToBlob';



const { ipcRenderer } = window.require('electron');  // 使用 ipcRenderer 与主进程通信

const App = () => {
  const [activeButton, setActiveButton] = useState('button4'); // 将状态移到这里
  const [mode, setMode] = useState('dragging'); 
  const [uploadedFile, setUploadedFile] = useState(null);  // 存储上传的文件
  const [uploadedFiles, setUploadedFiles] = useState([]);  // 存储上传的文件夹中的.stl文件
  const [listWidth, setListWidth] = useState(250); // 默认宽度，可调整
  const [folderPath, setFolderPath] = useState(''); // 存储文件夹路径
  const [recentFiles, setRecentFiles] = useState([]); // 存储最近加载的文件
  const [showRecentFiles, setShowRecentFiles] = useState(false); // 控制显示最近文件列表
  const [showFileList, setShowFileList] = useState(false); // 控制显示文件列表

  const handleResize = (newWidth) => {
    setListWidth(newWidth); // 更新文件列表的宽度
  };

  const handleDirectoryChange = (event) => {
    const files = event.target.files;
    const stlFiles = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].webkitRelativePath.includes('/') && files[i].name.endsWith('.stl')) {
        stlFiles.push(files[i]);
      }
    }
    setUploadedFiles(stlFiles); // 更新状态以保存文件夹中的.stl文件列表
    if (stlFiles.length > 0) {
      const folderPath = files[0].webkitRelativePath.split('/')[0]; // 获取文件夹名称
      console.log('Folder path:', folderPath);  // 打印调试信息
      setFolderPath(folderPath);  // 设置文件夹地址
      setUploadedFile(stlFiles[0]);  // 设置第一个文件为当前上传文件，自动加载到 Render 组件
    } else {
      alert("No STL files found in the selected folder.");
    }
  };

  const handleButtonClick = (buttonId, newMode = mode) => {
    setActiveButton(buttonId);
    setMode(newMode);
  };

  const handleFileSelect = (file) => {
    setUploadedFile(file);  // 只设置当前激活的文件
  };

  const toggleRecentFiles = () => {
    setShowRecentFiles((prev) => !prev);  // 切换最近文件列表的显示状态
  };

  const toggleFileList = () => {
    setShowFileList((prev) => !prev);  // 切换文件列表的显示状态
  };

  // 确保 FolderUploadButton 正确使用这个新函数
  useEffect(() => {
    if (uploadedFile && !recentFiles.some(file => file.name === uploadedFile.name)) {
      setRecentFiles(prevFiles => [uploadedFile, ...prevFiles]); // 新文件在最前面
    }
  }, [uploadedFile, recentFiles]);

  // 监听来自主进程的 file-selected 事件
  useEffect(() => {
    ipcRenderer.on('file-selected', (event, fileObject) => {
      const file = convertFileObjectToBlob(fileObject);  // 使用转换函数
      setUploadedFile(file); // 保存文件对象到状态中 
    });

    return () => {
      ipcRenderer.removeAllListeners('file-selected');
    };
  }, []);
  
  useEffect(() => {
    // 监听 'open-recent' 事件
    ipcRenderer.on('open-recent', () => {
      setShowRecentFiles(true);  // 点击 'Open Recent' 后显示最近文件列表
    });

    // 清除事件监听器，避免内存泄漏
    return () => {
      ipcRenderer.removeAllListeners('open-recent');
    };
  }, []);
  useEffect(() => {
    ipcRenderer.on('folder-selected', (event, { folderPath, files }) => {
      const stlFiles = files.map(fileObject => convertFileObjectToBlob(fileObject));  // 使用转换函数
      setUploadedFiles(stlFiles);  // 设置文件列表状态
      setFolderPath(folderPath);  // 设置文件夹路径
      if (stlFiles.length > 0) {
        setUploadedFile(stlFiles[0]);  // 自动加载第一个文件
      }
    });
  
    return () => {
      ipcRenderer.removeAllListeners('folder-selected');
    };
  }, []);
  
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
      <Toolbar 
        activeButton={activeButton} 
        handleButtonClick={handleButtonClick} 
      />
      <Render mode={mode} file={uploadedFile} />
    </div>
  );
};

export default App;
