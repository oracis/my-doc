import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';

const TabItem = ({
  file,
  isActive,
  withUnsavedMark,
  handleTabClick,
  handleCloseTab,
}) => {
  return (
    <li key={file.id} className='nav-item d-flex align-items-center'>
      <a
        href='#'
        className={clsx('nav-link', {
          active: isActive(file.id),
          withUnsaved: withUnsavedMark(file.id),
        })}
        onClick={(e) => handleTabClick(e, file.id)}
      >
        {file.title}
        <FontAwesomeIcon
          icon={faTimes}
          className='ml-2 close-icon'
          onClick={(e) => {
            handleCloseTab(e, file.id);
          }}
        />
        {withUnsavedMark(file.id) && (
          <span className='ml-2 rounded-circle unsaved-icon'></span>
        )}
      </a>
    </li>
  );
};

export default TabItem;
