const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  getHardwareId: () => ipcRenderer.invoke('get-hardware-id'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  onUpdateResult: (callback) => ipcRenderer.on('update-result', (_, data) => callback(data)),
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  storage: {
    save: (key, data) => ipcRenderer.sendSync('fs-save', key, data),
    load: (key) => ipcRenderer.sendSync('fs-load', key),
  },
});
