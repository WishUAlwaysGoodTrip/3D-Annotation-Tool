import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import process from 'process'



function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
/*
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
  win.loadURL(format({
  pathname: join(__dirname, 'index.html'),
  protocol: 'file:',
  slashes: true
  }))


  const port = process.env.VITE_PORT;
  win.loadURL(`http://localhost:${port}/`);
*/
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  win.loadFile(join(__dirname, 'dist', 'index.html'))
  
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})