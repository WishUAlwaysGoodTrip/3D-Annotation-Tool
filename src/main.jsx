// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 

//Ensure to retrieve the root element after DOM loading is complete
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Could not find root element to mount to!");
}
