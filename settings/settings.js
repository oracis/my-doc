const $ = (selector) => {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 1) {
    return elements[0];
  }
  return elements;
};

const configArr = [
  '#savedFileLocation',
  '#accessKey',
  '#secretKey',
  '#bucketName',
];

document.addEventListener('DOMContentLoaded', () => {
  window.electron.receive('selected-config', (config) => {
    configArr.forEach((item) => {
      $(item).value = config[item.slice(1)];
    });
  });
  window.electron.send('get-settings');
  $('#select-new-location').addEventListener('click', (e) => {
    window.electron.send('select-new-location');
  });
  $('#settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const config = {};
    configArr.forEach((item) => {
      config[item.slice(1)] = $(item).value;
    });
    window.electron.send('save-settings', config);
  });

  $('.nav-tabs').addEventListener('click', (e) => {
    e.preventDefault();
    const tab = e.target;
    const tabId = tab.dataset.tab;
    $('.nav-link').forEach((item) => {
      item.classList.remove('active');
    });
    tab.classList.add('active');
    $('.config-area').forEach((item) => {
      item.style.display = 'none';
    });
    $(tabId).style.display = 'block';
  });
});
