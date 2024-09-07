import React from 'react';
import PropTypes from 'prop-types';

const ToolbarButton = ({ normalIcon, hoverIcon, isActive, onClick, id }) => {
  return (
    <button
      className={`toolbar-button ${isActive ? 'active' : ''}`}
      id={id}
      onClick={onClick}
    >
      <img src={isActive ? hoverIcon : normalIcon} alt="button" className="toolbar-icon"/>
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