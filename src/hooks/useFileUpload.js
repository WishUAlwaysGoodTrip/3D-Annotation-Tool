import { useState } from 'react';

export const useFileUpload = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [folderPath, setFolderPath] = useState('');

  const handleDirectoryChange = (event) => {
    const files = event.target.files;
    const stlFiles = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].webkitRelativePath.includes('/') && files[i].name.endsWith('.stl')) {
        stlFiles.push(files[i]);
      }
    }
    setUploadedFiles(stlFiles);
    if (stlFiles.length > 0) {
      const folderPath = files[0].webkitRelativePath.split('/')[0];
      setFolderPath(folderPath);
      setUploadedFile(stlFiles[0]);
    } else {
      alert("No STL files found in the selected folder.");
    }
  };

  return {
    uploadedFile,
    uploadedFiles,
    folderPath,
    handleDirectoryChange,
    setUploadedFile,
    setUploadedFiles,
    setFolderPath
  };
};
