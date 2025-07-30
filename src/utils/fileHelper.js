import fs from 'fs';

export const readFile = async (path, callback) => {
  try {
    const data = await fs.promises.readFile(path, { encoding: 'utf-8' });
    callback && callback(data.toString());
    return data.toString();
  } catch (err) {
    console.error(err);
  }
};

export const writeFile = async (path, data, callback) => {
  try {
    await fs.promises.writeFile(path, data, { encoding: 'utf-8' });
    callback && callback();
  } catch (err) {
    console.error(err);
  }
};

export const renameFile = async (path, newPath) => {
  try {
    await fs.promises.rename(path, newPath);
  } catch (error) {
    console.error(error);
  }
};

export const deleteFile = async (path) => {
  try {
    await fs.promises.unlink(path);
  } catch (error) {
    console.error(error);
  }
};
