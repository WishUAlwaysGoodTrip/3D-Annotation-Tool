
import ToolbarButton from './ToolbarButton';
import '../Toolbar.css'
import useToolbarStore from '../stores/useToolbarStore.js'
import Draggable from 'react-draggable';

const Toolbar = () => {
  const {setMode ,activeButton, setActiveButton} = useToolbarStore();
  const handleButtonClick = (newMode) => {
    setMode(newMode);
    console.log(newMode)
  };
  return (
    <Draggable>
      <div id="toolbar">
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
        <ToolbarButton
          normalIcon="./assets/normal_u105.svg"
          hoverIcon="./assets/mouseover_u105_mouseover.svg"
          isActive={activeButton === 'button3'}
          onClick={() => {
            handleButtonClick('painting');
            setActiveButton("button3");
          }}
          id="button3"
        />
        <ToolbarButton
          normalIcon="./assets/normal_u109.svg"
          hoverIcon="./assets/mouseover_u109_mouseover.svg"
          isActive={activeButton === 'button4'}
          onClick={() => {
            handleButtonClick('dragging');
            setActiveButton("button4");
          }}
          id="button4"
        />
        <ToolbarButton
           normalIcon="./assets/normal_u112.svg"
           hoverIcon="./assets/mouseover_u112_mouseover.svg"
           isActive={activeButton === 'button5'}
           onClick={() => {
             handleButtonClick('erasing');
             setActiveButton("button5");
           }}
           id="button5"
         />
      </div>
    </Draggable>
  );
};

export default Toolbar;