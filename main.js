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
let latestFolderPath = '';  // 用于保存最新上传的文件夹路径
let saveDialogWindow;


function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const port = 5173;
    win.loadURL(`http://localhost:${port}/`);
  } else {
    win.loadFile(join(__dirname, 'dist', 'index.html'));
  }

  win.webContents.on('did-finish-load', () => {
    loadDefaultFile();
  });

  // 修改主窗口关闭逻辑
  win.on('close', (event) => {
    event.preventDefault(); // 防止窗口立即关闭
    createSaveDialog(); // 创建弹出窗口询问用户是否保存更改
  });
  
}

function loadDefaultFile() {
  const defaultFilePath = path.join(__dirname, 'public', 'datasettest', 'upper_default.stl');

  // 检查文件是否存在
  if (fs.existsSync(defaultFilePath)) {
    const fileData = fs.readFileSync(defaultFilePath);
    const fileBase64 = fileData.toString('base64');

    // 将文件发送到渲染进程
    win.webContents.send('file-selected', {
      name: 'upper_default.stl',
      path: defaultFilePath,
      data: fileBase64,
      size: fs.statSync(defaultFilePath).size
    });
  } else {
    console.error('Default STL file not found at:', defaultFilePath);
  }
}

function createSaveDialog() {
  if (saveDialogWindow) {
    saveDialogWindow.focus();
    return;
  }

  saveDialogWindow = new BrowserWindow({
    width: 400,
    height: 250,
    modal: true,  // 模态窗口，使其成为主窗口的子窗口
    parent: win,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true, 
  });;

  saveDialogWindow.loadFile(join(__dirname, 'public', 'save-dialog.html')).then(() => {
    setTimeout(() => {
      saveDialogWindow.show();
    }, 200);  // 200毫秒延迟
  });

  // saveDialogWindow.once('ready-to-show', () => {
  //   saveDialogWindow.show();
  // });

  saveDialogWindow.on('closed', () => {
    saveDialogWindow = null;
  });
}

// function createSaveDialog() {
//   if (saveDialogWindow) {
//     saveDialogWindow.focus();
//     return;
//   }

//   saveDialogWindow = new BrowserWindow({
//     width: 500,
//     height: 420,
//     modal: true,  // 模态窗口，使其成为主窗口的子窗口
//     parent: win,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false
//     },
//     autoHideMenuBar: true, 
//   });

//   const isDev = process.env.NODE_ENV === 'development';

//   if (isDev) {
//     const port = 5173;
//     saveDialogWindow.loadURL(`http://localhost:${port}/save-dialog.html`).then(() => {
//       setTimeout(() => {
//         saveDialogWindow.show();
//       }, 200);  // 200毫秒延迟
//     });
//   } else {
//     saveDialogWindow.loadFile(join(__dirname, 'dist', 'save-dialog.html')).then(() => {
//       setTimeout(() => {
//         saveDialogWindow.show();
//       }, 200);  // 200毫秒延迟
//     });
//   }
//   saveDialogWindow.on('closed', () => {
//     saveDialogWindow = null;
//   });
// }


function createHotkeysWindow() {
  // 如果窗口已经存在，则不需要重新创建
  if (hotkeysWindow) {
    hotkeysWindow.focus();  // 如果已经存在窗口，聚焦窗口
    return;
  }

  hotkeysWindow = new BrowserWindow({
    width: 500,
    height: 500,
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
        { label: 'Open Folder',
          accelerator: 'CmdOrCtrl+O',
          click() {
            dialog.showOpenDialog({
            properties: ['openDirectory'],  // 允许选择文件夹
            }).then(result => {
              if (!result.canceled) {
                const folderPath = result.filePaths[0];
                latestFolderPath = folderPath;  // 保存最新上传的文件夹路径
                const jsonFiles = getJsonFiles();
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
                const matchingFiles = stlFiles.filter(stlFile => {
                  const stlBaseName = path.basename(stlFile.name, '.stl');
                  return jsonFiles.includes(stlBaseName);  // 如果有同名的 .json 文件，返回 true
                });
              // 如果有找到 .stl 文件，将文件列表发送到渲染进程
                if (stlFiles.length > 0) {
                  win.webContents.send('folder-selected', {
                    folderPath,
                    files: stlFiles,
                    matchingFiles: matchingFiles.map(file => file.name)
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
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click() { win.webContents.send('save-data'); } },
        { label: 'Save As…', click() { console.log('Save As…'); } },
        { label: 'Open Recent',
          submenu: getRecentFilesSubmenu() // 动态获取最近文件子菜单
        },
        { label: 'Export…', click() { console.log('Export…'); } }
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

function findFileRecursive(directory, fileName) {
  const files = fs.readdirSync(directory);
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(directory, files[i]);
    const stat = fs.statSync(filePath);

    // 检查是否是文件夹，如果是，递归搜索子文件夹
    if (stat.isDirectory()) {
      const result = findFileRecursive(filePath, fileName);
      if (result) {
        return result; // 找到文件，返回文件路径
      }
    } else if (files[i] === fileName) {
      return filePath; // 找到文件，返回文件路径
    }
  }
  return null; // 文件未找到
}

function updateRecentFiles(filePath) {
  let recentFiles = store.get('recentFiles') || [];
  console.log('Updating recent files with:', filePath);  // 打印文件路径
  // 如果文件已经存在，移除它
  recentFiles = recentFiles.filter(file => file !== filePath);

  // 将文件添加到列表顶部
  recentFiles.unshift(filePath);

  // 如果列表长度超过5，移除最老的文件
  if (recentFiles.length > 5) {
    recentFiles.pop();  // 保留最近的5个文件
  }

  // 更新最近文件存储
  store.set('recentFiles', recentFiles);
  createMenu();  // 重新生成菜单，更新最近文件
}

// 获取 public/dataset 中所有的 .json 文件
function getJsonFiles() {
  const datasetPath = path.join(__dirname, 'public', 'datasettest');
  const jsonFiles = fs.readdirSync(datasetPath)
    .filter(file => file.endsWith('.json'))  // 只保留 .json 文件
    .map(file => path.basename(file, '.json'));  // 去掉扩展名，保留文件名
  return jsonFiles;
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

ipcMain.on('get-dirname', (event) => {
  event.returnValue = __dirname;  
});


ipcMain.on('electron-store-delete', (event, key) => {
  store.delete(key);
  event.returnValue = true;
});

ipcMain.on('file-clicked', (event, fileName) => {
  console.log('File clicked:', fileName);  // 打印文件名

  // 使用保存的最新文件夹路径来查找文件
  const filePath = findFileRecursive(latestFolderPath, fileName);
  console.log('FilePath clicked:', filePath);  // 打印文件路径

  // 检查文件是否存在
  if (fs.existsSync(filePath)) {
    // 更新最近文件列表
    updateRecentFiles(filePath);  // 将文件路径添加到最近文件列表
  } else {
    console.error('File not found:', filePath);
  }
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

ipcMain.on('save-changes', async (event, action) => {
  if (action === 'save') {
    try {
      await saveData();  // 确保 saveData() 是一个异步操作并返回 Promise
      if (saveDialogWindow) saveDialogWindow.close();
      win.destroy();  // 保存后关闭窗口
    } catch (error) {
      console.error('Error saving data:', error);
    }
  } else if (action === 'dontSave') {
    if (saveDialogWindow) saveDialogWindow.close();
    win.destroy();
  } else if (action === 'cancel') {
    if (saveDialogWindow) saveDialogWindow.close();
  }
});

// 定义一个异步保存函数
function saveData() {
  return new Promise((resolve, reject) => {
    win.webContents.send('save-data');  // 发送保存信号
    ipcMain.once('save-complete', () => {
      resolve();  // 保存完成后调用 resolve
    });

    // 如果需要，您可以设置超时来防止保存失败的情况
    setTimeout(() => {
      reject(new Error('Save operation timed out'));
    }, 5000);  // 例如，超时时间为 5 秒
  });
}

