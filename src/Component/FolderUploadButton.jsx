import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const FolderUploadButton = ({ onFolderUpload, handleDirectoryChange, fileList, folderPath }) => {
    const [listWidth, setListWidth] = useState(200); // 默认宽度
    const [listHeight, setListHeight] = useState(window.innerHeight * 0.7); // 默认高度
    const [selectedFile, setSelectedFile] = useState(null); // 保存当前选中的文件
    const [isListVisible, setIsListVisible] = useState(true); 

    useEffect(() => {
      const handleWindowResize = () => {
        setListHeight(window.innerHeight * 0.7); // 将高度设为窗口高度的 70%
      };

      window.addEventListener('resize', handleWindowResize);

      return () => {
        window.removeEventListener('resize', handleWindowResize);
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
        setSelectedFile(file); // 设置当前选中的文件
        onFolderUpload(file); // 执行上传逻辑
    };

    const toggleListVisibility = () => {
      setIsListVisible(!isListVisible);
    };

    return (
      <div>
        {fileList.length > 0 && (
          <>
            <button 
              onClick={toggleListVisibility} 
              className="toggle-button"
            >
              ...
            </button>
            {isListVisible && (
              <div className="file-list" style={{ width: `${listWidth}px`, height: `${listHeight}px` }}>
                  <div className="folder-path">
                    Folder: {folderPath ? folderPath.split('\\').pop() : 'Unknown Folder'}
                  </div>
                  {fileList.map((file, index) => (
                    <div 
                      key={index} 
                      onClick={() => handleFileClick(file)} 
                      className={`file-item ${selectedFile === file ? 'selected' : ''}`}
                    >
                      {file.webkitRelativePath || file.name}
                    </div>
                  ))}
                  {/* 用于调整宽度的 resizer */}
                  <div 
                    className="resizer" 
                    onMouseDown={startResize} 
                    style={{ cursor: 'ew-resize', width: '5px', background: '#ccc' }}
                  ></div>
              </div>
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
