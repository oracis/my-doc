const { default: axios } = require('axios');
const qiniu = require('qiniu');
const fs = require('fs');

class QiniuManager {
  constructor(accessKey, secretKey, bucket) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.bucket = bucket;
    this.bucketDomain = null;
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    this.config = new qiniu.conf.Config();
    this.config.regionsProvider = qiniu.httpc.Region.fromRegionId('z0');
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }

  getBucketDomain() {
    const reqUrl = `http://uc.qiniuapi.com/v2/domains?tbl=${this.bucket}`;
    const digest = qiniu.util.generateAccessToken(this.mac, reqUrl);
    return new Promise((resolve, reject) => {
      qiniu.rpc
        .postWithoutForm(reqUrl, digest)
        .then((res) => {
          const bucketDomain = 'http://' + res?.data?.[0];
          resolve(bucketDomain);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  uploadFile(key, localFile) {
    const options = {
      scope: this.bucket + ':' + key,
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(this.mac);
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();
    return formUploader.putFile(uploadToken, key, localFile, putExtra);
  }

  deleteFile(key) {
    return this.bucketManager.delete(this.bucket, key);
  }

  async genereateDownloadLink(key) {
    const deadline = parseInt(Date.now() / 1000) + 3600; // 1小时过期
    if (!this.bucketDomain) {
      const bucketDomain = await this.getBucketDomain();
      this.bucketDomain = bucketDomain;
    }
    const privateDownloadUrl = this.bucketManager.privateDownloadUrl(
      this.bucketDomain,
      key,
      deadline
    );
    return privateDownloadUrl;
  }

  async downloadFile(key, downloadPath) {
    const downloadUrl = await this.genereateDownloadLink(key);
    const res = await axios({
      url: `${downloadUrl}?timestamp=${Date.now()}`,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'Cache-Control': `no-cache`,
      },
    });
    if (res.status === 200) {
      const writer = fs.createWriteStream(downloadPath);
      res.data.pipe(writer);
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } else {
      return Promise.reject({ err: res.data });
    }
  }

  getFileInfo(key) {
    return this.bucketManager.stat(this.bucket, key);
  }
}

module.exports = QiniuManager;
