import { app, BrowserWindow, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 检查是否在开发模式
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // 使用 Vite 开发服务器的 URL
    const port = 5173; // 确保这个端口与 vite.config.js 中的配置一致
    win.loadURL(`http://localhost:${port}/`);
  } else {
    // 生产模式下加载构建后的文件
    win.loadFile(join(__dirname, 'dist', 'index.html'));
  }
}

// 创建自定义菜单
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Project', click() { console.log('New Project'); } },
        { label: 'Open Folder', click() { console.log('Open Folder'); } },
        { label: 'Open File', click() { console.log('Open File'); } },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click() { console.log('Save'); } },
        { label: 'Save As…', click() { console.log('Save As…'); } },
        { label: 'Open Recent', click() { console.log('Open Recent'); } },
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
        { label: 'Configure Hotkeys…', click() { console.log('Configure Hotkeys…'); } },
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

  // 创建菜单对象
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu); // 设置应用的菜单
}

app.whenReady().then(() => {
  createWindow();
  createMenu(); // 创建并设置菜单
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
