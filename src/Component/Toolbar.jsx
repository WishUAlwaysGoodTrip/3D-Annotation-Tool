
import ToolbarButton from './ToolbarButton';
import PropTypes from 'prop-types';

const Toolbar = ({ activeButton, handleButtonClick }) => {
  return (
    <div id="toolbar">
      <ToolbarButton 
        normalIcon="./assets/normal_u110.svg" 
        hoverIcon="./assets/mouseover_u110_mouseover.svg" 
        isActive={activeButton === 'button1'} 
        onClick={() => handleButtonClick('button1')} 
        id="button1" 
      />
      <ToolbarButton 
        normalIcon="./assets/normal_u111.svg" 
        hoverIcon="./assets/mouseover_u111_mouseover.svg" 
        isActive={activeButton === 'button2'} 
        onClick={() => handleButtonClick('button2')} 
        id="button2" 
      />
      <ToolbarButton 
        normalIcon="./assets/normal_u105.svg" 
        hoverIcon="./assets/mouseover_u105_mouseover.svg" 
        isActive={activeButton === 'button3'} 
        onClick={() => handleButtonClick('button3', 'painting')} 
        id="button3" 
      />
      <ToolbarButton 
        normalIcon="./assets/normal_u109.svg" 
        hoverIcon="./assets/mouseover_u109_mouseover.svg" 
        isActive={activeButton === 'button4'} 
        onClick={() => handleButtonClick('button4', 'dragging')} 
        id="button4" 
      />
    </div>
  );
};

Toolbar.propTypes = {
    activeButton: PropTypes.string.isRequired,
    handleButtonClick: PropTypes.func.isRequired,
  };

export default Toolbar;