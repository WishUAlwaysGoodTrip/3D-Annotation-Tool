import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useFolderToolbarStore from '../stores/useFolderToolbarStore.js'
const { ipcRenderer } = window.require('electron');

const FolderUploadButton = ({ onFolderUpload, handleDirectoryChange, fileList, folderPath }) => {
    //const [listWidth, setListWidth] = useState(200); 
    const {listWidth, setListWidth} = useFolderToolbarStore();
    const [listHeight, setListHeight] = useState(window.innerHeight * 0.7); // Default height
    const [selectedFile, setSelectedFile] = useState(null); // Save the currently selected file
    //const [isListVisible, setIsListVisible] = useState(true);
    const {isListVisible, setIsListVisible} = useFolderToolbarStore();
    const {setIsFileListLoaded} = useFolderToolbarStore();
    const [highlightedFiles, setHighlightedFiles] = useState([]); // Save the file name that needs to be highlighted
    const [toggleButtonTop, setToggleButtonTop] = useState('50%');
    const listRef = useRef(null);

    useEffect(() => {
      const handleWindowResize = () => {
        setListHeight(window.innerHeight * 0.7);   
        // Update button position when window size changes
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
    
    // When the folder path is updated, listen for matching. stl files
    useEffect(() => {
      ipcRenderer.on('folder-selected', (event, { folderPath, files, matchingFiles }) => {
        setHighlightedFiles(matchingFiles);  // //Set the file name that needs to be highlighted
      });

      return () => {
        ipcRenderer.removeAllListeners('folder-selected');
      };
    }, []);

    useEffect(() => {
      updateToggleButtonPosition();
      if(fileList.length > 0) setIsFileListLoaded(true);
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
          setListWidth(Math.max(200, Math.min(500, currentWidth))); 
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
        setSelectedFile(file); 
        onFolderUpload(file); 
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
                    const isHighlighted = highlightedFiles.includes(file.name);
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
                  {/* Resizer for adjusting width */}
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
    
            {/* The > button in hidden state is only displayed when there is a file list and it is hidden */}
            {!isListVisible && (
              <button
                onClick={toggleListVisibility}
                className="show-button"
                style={{
                  top: toggleButtonTop,
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
