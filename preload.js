// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electronAPI', {
  readFile: (filePath) => fs.readFileSync(filePath),  //Read file content
  writeFile: (filePath, data) => fs.writeFileSync(filePath, data),  //Write file content
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
