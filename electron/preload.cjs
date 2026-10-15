/**
 * Preload script de Electron para FIESTA MIX
 * Expone APIs seguras a la ventana del navegador.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  onSelectedDirectory: (callback) => ipcRenderer.on('selected-directory', (_event, value) => callback(value)),
  onShortcut: (channel, callback) => ipcRenderer.on(channel, (_event, ...args) => callback(...args)),
});
