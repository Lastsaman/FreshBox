const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('freshbox', {
  install: (ids, location) => ipcRenderer.invoke('run-winget', ids, location),
  check: ids => ipcRenderer.invoke('check-winget', ids),
  onJobStart: callback => ipcRenderer.on('job-start', (_event, data) => callback(data)),
  onJobProgress: callback => ipcRenderer.on('job-progress', (_event, data) => callback(data)),
  onJobFinished: callback => ipcRenderer.on('job-finished', (_event, data) => callback(data)),
  openSettings: uri => ipcRenderer.invoke('open-settings', uri),
  chooseLocation: () => ipcRenderer.invoke('choose-install-location'),
  confirmAction: message => ipcRenderer.invoke('confirm-action', message)
});
