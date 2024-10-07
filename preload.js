// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => fs.readFileSync(filePath),  // 读取文件内容
  writeFile: (filePath, data) => fs.writeFileSync(filePath, data),  // 写入文件内容
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
