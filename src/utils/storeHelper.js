import Store from 'electron-store';
import path from 'path';
export const fileStore = new Store({
  name: 'Files Data',
});

export const settingsStore = new Store({ name: 'Settings' });

const objToArr = (obj) => {
  return Object.keys(obj).map((key) => obj[key]);
};

export const convertFilesToStore = (files, baseFilePath) => {
  const filesStoreObj = objToArr(files).reduce((result, cur) => {
    const { id, title, createdAt, path: filePath, isSynced, updatedAt } = cur;
    result[id] = {
      id,
      title,
      path: filePath || path.join(baseFilePath, `${title}.md`),
      createdAt,
      isSynced,
      updatedAt,
    };
    return result;
  }, {});
  return filesStoreObj;
};

export const isEnableAutoSync = () => {
  const { accessKey, secretKey, bucketName } = settingsStore.get('config');
  const enableAutoSync = settingsStore.get('enableAutoSync');
  return enableAutoSync && accessKey && secretKey && bucketName;
};
