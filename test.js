const qiniu = require('qiniu');
const QiniuManager = require('./src/utils/qiniuManager');
const path = require('path');

const accessKey = 'fYLxHsLAfzsMLf7nSkxje42OSmQbYlixDqg05R-3';
const secretKey = 'brT4EcD-Idw-PEIDTqW7T-vCpOtIGyRiBh7jBj74';

const localFile = 'd:/md/qiniu.md';
const key = 'qiniu.md';
const bucket = 'cloudwendang';
const privateBucketDomain = 'szzj6wr21.hd-bkt.clouddn.com';
// const deadline = parseInt(Date.now() / 1000) + 3600; // 1小时过期
// const privateDownloadUrl = bucketManager.privateDownloadUrl(
//   privateBucketDomain,
//   key,
//   deadline
// );

const qiniuManager = new QiniuManager(
  accessKey,
  secretKey,
  bucket,
  privateBucketDomain
);
// const downloadPath = path.join(__dirname, key);
// qiniuManager
//   .downloadFile(key, downloadPath)
//   .then(
//     () => {
//       console.log('download success');
//     },
//     (err) => {
//       console.log('download error', err.message);
//     }
//   )
//   .catch((err) => {
//     console.log('download error', err.message);
//   });

// qiniuManager.getBucketDomain().then((res) => {
//   console.log(res?.[0]);
// })

// qiniuManager.genereateDownloadLink(key).then((res) => {
//   console.log(res);
//   qiniuManager.genereateDownloadLink('music.mp3').then((res) => {
//     console.log(res);
//   });
// });

// console.log(privateDownloadUrl);
// const qiniuManager = new QiniuManager(
//   accessKey,
//   secretKey,
//   bucket,
//   privateBucketDomain
// );

// // 上传文件
qiniuManager
  .uploadFile(key, localFile)
  .then(({ data, resp }) => {
    if (resp.statusCode === 200) {
      console.log(data);
      console.log('上传成功');
    } else {
      console.log(resp.statusCode);
      console.log(data);
    }
  })
  .catch((err) => {
    console.log(err);
  });

// 删除文件
// qiniuManager
//   .deleteFile(key)
//   .then(({ data, resp }) => {
//     if (resp.statusCode === 200) {
//       console.log(data);
//     } else {
//       console.log(resp.statusCode);
//       console.log(data);
//     }
//   })
//   .catch((err) => {
//     console.log('failed', err);
//   });
