const http = require('http');
const B = require('bluebird');

let server = null;

function run () {
  server = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><body><h1>This is the server of awesomeness!</h1></body></html>');
  });
  server.listen(8000);
  return server;
}

async function stop () {
  await B.promisify(server.close, {context: server})();
}

module.exports = { run, stop };
