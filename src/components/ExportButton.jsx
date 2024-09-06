import React from 'react';
import { exportSTL } from '../utils/exportSTL';

const ExportButton = React.forwardRef(({ onClick }, ref) => {
  const handleExport = () => {
    if (ref.current) {
      const scene = ref.current.getScene(); // Get the scene or mesh from STLViewer
      exportSTL(scene);
    } else {
      console.log('STLViewer is not ready');
    }
  };

  return (
    <button onClick={handleExport}>Export STL</button>
  );
});

export default ExportButton;
