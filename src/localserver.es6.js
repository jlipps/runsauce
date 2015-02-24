"use strict";

var http = require('http')
  , o_O = require('monocle-js').o_O
  , o_C = require('monocle-js').o_C
  , server = null;

exports.run = function() {
  console.log(" - Starting simple web server");
  server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><body><h1>This is the server of awesomeness!</h1></body></html>');
  });
  server.listen(8000);
  return server;
};

exports.stop = o_O(function*() {
  console.log(" - Shutting down simple web server");
  var cb = o_C();
  server.close(cb);
  yield cb;
});
