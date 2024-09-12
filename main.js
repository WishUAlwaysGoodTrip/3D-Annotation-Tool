import { app, BrowserWindow, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ipcMain ,dialog} from 'electron';  // 引入 ipcMain 用于与前端通信
import fs from 'fs';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let win;
let hotkeysWindow; // 声明一个全局变量用于保存热键窗口实例

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,  // 允许使用 Node.js API
      contextIsolation: false // 禁用上下文隔离
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const port = 5173; // 确保这个端口与 vite.config.js 中的配置一致
    win.loadURL(`http://localhost:${port}/`);
  } else {
    win.loadFile(join(__dirname, 'dist', 'index.html'));
  }
}
function createHotkeysWindow() {
  // 如果窗口已经存在，则不需要重新创建
  if (hotkeysWindow) {
    hotkeysWindow.focus();  // 如果已经存在窗口，聚焦窗口
    return;
  }

  hotkeysWindow = new BrowserWindow({
    width: 500,
    height: 420,
    modal: true,  // 模态窗口，使其成为主窗口的子窗口
    parent: win,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载 HTML 或者 URL 页面
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const port = 5173;
    hotkeysWindow.loadURL(`http://localhost:${port}/hotkeys.html`);  // 在开发模式下加载热键配置的页面
  } else {
    hotkeysWindow.loadFile(join(__dirname, 'dist', 'hotkeys.html'));  // 在生产模式下加载打包后的 HTML 文件
  }

  // 监听窗口关闭事件
  hotkeysWindow.on('closed', () => {
    hotkeysWindow = null;  // 窗口关闭后重置变量
  });
}


// 创建自定义菜单
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Developer Tools',
          accelerator: 'Ctrl+Shift+I',
          click() {
            win.webContents.toggleDevTools();
          },
        },
        { label: 'New Project', click() { console.log('New Project'); } },
        { label: 'Open Folder', click() {     
          dialog.showOpenDialog({
            properties: ['openDirectory'],  // 允许选择文件夹
          }).then(result => {
            if (!result.canceled) {
              const folderPath = result.filePaths[0];
      
              // 递归函数，用于遍历文件夹及其子文件夹中的 .stl 文件
              function getAllStlFiles(dirPath) {
                let stlFiles = [];
                const files = fs.readdirSync(dirPath);
      
                files.forEach(file => {
                  const filePath = path.join(dirPath, file);
                  const stat = fs.statSync(filePath);
      
                  if (stat.isDirectory()) {
                    // 如果是文件夹，则递归调用函数
                    stlFiles = stlFiles.concat(getAllStlFiles(filePath));
                  } else if (file.endsWith('.stl')) {
                    // 如果是 .stl 文件，添加到文件列表中
                    const fileData = fs.readFileSync(filePath);  // 同步读取文件数据
                    const fileBase64 = fileData.toString('base64');  // 转换为 base64
                    stlFiles.push({
                      name: file,
                      path: filePath,
                      data: fileBase64,
                      size: fs.statSync(filePath).size
                    });
                  }
                });
      
                return stlFiles;
              }
      
              // 获取文件夹中所有的 .stl 文件
              const stlFiles = getAllStlFiles(folderPath);
      
              // 如果有找到 .stl 文件，将文件列表发送到渲染进程
              if (stlFiles.length > 0) {
                win.webContents.send('folder-selected', {
                  folderPath,
                  files: stlFiles
                });
              } else {
                console.log('未在所选文件夹及其子文件夹中找到 STL 文件。');
              }
            }
          }).catch(err => {
            console.log('读取文件夹时出错:', err);
          });
            }
        },
        { 
          label: 'Open File',
          click() {
            dialog.showOpenDialog({
              properties: ['openFile'],
              filters: [
                { name: 'STL Files', extensions: ['stl'] }  // 只允许选择 STL 文件
              ]
            }).then(result => {
              if (!result.canceled) {
                const filePath = result.filePaths[0];
                const fileData = fs.readFileSync(filePath); // 同步读取文件内容
                const fileBase64 = fileData.toString('base64'); // 转为 Base64
                const fileObject = {
                  name: path.basename(filePath),
                  path: filePath,
                  data: fileBase64,  // 将文件内容转换为 base64 字符串
                  size: fs.statSync(filePath).size 
                 }; // 文件大小// 将选择的文件路径发送到渲染进程
                 // 将文件对象发送到渲染进程
                console.log('File Object Sent:', fileObject);  // 输出文件对象以供调试
                win.webContents.send('file-selected', fileObject);
              }
            }).catch(err => {
              console.log('Error:', err);
            });}
        },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click() { console.log('Save'); } },
        { label: 'Save As…', click() { console.log('Save As…'); } },
        { label: 'Open Recent', click() { win.webContents.send('open-recent'); } },
        { label: 'Export…', click() { console.log('Export…'); } }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        { label: 'Configure Hotkeys…', click() { createHotkeysWindow();  } },
        { label: 'Configure Preferences…', click() { console.log('Configure Preferences…'); } }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About', click() { console.log('About'); } }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();  // 创建菜单
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
