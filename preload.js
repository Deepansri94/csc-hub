const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  getHardwareId: () => ipcRenderer.invoke('get-hardware-id'),
  onUpdateResult: (callback) => ipcRenderer.on('update-result', (_, data) => callback(data)),
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
