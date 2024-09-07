import  { useState } from 'react';
import PropTypes from 'prop-types';



const ToolbarButton = ({ normalIcon, hoverIcon }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      className="toolbar-button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={hovered ? hoverIcon : normalIcon} alt="button" className="toolbar-icon"/>
    </button>
  );
};

ToolbarButton.propTypes = {
    normalIcon: PropTypes.string.isRequired,
    hoverIcon: PropTypes.string.isRequired,
  };

export default ToolbarButton;