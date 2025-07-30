const { BrowserWindow } = require('electron');
const path = require('path');

class AppWindow extends BrowserWindow {
  constructor(config, urlLocation) {
    const basicConfig = {
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
      },
      show: false,
      backgroundColor: '#efefef',
    };

    super({
      ...basicConfig,
      ...config,
    });
    this.loadURL(urlLocation);
    this.once('ready-to-show', () => {
      this.show();
    });
  }
}

module.exports = AppWindow;
