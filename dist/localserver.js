"use strict";

var http = require("http"),
    o_O = require("monocle-js").o_O,
    o_C = require("monocle-js").o_C,
    server = null;

exports.run = function () {
  console.log(" - Starting simple web server");
  server = http.createServer(function (req, res) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<html><body><h1>This is the server of awesomeness!</h1></body></html>");
  });
  server.listen(8000);
  return server;
};

exports.stop = o_O(regeneratorRuntime.mark(function callee$0$0() {
  var cb;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        console.log(" - Shutting down simple web server");
        cb = o_C();

        server.close(cb);
        context$1$0.next = 5;
        return cb;

      case 5:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));