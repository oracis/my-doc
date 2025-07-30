import TabItem from './TabItem';
import './TabList.scss';

const TabList = ({ files, activeId, unsaveIds, onTabClick, onTabClose }) => {
  const isActive = (id) => {
    return id === activeId;
  };
  const withUnsavedMark = (id) => {
    return unsaveIds.includes(id);
  };
  const handleTabClick = (e, id) => {
    e.preventDefault();
    onTabClick(id);
  };

  const handleCloseTab = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    onTabClose(id);
  };
  return (
    <ul className='nav nav-pills tablist-component'>
      {files.map((file) => (
        <TabItem
          key={file.id}
          file={file}
          isActive={isActive}
          withUnsavedMark={withUnsavedMark}
          handleTabClick={handleTabClick}
          handleCloseTab={handleCloseTab}
        />
      ))}
    </ul>
  );
};

export default TabList;
