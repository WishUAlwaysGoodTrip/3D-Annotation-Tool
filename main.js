import { app, BrowserWindow, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ipcMain ,dialog} from 'electron';  // 引入 ipcMain 用于与前端通信
import fs from 'fs';
import path from 'path';
import Store from 'electron-store'
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
  win.webContents.on('did-finish-load', () => {
    loadDefaultFile();
  });
}

function loadDefaultFile() {
  const defaultFilePath = path.join(__dirname, 'public', 'datasettest', 'SuperMario02.stl');

  // 检查文件是否存在
  if (fs.existsSync(defaultFilePath)) {
    const fileData = fs.readFileSync(defaultFilePath);
    const fileBase64 = fileData.toString('base64');

    // 将文件发送到渲染进程
    win.webContents.send('file-selected', {
      name: 'SuperMario02.stl',
      path: defaultFilePath,
      data: fileBase64,
      size: fs.statSync(defaultFilePath).size
    });
  } else {
    console.error('Default STL file not found at:', defaultFilePath);
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
    },
    autoHideMenuBar: true, 
  });

  hotkeysWindow.setMenuBarVisibility(false);

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
    hotkeysWindow = null;
  });
}

function getRecentFilesSubmenu() {
  const recentFiles = store.get('recentFiles') || [];

  // 过滤掉无效的文件路径
  const validRecentFiles = recentFiles.filter(filePath => typeof filePath === 'string' && filePath.trim() !== '');

  if (validRecentFiles.length === 0) {
    return [{ label: 'No recent files', enabled: false }];
  }

  return validRecentFiles.map(filePath => ({
    label: path.basename(filePath),
    click() {
      const fileData = fs.readFileSync(filePath);
      const fileBase64 = fileData.toString('base64');
      const fileObject = {
        name: path.basename(filePath),
        path: filePath,
        data: fileBase64,
        size: fs.statSync(filePath).size
      };
      win.webContents.send('file-selected', fileObject);
    }
  }));
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click() {
            win.webContents.toggleDevTools();
          },
        },
        { label: 'New Project', click() { console.log('New Project'); } },
        { label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click() {
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
                  updateRecentFiles(stlFiles[0].path); 
                } else {
                  dialog.showMessageBox({
                    type: 'warning',
                    title: 'No STL Files Found',
                    message: 'No STL files were found. Please select a folder with STL files.',
                    buttons: ['OK'],
                  defaultId: 0,
                    modal: true,
                  parent: win,
                }).then(() => {
                  console.log('No STL files dialog was closed');
                  });
                }
              }
          }).catch(err => {
            console.log('Error in upload folder:', err);
          });
          }
        },
        { 
          label: 'Open File',
          accelerator: 'CmdOrCtrl+Shift+O',
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
                win.webContents.send('file-selected', fileObject);
                updateRecentFiles(filePath); // 更新最近文件
              }
            }).catch(err => {
              console.log('Error:', err);
            });}
        },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click() { console.log('Save'); } },
        { label: 'Save As…', click() { console.log('Save As…'); } },
        { label: 'Open Recent',
          submenu: getRecentFilesSubmenu() // 动态获取最近文件子菜单
        },
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
        { label: 'Configure Hotkeys…',
          accelerator: 'CmdOrCtrl+H',
          click() { createHotkeysWindow();  } },
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
function updateRecentFiles(filePath) {
  let recentFiles = store.get('recentFiles') || [];
  if (!recentFiles.includes(filePath)) {
    recentFiles.unshift(filePath);
    if (recentFiles.length > 5) {
      recentFiles.pop(); // 保留最近的5个文件
    }
    store.set('recentFiles', recentFiles);
    createMenu(); // 重新生成菜单，更新最近文件
  }
}

app.whenReady().then(() => {
  createWindow();
  createMenu();  // 创建菜单
});

const store = new Store();
ipcMain.on('electron-store-get', (event, key) => {
  event.returnValue = store.get(key);
});

ipcMain.on('electron-store-set', (event, key, value) => {
  store.set(key, value);
  event.returnValue = true;
});

ipcMain.on('electron-store-delete', (event, key) => {
  store.delete(key);
  event.returnValue = true;
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
