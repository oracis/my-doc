import useContentMenu from '../hooks/useContentMenu';
import FileItem from './FileItem';

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
  useContentMenu('.file-list', [files]);
  return (
    <ul className='list-group list-group-flush file-list'>
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          onFileClick={onFileClick}
          onSaveEdit={onSaveEdit}
          onFileDelete={onFileDelete}
        />
      ))}
    </ul>
  );
};

export default FileList;
