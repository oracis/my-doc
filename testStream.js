const fs = require('fs');
const { Transform } = require('stream');
const zlib = require('zlib');
const reader = fs.createReadStream('./test.js');
// reader.pipe(process.stdout);

const writer = fs.createWriteStream('./test.gz');
reader.pipe(zlib.createGzip()).pipe(writer);
