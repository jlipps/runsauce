"use strict";

var tests = {}
  , monocle = require('monocle-js')
  , os = require('os')
  , o_O = monocle.o_O
  , localServer = require('./localserver.js')
  , should = require('should')
  , o_C = monocle.o_C;

tests.webTest = o_O(function*(driver, caps) {
  console.log(" - Running minimal web test");
  caps.name = "Minimal web test";
  yield driver.init(caps);
  yield driver.get("http://whatismyip.org");
  (yield driver.title()).should.include("What");
});

var localTest = o_O(function*(driver, caps, url) {
  console.log(" - Starting simple web server");
  var server = localServer.run();
  console.log(" - Running minimal web test + sauce connect");
  caps.name = "Minimal web test + connect";
  yield driver.init(caps);
  yield driver.get(url);
  var h1 = yield driver.elementByTagName('h1');
  (yield h1.text()).should.include("the server of awesome");
  var cb = o_C();
  console.log(" - Shutting down simple web server");
  server.close(cb);
  yield cb;
});

tests.webTestConnect = o_O(function*(driver, caps) {
  yield localTest(driver, caps, "http://localhost:8000");
});

tests.webTestLocalName = o_O(function*(driver, caps) {
  var host = os.hostname();
  if (host === "" || host === "localhost") {
    throw new Error("Can't run local name test without an interesting hostname");
  }
  yield localTest(driver, caps, "http://" + host + ":8000");
});

tests.webTestHttps = o_O(function*(driver, caps) {
  console.log(" - Running minimal web + https test");
  caps.name = "Minimal web test + https";
  yield driver.init(caps);
  yield driver.get("https://buildslave.saucelabs.com");
  (yield driver.title()).should.include("Sauce Labs");
});

tests.webTestHttpsSelfSigned = o_O(function*(driver, caps) {
  console.log(" - Running minimal web + selfsigned https test");
  caps.name = "Minimal web test + selfsigned https";
  yield driver.init(caps);
  yield driver.get("https://selfsigned.buildslave.saucelabs.com");
  (yield driver.title()).should.include("Sauce Labs");
});

tests.appiumTest = o_O(function*(driver, caps) {
  console.log(" - Running minimal appium test");
  caps.name = "Minimal appium test";
  yield driver.init(caps);
  yield driver.elementByTagName("button").click();
});

module.exports = tests;
