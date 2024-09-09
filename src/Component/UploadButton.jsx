import React from 'react';
import PropTypes from 'prop-types';

const UploadButton = ({ onFileUpload, accept = '.stl', label = 'Upload File' }) => {

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);  // 传递上传的文件到父组件
    }
  };

  return (
    <div className="upload-button">
      <input 
        type="file" 
        accept={accept}  // 指定文件类型
        id="fileInput"
        style={{ display: 'none' }} 
        onChange={handleFileChange}
      />
      <button onClick={() => document.getElementById('fileInput').click()}>
      <img 
          src="./assets/upload-solid.svg"  // 确保图标路径正确
          alt="Upload Icon" 
          className="upload-icon" 
        />
        {label}  {/* 上传按钮上的标签 */}
      </button>
    </div>
  );
};

UploadButton.propTypes = {
  onFileUpload: PropTypes.func.isRequired,  // 回调函数，用于将文件传递给父组件
  accept: PropTypes.string,  // 可接受的文件类型，默认是 .stl
  label: PropTypes.string,   // 按钮标签
};

export default UploadButton;
