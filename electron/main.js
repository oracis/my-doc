const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const logger = require('electron-log');
const {
  writeFile,
  renameFile,
  deleteFile,
  readFile,
} = require('../src/utils/fileHelper');
const {
  fileStore,
  convertFilesToStore,
  isEnableAutoSync,
  settingsStore,
} = require('../src/utils/storeHelper');
const { v4: uuidv4 } = require('uuid');

const template = require('./menuTemplate');
const AppWindow = require('./AppWindow');
const QiniuManager = require('../src/utils/qiniuManager');

const createManager = () => {
  const { accessKey, secretKey, bucketName } = settingsStore.get('config');
  return new QiniuManager(accessKey, secretKey, bucketName);
};

const flatternArr = (arr) => {
  return arr.reduce((pre, cur) => {
    pre[cur.id] = cur;
    return pre;
  }, {});
};

let mainWindow, settingsWindow, menu;
function createWindow() {
  const mainWindowConfig = {
    width: 1440,
    height: 768,
  };

  const urlLocation = !app.isPackaged
    ? 'http://localhost:3001'
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow = new AppWindow(mainWindowConfig, urlLocation);
  mainWindow.on('closed', () => (mainWindow = null));
  menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  autoUpdater.autoDownload = false;
  logger.transports.file.level = 'debug';
  autoUpdater.logger = logger;
  autoUpdater.disableWebInstaller = false;
  autoUpdater.forceDevUpdateConfig = true;

  if (!app.isPackaged) {
    console.log('dev mode');
    // 方法1: 项目根目录创建dev-app-update.yml
    autoUpdater.updateConfigPath = path.join(
      __dirname,
      '../dev-app-update.yml'
    );
    // 方法2：
    // autoUpdater.setFeedURL('http://127.0.0.1:3000');
    autoUpdater.checkForUpdates();
  } else {
    autoUpdater.checkForUpdatesAndNotify();
  }

  autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error: ', error === null ? 'unknown' : error.stack);
  });

  autoUpdater.on('checking-for-update', () => {
    console.log('checking for update...');
  });
  autoUpdater.on('download-progress', (progress) => {
    let log_message = `Download speed: ${progress.bytesPerSecond}`;
    log_message += ` - Downloaded ${progress.percent}%`;
    log_message += ` (${progress.transferred} / ${progress.total})`;
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({
        title: '安装更新',
        message: '更新下载完毕，应用将重启并进行安装',
      })
      .then(() => {
        autoUpdater.quitAndInstall();
      });
  });

  autoUpdater.on('update-available', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: '发现新版本',
        message: '发现新版本，是否现在更新？',
        buttons: ['是', '否'],
      })
      .then(({ response }) => {
        if (response === 0) {
          console.log('download update');
          autoUpdater.downloadUpdate();
        }
      });
  });
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

ipcMain.on('open-settings-window', () => {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  const settingsWindowConfig = {
    width: 500,
    height: 400,
    parent: mainWindow,
  };
  const settingsFileLocation = `file://${path.join(
    __dirname,
    '../settings/settings.html'
  )}`;
  settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation);
  settingsWindow.on('closed', () => (settingsWindow = null));
  settingsWindow.removeMenu();
});

ipcMain.handle('read:file', async (event, id, filePath) => {
  try {
    let isDownloaded = false;
    if (isEnableAutoSync()) {
      const qiniuManager = createManager();
      const key = path.basename(filePath);
      const files = fileStore.get('files');
      const { updatedAt } = files[id];
      const { resp, data } = await qiniuManager.getFileInfo(key);
      if (resp.statusCode === 200) {
        const { putTime } = data;
        const serverUpdatedTime = Math.round(putTime / 10000);
        if (serverUpdatedTime > updatedAt || !updatedAt) {
          await qiniuManager.downloadFile(key, filePath);
          isDownloaded = true;
        }
      } else {
        console.error('文件不存在', data.error);
      }
    }
    const body = await readFile(filePath);
    return { body, isDownloaded };
  } catch (err) {
    console.error(err);
    return '';
  }
});

ipcMain.handle('write:file', async (event, filePath, fileName, data) => {
  try {
    const { savedFileLocation } = settingsStore.get('config');
    let savedLocation = savedFileLocation || app.getPath('documents');
    const writeFilePath = filePath || path.join(savedLocation, fileName);
    await writeFile(writeFilePath, data);
    if (isEnableAutoSync()) {
      const qiniuManager = createManager();
      const { resp, data } = await qiniuManager.uploadFile(
        fileName,
        writeFilePath
      );
      if (resp.statusCode === 200) {
        mainWindow.webContents.send('upload-success');
      } else {
        dialog.showErrorBox('上传失败', data.error);
      }
    }

    return writeFilePath;
  } catch (err) {
    console.error(err);

    return false;
  }
});

ipcMain.handle(
  'rename:file',
  async (event, filePath, oldFileName, newFileName) => {
    try {
      const oldFilePath = path.join(path.dirname(filePath), oldFileName);
      const newFilePath = path.join(path.dirname(filePath), newFileName);
      await renameFile(oldFilePath, newFilePath);
      return newFilePath;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
);

ipcMain.handle('delete:file', async (event, filePath) => {
  try {
    await deleteFile(filePath);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
});

function saveStore(event, files) {
  try {
    const storeObj = convertFilesToStore(files, app.getPath('documents'));
    fileStore.set('files', storeObj);
    return storeObj;
  } catch (err) {
    console.error(err);
    return false;
  }
}

ipcMain.handle('save:store', (event, files) => saveStore(event, files));

ipcMain.handle('get:store', (event) => {
  try {
    const storeObj = fileStore.get('files');
    return storeObj;
  } catch (err) {
    console.error(err);
    return {};
  }
});

ipcMain.handle('open:file', async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: '选择导入的 Markdown 文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Markdown',
          extensions: ['md', 'markdown'],
        },
        {
          name: 'All Files',
          extensions: ['*'],
        },
      ],
    });
    if (filePaths && filePaths.length > 0) {
      const storeObj = fileStore.get('files');
      const filteredPaths = filePaths.filter((filePath) => {
        const alreadyAdded = Object.values(storeObj).find(
          (item) => item.path === filePath
        );
        return !alreadyAdded;
      });

      const importFilesArr = filteredPaths.map((filePath) => {
        return {
          id: uuidv4(),
          title: path.basename(filePath, path.extname(filePath)),
          path: filePath,
          createdAt: Date.now(),
        };
      });

      const newFiles = { ...storeObj, ...flatternArr(importFilesArr) };
      if (saveStore(event, newFiles)) {
        mainWindow.webContents.send('file:opened', newFiles);
        if (importFilesArr.length > 0) {
          dialog.showMessageBox({
            type: 'info',
            title: '导入成功',
            message: `成功导入 ${importFilesArr.length} 个文件`,
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
    return null;
  }
});

ipcMain.on('open:context-menu', (event, fileId) => {
  const menu = Menu.buildFromTemplate([
    {
      label: '打开',
      click: () => {
        mainWindow.webContents.send('clickedToOpen:context-menu', fileId);
      },
    },
    { type: 'separator' },
    {
      label: '重命名',
      click: () => {
        console.log('renaming');
      },
    },
    { type: 'separator' },
    {
      label: '删除',
      click: () => {
        console.log('deleting');
      },
    },
  ]);
  menu.popup({
    window: mainWindow,
  });
});

ipcMain.on('select-new-location', async (event) => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      message: '请选择文件存储路径',
    });
    if (filePaths && filePaths.length > 0) {
      settingsWindow.webContents.send('selected-new-location', filePaths[0]);
    }
  } catch (err) {
    console.error(err);
    return null;
  }
});

ipcMain.on('save-settings', (event, config) => {
  settingsStore.set('config', config);
  settingsWindow.close();

  let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2];
  const switchItems = (toggle) => {
    qiniuMenu.submenu.items.forEach((item, index) => {
      if (index !== 0) {
        item.enabled = toggle;
      }
    });
  };
  switchItems(config.accessKey && config.secretKey && config.bucketName);
});

ipcMain.on('get-settings', (event) => {
  const config = settingsStore.get('config');
  settingsWindow.webContents.send('selected-config', config);
});

ipcMain.on('upload-all-to-qiniu', async (event) => {
  mainWindow.webContents.send('upload-start');
  try {
    const filesObj = fileStore.get('files');
    const qiniuManager = createManager();
    const filesArr = Object.values(filesObj);
    for (const file of filesArr) {
      await qiniuManager.uploadFile(
        `${file.title}${path.extname(file.path)}`,
        file.path
      );
    }
    mainWindow.webContents.send('upload-success');
  } catch (err) {
    console.error(err);
    mainWindow.webContents.send('upload-fail');
  }
});
