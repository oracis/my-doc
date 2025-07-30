import { useEffect } from "react";

const useIpcRenderer = (keyCallbackMap) => {
  useEffect(() => {
    Object.keys(keyCallbackMap).forEach((key) => {
      window.electron.receive(key, keyCallbackMap[key]);
    });
  }, []);
};

export default useIpcRenderer;
