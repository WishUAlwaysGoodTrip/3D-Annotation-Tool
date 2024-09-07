import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取文件路径和目录名
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

app.whenReady().then(createWindow);

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
