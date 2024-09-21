import useToolbarStore from '../stores/useToolbarStore.js'
import '../CursorCirclePanel.css'

const CursorCirclePanel = () => {
  const [brushOpacity, brushColor, brushSize ] = useToolbarStore();
  const [setBrushOpacity, setBrushColor, setBrushSize] = useToolbarStore()
  const {isPanelVisible, closePanel, } = useToolbarStore();

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
                value={brushOpacity}
                onChange={(e) => setBrushOpacity(e.target.value)}
              />
              <input
                type="number"
                min="0"
                max="1"
                value={brushOpacity}
                onChange={(e) => setBrushOpacity(e.target.value)}
                step="0.1"
              />
            </div>
            <div className="cursor-option">
              <label>Color: </label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
              />
              <input
                type="text"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
              />
            </div>
            <div className="cursor-option">
              <label>Size: </label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(e.target.value)}
                step="0.05"
              />
              <input
                type="number"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(e.target.value)}
                step="0.5"
              />
            </div>
          </div>
        )}
    </>
  );
};

export default CursorCirclePanel;
