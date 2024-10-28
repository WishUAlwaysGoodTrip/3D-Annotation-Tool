import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
const { ipcRenderer } = window.require('electron');

const FolderUploadButton = ({ onFolderUpload, handleDirectoryChange, fileList, folderPath }) => {
    const [listWidth, setListWidth] = useState(200); // 默认宽度
    const [listHeight, setListHeight] = useState(window.innerHeight * 0.7); // 默认高度
    const [selectedFile, setSelectedFile] = useState(null); // 保存当前选中的文件
    const [isListVisible, setIsListVisible] = useState(true);
    const [highlightedFiles, setHighlightedFiles] = useState([]); // 保存需要高亮的文件名
    const [toggleButtonTop, setToggleButtonTop] = useState('50%');
    const listRef = useRef(null);

    useEffect(() => {
      const handleWindowResize = () => {
        setListHeight(window.innerHeight * 0.7); // 将高度设为窗口高度的 70%    
        // 在窗口大小变化时更新按钮位置
        if (!isListVisible) {
          setToggleButtonTop(`${window.innerHeight * 0.7 / 2}px`);
        } else {
          updateToggleButtonPosition();
        }
      };

      window.addEventListener('resize', handleWindowResize);

      return () => {
        window.removeEventListener('resize', handleWindowResize);
      };
    }, [isListVisible]);
    
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

    useEffect(() => {
      updateToggleButtonPosition();
    }, [isListVisible, listHeight, fileList.length]);

    const updateToggleButtonPosition = () => {
      if (isListVisible && listRef.current) {
        const rect = listRef.current.getBoundingClientRect();
        setToggleButtonTop(`${rect.top + rect.height / 2}px`);
      } else if (!isListVisible) {
        setToggleButtonTop(`${listHeight / 2}px`);
      }
    };

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
      updateToggleButtonPosition();
    };

    return (
      <div style={{ display: 'flex' }}>
        {fileList.length > 0 && (
          <>
            {isListVisible && (
              <div style={{ display: 'flex' }}>
                <div
                  ref={listRef}
                  className="file-list"
                  style={{
                    width: `${listWidth}px`,
                    height: `${listHeight}px`,
                    position: 'relative',
                  }}
                >
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
                <button
                    onClick={toggleListVisibility}
                    className="slide-toggle-button"
                >
                   {'<'}
                </button>
              </div>
            )}
    
            {/* 隐藏状态时的 > 按钮，仅当有文件列表且被隐藏时显示 */}
            {!isListVisible && (
              <button
                onClick={toggleListVisibility}
                className="show-button"
                style={{
                  top: toggleButtonTop, // 动态调整位置
                  position: 'absolute',
                  left: 0,
                  transform: 'translateY(-50%)',
                }}
              >
                {'>'}
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
