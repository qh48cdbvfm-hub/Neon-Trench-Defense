const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let serverProcess;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Failed to load URL');
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 2000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  console.log('Starting server...');
  console.log('App path:', app.getAppPath());
  console.log('Current directory:', __dirname);
  
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'server.js')
    : path.join(__dirname, 'server.js');
  console.log('Server path:', serverPath);
  console.log('Server exists:', fs.existsSync(serverPath));

  // Start the server
  serverProcess = spawn('node', [serverPath], {
    cwd: path.dirname(serverPath),
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  if (serverProcess.stdout) {
    serverProcess.stdout.on('data', (data) => {
      console.log(`[SERVER] ${data}`);
    });
  }

  if (serverProcess.stderr) {
    serverProcess.stderr.on('data', (data) => {
      console.error(`[SERVER ERROR] ${data}`);
    });
  }

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
  });
}

app.whenReady().then(() => {
  startServer();

  // Wait longer for server to start
  setTimeout(() => {
    console.log('Creating window...');
    createWindow();
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});