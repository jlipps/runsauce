import http from 'http';
import Q from 'q';

let server = null;

export function run () {
  server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><body><h1>This is the server of awesomeness!</h1></body></html>');
  });
  server.listen(8000);
  return server;
}

export async function stop () {
  await Q.ninvoke(server, 'close');
}
