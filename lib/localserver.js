"use strict";

var http = require('http');

exports.run = function() {
  var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><body><h1>This is the server of awesomeness!</h1></body></html>');
  });
  server.listen(8000);
  return server;
};
