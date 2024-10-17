import useToolbarStore from '../stores/useToolbarStore.js'
import '../CursorCirclePanel.css'

const CursorCirclePanel = () => {
  const {cursorOpacity, cursorColor, cursorSize } = useToolbarStore();
  const {setCursorOpacity, setCursorColor, setCursorSize} = useToolbarStore();
  const {isPanelVisible, closePanel, } = useToolbarStore();
  const { cursorShape, setCursorShape } = useToolbarStore();
  
  return (
    <>
      {isPanelVisible && (
        <div id="cursor-panel">
          <button className="close-button" onClick={closePanel}>×</button> 
          <h3 className="panel-title">Cursor Settings</h3> {/* 添加标题 */}

          <div className="cursor-option">
            <label htmlFor="cursor-shape">Shape:</label>
            <select id="cursor-shape" value={cursorShape} onChange={(e) => setCursorShape(e.target.value)}>
              <option value="circle">Circle</option>
              <option value="rectangle">Rectangle</option>
            </select>
          </div>

          <div className="cursor-option">
            <label>Opacity: </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={cursorOpacity}
              onChange={(e) => setCursorOpacity(parseFloat(e.target.value))}
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={cursorOpacity}
              onChange={(e) => setCursorOpacity(parseFloat(e.target.value))}
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
              step="0.05"
              value={cursorSize}
              onChange={(e) => setCursorSize(parseFloat(e.target.value))}
            />
            <input
              type="number"
              min="1"
              max="20"
              step="0.5"
              value={cursorSize}
              onChange={(e) => setCursorSize(parseFloat(e.target.value))}
            />
          </div>

        </div>
      )}
    </>
  );
};

export default CursorCirclePanel;