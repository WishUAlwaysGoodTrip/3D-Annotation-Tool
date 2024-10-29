// import { useState, useEffect } from 'react';

// export const useRecentFiles = (uploadedFile) => {
//   const [recentFiles, setRecentFiles] = useState([]);
//   const [showRecentFiles, setShowRecentFiles] = useState(false);

//   useEffect(() => {
//     if (uploadedFile && !recentFiles.some(file => file.name === uploadedFile.name)) {
//       setRecentFiles(prevFiles => [uploadedFile, ...prevFiles]);
//     }
//   }, [uploadedFile, recentFiles]);

//   const toggleRecentFiles = () => {
//     setShowRecentFiles(prev => !prev);
//   };

  
//   const toggleFileList = () => {
//     setShowFileList((prev) => !prev); 
//   };

//   return {
//     recentFiles,
//     showRecentFiles,
//     toggleRecentFiles,
//     setRecentFiles,
//     setShowRecentFiles
//   };
// };
