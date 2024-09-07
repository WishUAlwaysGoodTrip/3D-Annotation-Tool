// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 确保导入主应用组件

// 确保在 DOM 加载完成后获取根元素
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
