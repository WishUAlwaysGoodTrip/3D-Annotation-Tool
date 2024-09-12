import { useState } from 'react';
import PropTypes from 'prop-types';

const ToolbarButton = ({ normalIcon, hoverIcon, isActive, onClick, id }) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <button
      className={`toolbar-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      id={id}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <img src={isHover ? hoverIcon : normalIcon} alt="button" className="toolbar-icon" />
    </button>
  );
};

ToolbarButton.propTypes = {
  normalIcon: PropTypes.string.isRequired,
  hoverIcon: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
};

export default ToolbarButton;
