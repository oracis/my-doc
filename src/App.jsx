import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import './App.css';
import BottomBtn from './components/BottomBtn';
import {
  faFileImport,
  faPlus,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import TabList from './components/TabList';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { objToArr, convertTimestampToDate } from './utils/helper';
import useIpcRenderer from './hooks/useIpcRenderer';
import Loader from './components/Loader';
let storeFiles = {};

async function getStoreFiles() {
  storeFiles = await window.electron.getStore();
}

getStoreFiles();

function App() {
  const [files, setFiles] = useState(storeFiles);
  const [searchedFiles, setSearchedFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState('');
  const [openedFileIds, setOpenedFileIds] = useState([]);
  const [unsavedFileIds, setUnsavedFileIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const filesArr = objToArr(files);

  const openedFiles = openedFileIds.map((id) => {
    return files[id];
  });

  const fileList = searchedFiles.length ? searchedFiles : filesArr;

  const activeFile = files[activeFileId];

  const handleFileSearch = (value) => {
    const newFiles = filesArr.filter((file) => file.title.includes(value));
    setSearchedFiles(newFiles);
  };

  const handleFileClick = async (fileId) => {
    setActiveFileId(fileId);
    const currentFile = files[fileId];
    if (!currentFile.isLoaded) {
      const { body, isDownloaded } = await window.electron.readFile(
        fileId,
        currentFile.path
      );
      const newFile = {
        [fileId]: {
          ...currentFile,
          body,
          isLoaded: true,
        },
      };
      if (isDownloaded) {
        newFile[fileId].isSynced = true;
        newFile[fileId].updatedAt = Date.now();
      }
      const newFiles = {
        ...files,
        ...newFile,
      };
      setFiles(newFiles);
      if (isDownloaded) {
        window.electron.saveStore(newFiles);
      }
    }
    if (!openedFileIds.includes(fileId)) {
      setOpenedFileIds([...openedFileIds, fileId]);
    }
  };

  const handleFileDelete = async (fileId) => {
    if (files[fileId]?.isNew) {
      delete files[fileId];
      setFiles({ ...files });
    } else {
      const res = await window.electron.deleteFile(`${files[fileId].path}`);
      if (res) {
        delete files[fileId];
        setFiles({ ...files });
        window.electron.saveStore(files);
        handleTabClose(fileId);
      }
    }
  };

  const handleFileCreate = () => {
    const time = Date.now();
    const newFile = {
      id: uuidv4(),
      title: '',
      content: '## 请输入 Markdown',
      createdAt: time,
      isNew: true,
    };
    setFiles({
      ...files,
      [newFile.id]: newFile,
    });
  };

  const handleTabClick = (fileId) => {
    setActiveFileId(fileId);
  };

  const handleTabClose = (fileId) => {
    const openedIds = openedFileIds.filter((id) => id !== fileId);
    setUnsavedFileIds(unsavedFileIds.filter((id) => id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(openedIds.length ? openedIds[0] : '');
    }
    setOpenedFileIds(openedIds);
  };

  const handleFileNameChange = async (payload) => {
    const { id: fileId, title, isNew } = payload;
    const modifiedFile = { ...files[fileId], ...payload, isNew: false };
    const newFiles = {
      ...files,
      [fileId]: modifiedFile,
    };
    if (isNew) {
      const result = await window.electron.writeFile(
        '',
        `${title}.md`,
        modifiedFile.body || ''
      );
      if (result) {
        modifiedFile.path = result;
        const newStoreFiles = await window.electron.saveStore(newFiles);
        setFiles(newStoreFiles);
      }
    } else {
      const result = await window.electron.renameFile(
        files[fileId].path,
        `${files[fileId].title}.md`,
        `${title}.md`
      );
      if (result) {
        modifiedFile.path = result;
        setFiles(newFiles);
        window.electron.saveStore(newFiles);
      }
    }
  };

  const handleFileContentChange = (payload) => {
    if (payload.body !== files[activeFileId].body) {
      const modifiedFile = { ...files[activeFileId], ...payload };
      const newFiles = { ...files, [activeFileId]: modifiedFile };
      setFiles(newFiles);

      if (!unsavedFileIds.includes(activeFileId)) {
        setUnsavedFileIds([...unsavedFileIds, activeFileId]);
      }
    }
  };

  const handleFileImport = async () => {
    const res = await window.electron.openFile();
    if (res) {
      console.log(res);
    }
  };

  const saveCurrentFile = useCallback(async () => {
    const res = await window.electron.writeFile(
      activeFile.path,
      `${activeFile.title}.md`,
      activeFile.body || ''
    );
    if (res) {
      setUnsavedFileIds(unsavedFileIds.filter((id) => id !== activeFileId));
    }
  }, [activeFile, activeFileId, unsavedFileIds]);

  const handleUploadSuccess = useCallback(() => {
    const newFiles = {
      ...files,
      [activeFileId]: {
        ...files[activeFileId],
        isSynced: true,
        updatedAt: Date.now(),
      },
    };
    setFiles(newFiles);
    window.electron.saveStore(newFiles);
  }, [activeFileId, files]);

  useEffect(() => {
    window.electron.onFileOpened((newFiles) => {
      setFiles(newFiles);
    });
  }, []);

  useEffect(() => {
    window.electron.receive('save-edit-file', saveCurrentFile);
  }, [saveCurrentFile]);

  useEffect(() => {
    window.electron.receive('upload-success', handleUploadSuccess);
  }, [handleUploadSuccess]);

  const handleUploadStart = useCallback(() => {
    console.log('upload-start');
    setIsLoading(true);
  }, []);

  const handleUploadFail = useCallback(() => {
    setIsLoading(false);
  }, []);

  useIpcRenderer({
    'create-new-file': handleFileCreate,
    'search-file': handleFileSearch,
    'import-file': handleFileImport,
    'upload-start': handleUploadStart,
    'upload-success': handleUploadFail,
    'upload-fail': handleUploadFail,
  });

  return (
    <div className='container-fluid px-0'>
      <Loader isLoading={isLoading} />
      <div className='row no-gutters'>
        <div className='col-3 bg-light left-panel'>
          <FileSearch
            title={'我的云文档'}
            onFileSearch={(value) => {
              handleFileSearch(value);
            }}
          />
          <FileList
            files={fileList}
            onFileClick={handleFileClick}
            onSaveEdit={(id, title, isNew) => {
              handleFileNameChange({ id, title, isNew });
            }}
            onFileDelete={handleFileDelete}
          />
          <div className='row no-gutters btn-group'>
            <div className='col'>
              <BottomBtn
                text='新建'
                colorClass='btn-primary'
                icon={faPlus}
                onBtnClick={(e) => handleFileCreate(e)}
              />
            </div>
            <div className='col'>
              <BottomBtn
                text='导入'
                colorClass='btn-success'
                icon={faFileImport}
                onBtnClick={() => {
                  handleFileImport();
                }}
              />
            </div>
          </div>
        </div>
        <div className='col-9 right-panel'>
          {!activeFileId && (
            <div className='start-page'>
              <h1>选择或创建新的 Markdown 文档</h1>
            </div>
          )}
          {activeFileId && (
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileId}
                unsaveIds={unsavedFileIds}
                onTabClick={handleTabClick}
                onTabClose={handleTabClose}
              />
              <SimpleMDE
                key={activeFileId}
                options={{ minHeight: '515px', autofocus: true }}
                value={activeFile?.body || ''}
                onChange={(value) => handleFileContentChange({ body: value })}
              />
              {activeFile.isSynced && (
                <span className='text-success sync-status'>
                  已同步, 上次同步时间
                  {convertTimestampToDate(activeFile.updatedAt)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
