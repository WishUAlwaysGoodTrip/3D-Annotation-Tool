import React from 'react';

const ImportButton = ({ onFileLoaded }) => {
  // Handle file selection and loading
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target.result;
        // Call the parent component's callback with the file data
        onFileLoaded(result);
      };

      reader.readAsArrayBuffer(file); // Read the file as an ArrayBuffer
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".stl"
        style={{ display: 'none' }}
        id="stl-file-input"
        onChange={handleFileChange}
      />
      <button onClick={() => document.getElementById('stl-file-input').click()}>
        Import STL
      </button>
    </div>
  );
};

export default ImportButton;