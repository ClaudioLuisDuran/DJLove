/**
 * Proceso principal de Electron para FIESTA MIX
 * Permite ejecutar la consola de DJ como aplicación de escritorio nativa para Windows,
 * 100% offline, con soporte para baja latencia de audio y acceso a archivos locales.
 */

const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 680,
    title: 'DJLove — Consola de DJ Offline',
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
      // Habilitar acceso a audio y baja latencia
      backgroundThrottling: false, // Evita que el audio se corte si la ventana pierde el foco en la fiesta
    },
  });

  // En producción carga el archivo index.html compilado por Vite
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Menú nativo en español
  const menuTemplate = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Cargar Carpeta de Música...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Seleccionar carpeta con canciones',
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('selected-directory', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' },
      ],
    },
    {
      label: 'Control DJ',
      submenu: [
        {
          label: 'Play / Pausa Deck Activo',
          accelerator: 'Space',
          click: () => mainWindow.webContents.send('shortcut-play-pause'),
        },
        {
          label: 'Sincronizar (SYNC)',
          accelerator: 'S',
          click: () => mainWindow.webContents.send('shortcut-sync'),
        },
        {
          label: 'Mezclar Ahora (MIX NOW)',
          accelerator: 'M',
          click: () => mainWindow.webContents.send('shortcut-mix-now'),
        },
        {
          label: 'Fin Suave (Fade Out)',
          accelerator: 'F',
          click: () => mainWindow.webContents.send('shortcut-smooth-end'),
        },
        { type: 'separator' },
        {
          label: 'Silencio de Emergencia',
          accelerator: 'Escape',
          click: () => mainWindow.webContents.send('shortcut-emergency'),
        },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Pantalla Completa', role: 'togglefullscreen' },
        { label: 'Recargar', role: 'reload' },
        { type: 'separator' },
        { label: 'Herramientas de Desarrollador', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de DJLove',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de DJLove',
              message: 'DJLove v1.0.0\nAplicación de DJ de escritorio, offline y para fiestas.\nDesarrollada para notebooks con Web Audio API y Electron.',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicialización de la aplicación
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
