export const flatternArr = (arr) => {
  return arr.reduce((pre, cur) => {
    pre[cur.id] = cur;
    return pre;
  }, {});
};

export const objToArr = (obj) => {
  return Object.keys(obj).map((key) => obj[key]);
};

export const getParentNode = (node, parentClassName) => {
  let parent = node;
  while (parent) {
    if (parent.classList.contains(parentClassName)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
};

export const convertTimestampToDate = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
