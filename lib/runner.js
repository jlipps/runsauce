"use strict";

var yiewd = require('yiewd')
  , _ = require('underscore')
  , o_O = require('monocle-js').o_O
  , o_C = require('monocle-js').o_C
  , localServer = require('./localserver.js')
  , should = require('should');

var minimalWebTest = o_O(function*(driver, caps) {
  console.log(" - Running minimal web test");
  caps.name = "Minimal web test";
  yield driver.init(caps);
  yield driver.get("http://whatismyip.org");
  (yield driver.title()).should.include("What");
});

var minimalWebTestConnect = o_O(function*(driver, caps) {
  console.log(" - Starting simple web server");
  var server = localServer.run();
  console.log(" - Running minimal web test + sauce connect");
  caps.name = "Minimal web test + connect";
  yield driver.init(caps);
  yield driver.get("http://localhost:8000");
  var h1 = yield driver.elementByTagName('h1');
  (yield h1.text()).should.include("the server of awesome");
  var cb = o_C();
  console.log(" - Shutting down simple web server");
  server.close(cb);
  yield cb;
});

var minimalWebTestHttps = o_O(function*(driver, caps) {
  console.log(" - Running minimal web + https test");
  caps.name = "Minimal web test + https";
  yield driver.init(caps);
  yield driver.get("https://buildslave.saucelabs.com");
  (yield driver.title()).should.include("Sauce Labs");
});

var minimalWebTestHttpsSelfSigned = o_O(function*(driver, caps) {
  console.log(" - Running minimal web + selfsigned https test");
  caps.name = "Minimal web test + selfsigned https";
  yield driver.init(caps);
  yield driver.get("https://selfsigned.buildslave.saucelabs.com");
  (yield driver.title()).should.include("Sauce Labs");
});

var minimalAppiumTest = o_O(function*(driver, caps) {
  console.log(" - Running minimal appium test");
  caps.name = "Minimal appium test";
  yield driver.init(caps);
  yield driver.elementByTagName("button").click();
});

var getDesiredCaps = function(opts) {
  var caps = _.clone(opts);
  delete caps.server;
  delete caps.port;
  delete caps.userName;
  delete caps.accessKey;
  delete caps.testType;
  delete caps.configName;
  return caps;
};

var getTestByType = function(testType) {
  switch (testType) {
    case 'https': return minimalWebTestHttps;
    case 'selfsigned': return minimalWebTestHttpsSelfSigned;
    case 'connect': return minimalWebTestConnect;
    case 'appium': return minimalAppiumTest;
    default: return minimalWebTest;
  }
};

exports.run = o_O(function*(opts) {
  console.log("Creating driver to talk to " + opts.configName);
  var driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server, opts.port);
  var test = getTestByType(opts.testType);
  var caps = getDesiredCaps(opts);
  console.log(" - Desired caps: " + JSON.stringify(caps));
  try {
    yield test(driver, caps);
    console.log(" - Reporting pass");
    yield driver.reportPass();
  } catch(e) {
    console.log(e.name + ": " + e.message);
    console.log(" - Reporting failure");
    yield driver.reportFail();
  }
  console.log(" - Ending session...");
  yield driver.quit();
});
