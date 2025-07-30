import { useEffect } from 'react';
import { getParentNode } from '../utils/helper';

const useContentMenu = (targetSelector, deps) => {
  const onContextMenu = (e) => {
    if (document.querySelector(targetSelector).contains(e.target)) {
      const parent = getParentNode(e.target, 'file-item');
      const fileId = parent.dataset.id;
      window.electron.openContextMenu(fileId);
    } else {
      e.preventDefault();
    }
  };

  useEffect(() => {
    window.addEventListener('contextmenu', onContextMenu);
    return () => {
      window.removeEventListener('contextmenu', onContextMenu);
    };
  });
};

export default useContentMenu;
