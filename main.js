import { app, BrowserWindow, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { ipcMain ,dialog} from 'electron';  
import fs from 'fs';
import path from 'path';
import Store from 'electron-store'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let win;
let hotkeysWindow; 
let latestFolderPath = '';  
let saveDialogWindow;
let aboutWindow;  

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

  // Main window closing logic
  win.on('close', (event) => {
    event.preventDefault(); 
    createSaveDialog(); 
  });
  
}

function loadDefaultFile() {
  const defaultFilePath = path.join(__dirname, 'public', 'datasettest', 'upper_default.stl');

  //Check if the file exists
  if (fs.existsSync(defaultFilePath)) {
    const fileData = fs.readFileSync(defaultFilePath);
    const fileBase64 = fileData.toString('base64');

  //Send the file to the rendering process
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
    modal: true, 
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
    }, 200);
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
//     modal: true, 
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
//       }, 200); 
//     });
//   } else {
//     saveDialogWindow.loadFile(join(__dirname, 'dist', 'save-dialog.html')).then(() => {
//       setTimeout(() => {
//         saveDialogWindow.show();
//       }, 200); 
//     });
//   }
//   saveDialogWindow.on('closed', () => {
//     saveDialogWindow = null;
//   });
// }
function createAboutWindow() {
//If the window already exists, there is no need to recreate it
  if (aboutWindow) {
    aboutWindow.focus(); 
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 700,
    height: 600,
    modal: true, 
    parent: win,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true, 
  });

  aboutWindow.setMenuBarVisibility(false);

  //  Load HTML or URL page
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const port = 5173;
    aboutWindow.loadURL(`http://localhost:${port}/help.html`);  //  Loading the help page in development mode
  } else {
    aboutWindow.loadFile(join(__dirname, 'dist', 'help.html'));  // Load packaged HTML files in production mode
  }

  // Monitor window closure event
  aboutWindow.on('closed', () => {
    aboutWindow = null;
  });
}



function createHotkeysWindow() {
  if (hotkeysWindow) {
    hotkeysWindow.focus();  
    return;
  }

  hotkeysWindow = new BrowserWindow({
    width: 500,
    height: 500,
    modal: true,  
    parent: win,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true, 
  });

  hotkeysWindow.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    const port = 5173;
    hotkeysWindow.loadURL(`http://localhost:${port}/hotkeys.html`);  
  } else {
    hotkeysWindow.loadFile(join(__dirname, 'dist', 'hotkeys.html')); 
  }

  hotkeysWindow.on('closed', () => {
    hotkeysWindow = null;
  });
}

function getRecentFilesSubmenu() {
  const recentFiles = store.get('recentFiles') || [];

  //  Filter out invalid file paths
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
            properties: ['openDirectory'], 
            }).then(result => {
              if (!result.canceled) {
                const folderPath = result.filePaths[0];
                latestFolderPath = folderPath;  
                const jsonFiles = getJsonFiles();
              // Recursive function used to traverse. stl files in a folder and its subfolders
                function getAllStlFiles(dirPath) {
                  let stlFiles = [];
                  const files = fs.readdirSync(dirPath);

                  files.forEach(file => {
                    const filePath = path.join(dirPath, file);
                    const stat = fs.statSync(filePath);

                    if (stat.isDirectory()) {
                    //If it is a folder, recursively call the function
                      stlFiles = stlFiles.concat(getAllStlFiles(filePath));
                    } else if (file.endsWith('.stl')) {
                    //If it is an. stl file, add it to the file list
                    const fileData = fs.readFileSync(filePath);  //Synchronize reading of file data
                    const fileBase64 = fileData.toString('base64');  //Convert to base64
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

             //Retrieve all. stl files in the folder
                const stlFiles = getAllStlFiles(folderPath);
                const matchingFiles = stlFiles.filter(stlFile => {
                  const stlBaseName = path.basename(stlFile.name, '.stl');
                  return jsonFiles.includes(stlBaseName);  //If there is a. json file with the same name, return true
                });
              //If the. stl file is found, send the file list to the rendering process
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
                { name: 'STL Files', extensions: ['stl'] }  // Only allow selection of STL files
              ]
            }).then(result => {
              if (!result.canceled) {
                const filePath = result.filePaths[0];
                const fileData = fs.readFileSync(filePath); 
                const fileBase64 = fileData.toString('base64'); 
                const fileObject = {
                  name: path.basename(filePath),
                  path: filePath,
                  data: fileBase64,  
                  size: fs.statSync(filePath).size
                 }; 
                 // Send file objects to the rendering process
                win.webContents.send('file-selected', fileObject);
                updateRecentFiles(filePath); // Update recent files
              }
            }).catch(err => {
              console.log('Error:', err);
            });}
        },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click() { win.webContents.send('save-data'); } },
        { label: 'Save As…', click() { console.log('Save As…'); } },
        { label: 'Open Recent',
          submenu: getRecentFilesSubmenu() // Dynamically retrieve the latest file submenu
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
        { label: 'About', click() { createAboutWindow(); } }
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

    // Check if it is a folder, if so, recursively search for subfolders
    if (stat.isDirectory()) {
      const result = findFileRecursive(filePath, fileName);
      if (result) {
        return result; // Find the file and return the file path
      }
    } else if (files[i] === fileName) {
      return filePath;
    }
  }
  return null; // file not found
}

function updateRecentFiles(filePath) {
  let recentFiles = store.get('recentFiles') || [];
  console.log('Updating recent files with:', filePath); 
  // If the file already exists, remove it
  recentFiles = recentFiles.filter(file => file !== filePath);

  // Add the file to the top of the list
  recentFiles.unshift(filePath);

  // If the length of the list exceeds 10, remove the oldest file
  if (recentFiles.length > 10) {
    recentFiles.pop(); 
  }

  //  Update recent file storage
  store.set('recentFiles', recentFiles);
  createMenu(); 
}

//Retrieve all. json files from the public/dataset
function getJsonFiles() {
  const datasetPath = path.join(__dirname, 'public', 'datasettest');
  const jsonFiles = fs.readdirSync(datasetPath)
    .filter(file => file.endsWith('.json'))  
    .map(file => path.basename(file, '.json')); 
  return jsonFiles;
}

app.whenReady().then(() => {
  createWindow();
  createMenu();  
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
  console.log('File clicked:', fileName);

  // Use the latest saved folder path to find files
  const filePath = findFileRecursive(latestFolderPath, fileName);
  console.log('FilePath clicked:', filePath); 

  if (fs.existsSync(filePath)) {
    // Update recent file list
    updateRecentFiles(filePath);  // Add file path to recent file list
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
      await saveData();  // Ensure that saveData() is an asynchronous operation and returns a Promise
      if (saveDialogWindow) saveDialogWindow.close();
      win.destroy(); 
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

// Define an asynchronous save function
function saveData() {
  return new Promise((resolve, reject) => {
    win.webContents.send('save-data'); 
    ipcMain.once('save-complete', () => {
      resolve();  // Call resolve after saving
    });

    // Set timeout to prevent save failures
    setTimeout(() => {
      reject(new Error('Save operation timed out'));
    }, 5000); 
  });
}

