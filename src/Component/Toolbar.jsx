import ToolbarButton from './ToolbarButton';
import '../Toolbar.css'
import useToolbarStore from '../stores/useToolbarStore.js'
import useFolderToolbarStore from "../stores/useFolderToolbarStore.js";

const Toolbar = () => {
  const { setMode, activeButton, setActiveButton, wireFrame} = useToolbarStore();
  const {isPanelVisible, setIsPanelVisible, changeWireFrame} = useToolbarStore();
  const {listWidth, isListVisible} = useFolderToolbarStore();
  const {isFileListLoaded} = useFolderToolbarStore();

  const handleButtonClick = (newMode) => {
    setMode(newMode);
    console.log(newMode);
  };

  return (
      <div id="toolbar"
           style={{
               left: isFileListLoaded && isListVisible ? `${listWidth + 32}px` : '8px',  // fileList 显示时紧贴右侧，隐藏时回到左侧
           }}>
        {/* Button 1 */}
        <ToolbarButton
          normalIcon="./assets/normal_u110.svg"
          hoverIcon="./assets/mouseover_u110_mouseover.svg"
          isActive={activeButton === 'button1'}
          onClick={() => {
            handleButtonClick('point');
            setActiveButton("button1");
          }}
          id="button1"
        />
        {/* Button 2 */}
        <ToolbarButton
          normalIcon="./assets/normal_u111.svg"
          hoverIcon="./assets/mouseover_u111_mouseover.svg"
          isActive={activeButton === 'button2'}
          onClick={() => {
            handleButtonClick('line');
            setActiveButton("button2");
          }}
          id="button2"
        />
        {/* Button 3 (This button toggles the panel) */}
        <ToolbarButton
          normalIcon="./assets/normal_u105.svg"
          hoverIcon="./assets/mouseover_u105_mouseover.svg"
          isActive={activeButton === 'button3'}
          onClick={() => {
            handleButtonClick('painting');
            setActiveButton("button3");
            setIsPanelVisible(!isPanelVisible);  // 点击后显示/隐藏面板
          }}
          id="button3"
        />
        {/* Button 4 */}
        <ToolbarButton
          normalIcon="./assets/normal_u109.svg"
          hoverIcon="./assets/mouseover_u109_mouseover.svg"
          isActive={activeButton === 'button4'}
          onClick={() => {
            handleButtonClick('dragging');
            setActiveButton("button4");
            changeWireFrame(wireFrame);
          }}
          id="button4"
        />
        {/* Button 5 */}
        <ToolbarButton
           normalIcon="./assets/normal_u112.svg"
           hoverIcon="./assets/mouseover_u112_mouseover.svg"
           isActive={activeButton === 'button5'}
           onClick={() => {
             handleButtonClick('erasing');
             setActiveButton("button5");
             setIsPanelVisible(!isPanelVisible); 
           }}
           id="button5"
         />
      </div>
  );
};


export default Toolbar;