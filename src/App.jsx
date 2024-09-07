import React, { useState } from 'react';
import './App.css';
import Render from './Component/Render.js';
import ToolbarButton from './Component/ToolbarButton.jsx';

const App = () => {
  const [activeButton, setActiveButton] = useState(null);

  const handleButtonClick = (buttonId) => {
    setActiveButton(buttonId);
  };

  return (
    <div className="app">
      <div id="toolbar">
        <ToolbarButton normalIcon="./assets/normal_u110.svg" hoverIcon="./assets/mouseover_u110_mouseover.svg" isActive={activeButton === 'button1'} onClick={() => handleButtonClick('button1')} />
        <ToolbarButton normalIcon="./assets/normal_u111.svg" hoverIcon="./assets/mouseover_u111_mouseover.svg" id="line" isActive={activeButton === 'button2'} onClick={() => handleButtonClick('button2')} />
        <ToolbarButton normalIcon="./assets/normal_u105.svg" hoverIcon="./assets/mouseover_u105_mouseover.svg" isActive={activeButton === 'button3'} onClick={() => handleButtonClick('button3')} />
        <ToolbarButton normalIcon="./assets/normal_u109.svg" hoverIcon="./assets/mouseover_u109_mouseover.svg" isActive={activeButton === 'button4'} onClick={() => handleButtonClick('button4')} />
      </div>
      <Render />
    </div>
  );
};

export default App;
