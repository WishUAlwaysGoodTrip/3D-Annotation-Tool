import React, { useState } from 'react';
import './App.css';
import Render from './Component/Render.jsx';
import ToolbarButton from './Component/ToolbarButton.jsx';

const App = () => {
  const [activeButton, setActiveButton] = useState('button4');
  const [mode, setMode] = useState('dragging'); 

  const handleButtonClick = (buttonId, newMode = mode) => {
    setActiveButton(buttonId);
    setMode(newMode);
  };

  return (
    <div className="app">
      <div id="toolbar">
        <ToolbarButton normalIcon="./assets/normal_u110.svg" hoverIcon="./assets/mouseover_u110_mouseover.svg" isActive={activeButton === 'button1'} onClick={() => handleButtonClick('button1')} id="button1" />
        <ToolbarButton normalIcon="./assets/normal_u111.svg" hoverIcon="./assets/mouseover_u111_mouseover.svg" isActive={activeButton === 'button2'} onClick={() => handleButtonClick('button2')} id="button2" />
        <ToolbarButton normalIcon="./assets/normal_u105.svg" hoverIcon="./assets/mouseover_u105_mouseover.svg" isActive={activeButton === 'button3'} onClick={() => handleButtonClick('button3', 'painting')} id="button3" />
        <ToolbarButton normalIcon="./assets/normal_u109.svg" hoverIcon="./assets/mouseover_u109_mouseover.svg" isActive={activeButton === 'button4'} onClick={() => handleButtonClick('button4', 'dragging')} id="button4" />
      </div>
      <Render mode={mode} />
    </div>
  );
};

export default App;
