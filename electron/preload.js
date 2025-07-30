const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electron', {
  readFile: (id, filePath) => {
    return ipcRenderer.invoke('read:file', id, filePath);
  },
  writeFile: (filePath, fileName, data) => {
    ipcRenderer.removeAllListeners('write:file');
    return ipcRenderer.invoke('write:file', filePath, fileName, data);
  },
  renameFile: (filePath, oldFileName, newFileName) => {
    return ipcRenderer.invoke(
      'rename:file',
      filePath,
      oldFileName,
      newFileName
    );
  },
  deleteFile: (filePath) => {
    return ipcRenderer.invoke('delete:file', filePath);
  },
  saveStore: (files) => {
    return ipcRenderer.invoke('save:store', files);
  },
  getStore: () => {
    return ipcRenderer.invoke('get:store');
  },
  openFile: () => {
    return ipcRenderer.invoke('open:file');
  },
  onFileOpened: (callback) =>
    ipcRenderer.on('file:opened', (event, data) => callback(data)),
  openContextMenu: (fileId) => {
    ipcRenderer.send('open:context-menu', fileId);
  },
  onOpenContextMenu: (callback) => {
    ipcRenderer.on('clickedToOpen:context-menu', (event, data) => {
      callback(data);
    });
  },
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.removeAllListeners(channel);
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});
