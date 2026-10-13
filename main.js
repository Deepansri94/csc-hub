const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

let mainWindow = null;
let serverProcess = null;

const RELEASES_API = 'https://api.github.com/repos/Deepansri94/csc-hub/releases/latest';

function send(event, payload) {
  if (mainWindow) mainWindow.webContents.send(event, payload);
}

function startBackendServer() {
  const serverPath = path.join(__dirname, 'server.js');
  if (!fs.existsSync(serverPath)) {
    return;
  }
  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, PORT: '3001' },
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start backend server:', err);
  });
}

function httpsGet(url, headers, callback) {
  const opts = new URL(url);
  const reqOpts = {
    hostname: opts.hostname,
    path: opts.pathname + opts.search,
    headers,
  };
  const req = https.get(reqOpts, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return httpsGet(res.headers.location, {}, callback);
    }
    callback(null, res);
  });
  req.on('error', (err) => callback(err));
  req.end();
}

function checkForUpdate(manual = false) {
  httpsGet(RELEASES_API, {
    'User-Agent': 'CSCKiosk-App',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }, (err, res) => {
    if (err) {
      if (manual) send('update-result', { status: 'error' });
      return;
    }
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        const tag = release.tag_name || '';
        if (!tag.includes('build') && !tag.includes('v')) {
          if (manual) send('update-result', { status: 'up-to-date' });
          return;
        }
        
        const remoteVersion = tag.replace('v', '').replace('build-', '');
        const localVersion = app.getVersion();

        // Prompt user
        const asset = (release.assets || []).find(a => a.name.endsWith('.exe') || a.name.endsWith('.dmg') || a.name.endsWith('.AppImage'));
        
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Available',
          message: `CSC Kiosk ${release.name || tag} is available!`,
          detail: 'Would you like to download the installer to your Downloads folder and update?',
          buttons: ['Download & Install', 'Later'],
          defaultId: 0,
          cancelId: 1,
        }).then(({ response }) => {
          if (response === 0 && asset) {
            downloadAndOpen(asset.browser_download_url, manual);
          } else if (manual) {
            send('update-result', { status: 'cancelled' });
          }
        });

        if (manual) send('update-result', { status: 'available', version: release.name || tag });
      } catch {
        if (manual) send('update-result', { status: 'error' });
      }
    });
  });
}

function downloadAndOpen(url, manual) {
  if (manual) send('update-result', { status: 'downloading' });
  const dest = path.join(os.homedir(), 'Downloads', 'CSCKiosk-Setup.exe');
  const file = fs.createWriteStream(dest);
  httpsGet(url, { 'User-Agent': 'CSCKiosk-App', 'Accept': 'application/octet-stream' }, (err, res) => {
    if (err) {
      file.close();
      if (manual) send('update-result', { status: 'error' });
      return;
    }
    res.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        if (manual) send('update-result', { status: 'done' });
        shell.openPath(dest);
      });
    });
    file.on('error', () => {
      fs.unlink(dest, () => {});
      if (manual) send('update-result', { status: 'error' });
    });
  });
}

function getHardwareId() {
  const cpus = os.cpus();
  const cpuModel = cpus && cpus[0] ? cpus[0].model : 'CPU';
  const hostname = os.hostname();
  const homeDir = os.homedir();
  const platform = os.platform();
  const raw = `${hostname}-${cpuModel}-${homeDir}-${platform}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 12).toUpperCase();
  return `HWID-${hash.substring(0, 4)}-${hash.substring(4, 8)}-${hash.substring(8, 12)}`;
}

ipcMain.handle('check-update', () => checkForUpdate(true));
ipcMain.handle('get-hardware-id', () => getHardwareId());

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    title: 'CSC e-Sevai & Xerox Kiosk Hub',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'public/pwa-512x512.png'),
  });

  mainWindow.setMenuBarVisibility(false);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.removeMenu();
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const dataDir = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

  ipcMain.on('fs-save', (event, key, data) => {
    fs.writeFileSync(path.join(dataDir, `${key}.json`), data);
    event.returnValue = true;
  });

  ipcMain.on('fs-load', (event, key) => {
    const filePath = path.join(dataDir, `${key}.json`);
    event.returnValue = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  });

  startBackendServer();
  setTimeout(createWindow, 1500);

  // Check for updates after 5 seconds on startup
  setTimeout(() => checkForUpdate(false), 5000);

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
