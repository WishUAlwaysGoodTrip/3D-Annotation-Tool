// src/App.jsx
import './App.css';
import Render from './Component/Render.js'; // 引入渲染组件
import ToolbarButton from './Component/ToolbarButton.jsx';

const App = () => {
  return (
    <div className="app">
      <div id="toolbar">
        <ToolbarButton normalIcon="./assets/normal_u110.svg" hoverIcon="./assets/mouseover_u110_mouseover.svg" />
        <ToolbarButton normalIcon="./assets/normal_u111.svg" hoverIcon="./assets/mouseover_u111_mouseover.svg" />
        <ToolbarButton normalIcon="./assets/normal_u105.svg" hoverIcon="./assets/mouseover_u105_mouseover.svg" />
        <ToolbarButton normalIcon="./assets/normal_u109.svg" hoverIcon="./assets/mouseover_u109_mouseover.svg" />
      </div>
      <Render />
    </div>
  );
};

export default App;
