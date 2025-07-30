const fs = require('fs');
const server = require('http').createServer();

server.on('request', (req, res) => {
  const src = fs.createReadStream('./test.html');
  src.pipe(res);
  src.on('end', () => {
    res.end();
  });
  src.on('error', (err) => {
    res.end(err.message);
  })
});

server.listen(3000, () => {
  console.log('server is running at http://localhost:3000');
});
