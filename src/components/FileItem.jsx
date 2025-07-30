import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
import useKeyPress from '../hooks/useKeyPress';

const FileItem = ({ file, onFileClick, onSaveEdit, onFileDelete }) => {
  const [editStatus, setEditStatus] = useState(false);
  const [fileTitle, setFileTitle] = useState('');
  const enterPressed = useKeyPress(13);
  const escPressed = useKeyPress(27);
  const nodeRef = useRef(null);

  const closeSearch = useCallback(() => {
    setEditStatus(false);
    setFileTitle('');
    if (file.isNew) {
      onFileDelete(file.id);
    }
  }, [file.isNew, onFileDelete, file.id]);

  const handleEditClick = useCallback(() => {
    setEditStatus(true);
    setFileTitle(file.title);
  }, [file.title]);

  useEffect(() => {
    if (file.isNew) {
      handleEditClick();
    }
  }, [file.isNew, handleEditClick]);

  useEffect(() => {
    if (editStatus) {
      nodeRef.current.focus();
    }
  }, [editStatus]);

  useEffect(() => {
    if (enterPressed && editStatus && fileTitle && fileTitle.trim() !== '') {
      onSaveEdit(file.id, fileTitle, file.isNew);
      setEditStatus(false);
      setFileTitle('');
    } else if (escPressed && editStatus) {
      closeSearch();
    }
  }, [
    escPressed,
    enterPressed,
    editStatus,
    file.id,
    onSaveEdit,
    closeSearch,
    fileTitle,
  ]);

  useEffect(() => {
    window.electron.onOpenContextMenu(async (fileId) => {
      if (fileId === file.id) {
        await onFileClick(fileId);
      }
    });
  }, [file.id, onFileClick]);

  return (
    <li
      data-id={file.id}
      data-title={file.title}
      className='list-group-item row bg-light d-flex align-items-center file-item px-0 mx-0'
    >
      {!editStatus && !file.isNew && (
        <>
          <span className='col-2'>
            <FontAwesomeIcon icon={faMarkdown} size='lg' />
          </span>
          <span
            className='col-6 c-link'
            onClick={() => {
              onFileClick(file.id);
            }}
          >
            {file.title}
          </span>
          <button
            type='button'
            className='icon-button col-2'
            onClick={handleEditClick}
          >
            <FontAwesomeIcon title='编辑' icon={faEdit} size='lg' />
          </button>
          <button
            type='button'
            className='icon-button col-2'
            onClick={() => {
              onFileDelete(file.id);
            }}
          >
            <FontAwesomeIcon title='删除' icon={faTrash} size='lg' />
          </button>
        </>
      )}

      {(editStatus || file.isNew) && (
        <>
          <input
            type='text'
            ref={nodeRef}
            className='form-control-edit
             col-10'
            value={fileTitle}
            placeholder='请输入文件名'
            onChange={(e) => {
              setFileTitle(e.target.value);
            }}
          />
          <button
            type='button'
            className='icon-button col-2'
            onClick={closeSearch}
          >
            <FontAwesomeIcon title='关闭' icon={faTimes} size='lg' />
          </button>
        </>
      )}
    </li>
  );
};

export default FileItem;
