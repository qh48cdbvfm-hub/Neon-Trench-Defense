const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let serverProcess;

function createWindow() {
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

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

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
  console.log('Starting dev server...');

  const serverPath = path.join(__dirname, 'dev-server.js');

  serverProcess = spawn('node', [serverPath], {
    cwd: __dirname,
    stdio: 'pipe',
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
}

app.whenReady().then(() => {
  startServer();

  // Wait for server to start
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
