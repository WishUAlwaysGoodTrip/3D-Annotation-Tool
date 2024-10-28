import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
const { ipcRenderer } = window.require('electron');

const FolderUploadButton = ({ onFolderUpload, handleDirectoryChange, fileList, folderPath }) => {
    const [listWidth, setListWidth] = useState(200); // 默认宽度
    const [listHeight, setListHeight] = useState(window.innerHeight * 0.7); // 默认高度
    const [selectedFile, setSelectedFile] = useState(null); // 保存当前选中的文件
    const [isListVisible, setIsListVisible] = useState(true); 
    const [highlightedFiles, setHighlightedFiles] = useState([]); // 保存需要高亮的文件名

    useEffect(() => {
      const handleWindowResize = () => {
        setListHeight(window.innerHeight * 0.7); // 将高度设为窗口高度的 70%
      };

      window.addEventListener('resize', handleWindowResize);

      return () => {
        window.removeEventListener('resize', handleWindowResize);
      };
    }, []);

    // 当文件夹路径更新时，监听匹配的 .stl 文件
    useEffect(() => {
      ipcRenderer.on('folder-selected', (event, { folderPath, files, matchingFiles }) => {
        setHighlightedFiles(matchingFiles);  // 设置需要高亮的文件名
      });

      // 清理事件监听器
      return () => {
        ipcRenderer.removeAllListeners('folder-selected');
      };
    }, []);

    const startResize = (event) => {
        const startX = event.clientX;
        const startWidth = listWidth;

        const doResize = (event) => {
          const currentWidth = startWidth + event.clientX - startX;
          setListWidth(Math.max(200, Math.min(500, currentWidth))); // 限制宽度在 200px 到 500px 之间
        };

        const stopResize = () => {
          document.removeEventListener('mousemove', doResize);
          document.removeEventListener('mouseup', stopResize);
        };

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    };

    const handleFileClick = (file) => {
        console.log('File object:', file);
        setSelectedFile(file); // 设置当前选中的文件
        onFolderUpload(file); // 执行上传逻辑
        ipcRenderer.send('file-clicked', file.name); 
    };

    const toggleListVisibility = () => {
      setIsListVisible(!isListVisible);
    };

    return (
      <div>
        {fileList.length > 0 && (
          <>
            {isListVisible && (
              <div className="file-list" style={{ width: `${listWidth}px`, height: `${listHeight}px` }}>
                  <button 
                    onClick={toggleListVisibility} 
                    className="toggle-button top-right"
                  >
                    -
                  </button>
                  <div className="folder-path">
                    Folder: {folderPath ? folderPath.split('\\').pop() : 'Unknown Folder'}
                  </div>
                  {fileList.map((file, index) => {
                    const isHighlighted = highlightedFiles.includes(file.name); // 检查文件是否需要高亮
                    return (
                      <div 
                        key={index} 
                        onClick={() => handleFileClick(file)} 
                        className={`file-item ${selectedFile === file ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                      >
                        {file.webkitRelativePath || file.name}
                      </div>
                    );
                  })}
                  {/* 用于调整宽度的 resizer */}
                  <div 
                    className="resizer" 
                    onMouseDown={startResize} 
                    style={{ cursor: 'ew-resize', width: '5px', background: '#ccc' }}
                  ></div>
              </div>
            )}
    
            {!isListVisible && (
              <button 
                onClick={toggleListVisibility} 
                className="show-button"
                style={{ position: 'absolute', top: '10px', left: '10px' }} // 确保右箭头在页面右上角
              >
                +
              </button>
            )}
          </>
        )}
      </div>
    );
};

FolderUploadButton.propTypes = {
  onFolderUpload: PropTypes.func.isRequired,
  handleDirectoryChange: PropTypes.func.isRequired,
  fileList: PropTypes.array.isRequired,
  folderPath: PropTypes.string.isRequired,
};

export default FolderUploadButton;
