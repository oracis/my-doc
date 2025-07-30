import { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import useKeyPress from '../hooks/useKeyPress';

const FileSearch = ({ title, onFileSearch }) => {
  const [inputActive, setInputActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);
  const enterPressed = useKeyPress(13);
  const escPressed = useKeyPress(27);

  const closeSearch = useCallback(() => {
    setInputActive(false);
    setInputValue('');
    onFileSearch('');
  }, [onFileSearch]);

  const handleSearch = () => {
    setInputActive(true);
  };

  useEffect(() => {
    if (enterPressed && inputActive) {
      onFileSearch(inputValue);
    } else if (escPressed && inputActive) {
      closeSearch();
    }
  }, [
    enterPressed,
    escPressed,
    inputActive,
    inputValue,
    onFileSearch,
    closeSearch,
  ]);

  useEffect(() => {
    if (inputActive) {
      inputRef.current?.focus();
    }
  }, [inputActive]);

  return (
    <div className='alert alert-primary d-flex justify-content-between align-items-center mb-0'>
      {!inputActive && (
        <>
          <span>{title}</span>
          <button type='button' className='icon-button' onClick={handleSearch}>
            <FontAwesomeIcon icon={faSearch} title='搜索' size='lg' />
          </button>
        </>
      )}
      {inputActive && (
        <>
          <input
            ref={inputRef}
            type='text'
            className='form-control-edit col-11'
            placeholder='请输入文件名'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />

          <button
            type='button'
            className='icon-button col-1'
            onClick={closeSearch}
          >
            <FontAwesomeIcon icon={faTimes} title='关闭' size='lg' />
          </button>
        </>
      )}
    </div>
  );
};

export default FileSearch;
