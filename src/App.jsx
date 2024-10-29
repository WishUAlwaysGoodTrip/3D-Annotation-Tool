import React, { useState } from 'react';
import './App.css';
import Render from './Component/Render.jsx';
import Toolbar from './Component/Toolbar.jsx';
import FolderUploadButton from './Component/FolderUploadButton.jsx';
//import RecentFilesList from './Component/RecentFilesList.jsx';
import { convertFileObjectToBlob } from './Component/convertFileObjectToBlob';
import { useFileUploadStore } from './stores/useFileUploadStore.js';
// import { useRecentFiles } from './hooks/useRecentFiles';
import { useIpcRenderer } from './hooks/useIpcRenderer';
import AnnotationPanel from './Component/AnnotationPanel.jsx';
import CursorCirclePanel from './Component/CursorCirclePanel.jsx';
import { set } from 'lodash';

const App = () => {
  const [selectedColor, setSelectedColor] = useState(''); // Save the color selected from AnnotationPanel
  const [currentAnnotationName, setCurrentAnnotationName] = useState(''); // Save the currently selected annotation name
  const [selecttoothColor, setToothColors] = useState(''); // Save tooth ID and corresponding color
  const [selectedToothId, setSelectedToothId] = useState(''); // Save the currently selected tooth ID
  const {uploadedFile, uploadedFiles, folderPath, handleDirectoryChange, setUploadedFile, setUploadedFiles, setFolderPath } = useFileUploadStore();
  // const { recentFiles, showRecentFiles, toggleRecentFiles, setRecentFiles, setShowRecentFiles } = useRecentFiles(uploadedFile);
  const [teethData, setTeethData] = useState([]);
  useIpcRenderer(setUploadedFile, setUploadedFiles, setFolderPath, convertFileObjectToBlob);

    
  const handleFileSelect = (file) => {
    setUploadedFile(file);  
  };

  // Process AnnotationPanel color changes
  const handleColorChange = (color, annotationName) => {
    setSelectedColor(color); 
    setCurrentAnnotationName(annotationName); // Save the current annotation name
  };

  const handleToothColorChange = (toothId, color,annotations) => {
    setToothColors(color);  // Save tooth ID and color
    setSelectedToothId(toothId);  // Save the currently selected tooth ID
    // console.log('tooth color app', toothId, color);
  };

  const handleTeethDataChange = (updatedTeeth) => {
    setTeethData(updatedTeeth);
    console.log('Updated Teeth Data:', updatedTeeth);
  };

  return (
    <div className="app">
      <header className="app-header">
        <FolderUploadButton 
          onFolderUpload={handleFileSelect}
          handleDirectoryChange={handleDirectoryChange}
          fileList={uploadedFiles}
          folderPath={folderPath}  // Pass folder path
        />
      </header>

      {/* Show/Hide Recent File List */}
      {/* {showRecentFiles && (
        <RecentFilesList 
          recentFiles={recentFiles} 
          onFileSelect={handleFileSelect} 
          toggleRecentFiles={toggleRecentFiles} 
        />
      )} */}

      <Toolbar />

      <CursorCirclePanel />

      <Render 
        file={uploadedFile} 
        brushColor={selectedColor} 
        annotationName={currentAnnotationName} 
        toothColor={selecttoothColor}  // Pass the tooth color to the Render 
        toothId={selectedToothId}  // Pass the tooth ID to the Render 
        teethData={teethData}  // Pass teeth data to the Render 
      />

      <AnnotationPanel 
        file={uploadedFile} 
        onColorChange={handleColorChange} 
        onToothColorChange={handleToothColorChange}  // Pass tooth color change processing function
        onTeethDataChange={handleTeethDataChange}
      />
    </div>
  );
};
export default App;
