const { app, BrowserWindow, shell, screen } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    title: 'MaAndiko Studio - Chargement',
    icon: path.join(__dirname, 'dist', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splashPathDist = path.join(__dirname, 'dist', 'splash.html');
  const splashPathPublic = path.join(__dirname, 'public', 'splash.html');

  if (fs.existsSync(splashPathDist)) {
    splashWindow.loadFile(splashPathDist);
  } else if (fs.existsSync(splashPathPublic)) {
    splashWindow.loadFile(splashPathPublic);
  }
}

function startBackend() {
  try {
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'production';
    const serverPath = path.join(__dirname, 'dist', 'server.cjs');
    console.log('Démarrage du serveur Express depuis:', serverPath);
    require(serverPath);
    console.log('✓ Serveur backend MaAndiko Studio démarré avec succès');
  } catch (err) {
    console.error('Erreur démarrage du serveur backend:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    show: false, // Caché au démarrage jusqu'à ce que le backend réponde
    title: 'MaAndiko Studio - Régie Projection',
    icon: path.join(__dirname, 'dist', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: true,
  });

  const showMainAndCloseSplash = () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  };

  mainWindow.once('ready-to-show', () => {
    // Ne pas afficher tout de suite si le serveur est encore en cours d'initialisation
  });

  const serverUrl = 'http://localhost:3000';
  let attempts = 0;
  const maxAttempts = 100;

  const checkAndLoad = () => {
    attempts++;
    http.get(serverUrl, (res) => {
      if (res.statusCode === 200 || res.statusCode === 304) {
        mainWindow.loadURL(serverUrl);
        setTimeout(showMainAndCloseSplash, 400);
      } else if (attempts < maxAttempts) {
        setTimeout(checkAndLoad, 300);
      } else {
        console.error('Serveur non réactif, chargement direct du fichier HTML...');
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
        setTimeout(showMainAndCloseSplash, 400);
      }
    }).on('error', () => {
      if (attempts < maxAttempts) {
        setTimeout(checkAndLoad, 300);
      } else {
        console.error('Impossible de contacter le serveur, chargement direct du fichier HTML...');
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
        setTimeout(showMainAndCloseSplash, 400);
      }
    });
  };

  checkAndLoad();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // If opening an internal route (like projection view)
    if (url.includes('/projection') || url.includes('localhost') || url.includes('127.0.0.1')) {
      const displays = screen.getAllDisplays();
      // Auto-detect 2nd screen/projector if available
      const targetDisplay = displays.length > 1 ? displays[1] : displays[0];
      const { x, y, width, height } = targetDisplay.bounds;

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          x,
          y,
          width,
          height,
          frame: false,               // Sans bordure ni barre de titre (Style ProPresenter / OBS)
          fullscreen: displays.length > 1, // Plein écran automatique si second écran détecté
          autoHideMenuBar: true,
          title: 'MaAndiko Studio - Écran de Projection',
          icon: path.join(__dirname, 'dist', 'icon.ico'),
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        }
      };
    }

    // Direct external links (http/https outside localhost) to system browser
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

