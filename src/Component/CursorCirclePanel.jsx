import React, { useState } from 'react';
import useToolbarStore from '../stores/useToolbarStore.js'
import '../CursorCirclePanel.css'

const CursorCirclePanel = () => {
  const [cursorOpacity, setCursorOpacity] = useState(0.5);
  const [cursorColor, setCursorColor] = useState('#FFFF00');
  const [cursorSize, setCursorSize] = useState(2);
  const {isPanelVisible, closePanel} = useToolbarStore();  

  return (
    <>
      {isPanelVisible && (
          <div id="cursor-panel">
          <button className="close-button" onClick={closePanel}>×</button> 
            <div className="cursor-option">
              <label>Opacity: </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={cursorOpacity}
                onChange={(e) => setCursorOpacity(e.target.value)}
              />
              <input
                type="number"
                min="0"
                max="1"
                value={cursorOpacity}
                onChange={(e) => setCursorOpacity(e.target.value)}
                step="0.1"
              />
            </div>
            <div className="cursor-option">
              <label>Color: </label>
              <input
                type="color"
                value={cursorColor}
                onChange={(e) => setCursorColor(e.target.value)}
              />
              <input
                type="text"
                value={cursorColor}
                onChange={(e) => setCursorColor(e.target.value)}
              />
            </div>
            <div className="cursor-option">
              <label>Size: </label>
              <input
                type="range"
                min="1"
                max="20"
                value={cursorSize}
                onChange={(e) => setCursorSize(e.target.value)}
                step="0.05"
              />
              <input
                type="number"
                min="1"
                max="20"
                value={cursorSize}
                onChange={(e) => setCursorSize(e.target.value)}
                step="0.5"
              />
            </div>
          </div>
        )}
    </>
  );
};

export default CursorCirclePanel;
