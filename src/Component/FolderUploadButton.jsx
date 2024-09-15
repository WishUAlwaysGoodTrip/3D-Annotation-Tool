import React from 'react';
import PropTypes from 'prop-types';

const FolderUploadButton = ({ onFolderUpload, handleDirectoryChange, fileList, folderPath, listWidth, handleResize }) => {
    const startResize = (event) => {
        const startX = event.clientX;
        const startWidth = listWidth;
    
        const doResize = (event) => {
          const currentWidth = startWidth + event.clientX - startX;
          handleResize(Math.max(200, Math.min(500, currentWidth))); // 限制宽度
        };
    
        const stopResize = () => {
          document.removeEventListener('mousemove', doResize);
          document.removeEventListener('mouseup', stopResize);
        };
    
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
      };

  return (
    <div>
      {fileList.length > 0 && (
       <div className="file-list" style={{ width: `${listWidth}px` }}>
            <div className="folder-path">
              Folder: {folderPath ? folderPath.split('\\').pop() : 'Unknown Folder'}
            </div>
          {fileList.map((file, index) => (
            <div key={index} onClick={() => onFolderUpload(file)} className="file-item">
              {file.webkitRelativePath || file.name}
            </div>
          ))}
          <div className="resizer" onMouseDown={startResize} style={{ cursor: 'ew-resize' }}></div>
        </div>
      )}
    </div>
  );
};

FolderUploadButton.propTypes = {
  onFolderUpload: PropTypes.func.isRequired,
  handleDirectoryChange: PropTypes.func.isRequired,
  fileList: PropTypes.array.isRequired,
  folderPath: PropTypes.string.isRequired,  // 添加文件夹路径类型检查
};

export default FolderUploadButton;
