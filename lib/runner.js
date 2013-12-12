"use strict";

var yiewd = require('yiewd')
  , o_O = require('monocle-js').o_O
  , should = require('should');

var minimalWebTest = o_O(function*(driver, caps) {
  console.log("Running minimal web test");
  caps.name = "Minimal web test";
  yield driver.init(caps);
  yield driver.url("http://whatismyip.org");
  (yield driver.title()).should.include("What");
});

var minimalWebTestHttps = o_O(function*(driver, caps) {
  console.log("Running minimal web + https test");
  caps.name = "Minimal web test + https";
  yield driver.init(caps);
  yield driver.url("https://saucelabs.com");
  (yield driver.title()).should.include("Sauce Labs");
});

var minimalAppiumTest = o_O(function*(driver, caps) {
  caps.name = "Minimal appium test";
  yield driver.init(caps);
  yield driver.elementByTagName("button").click();
});

var getDesiredCaps = function(opts) {
  delete opts.server;
  delete opts.port;
  delete opts.userName;
  delete opts.accessKey;
  delete opts.testType;
  return opts;
};

exports.run = o_O(function*(opts) {
  var server = opts.userName + ":" + opts.accessKey + "@" + opts.server;
  console.log("Creating driver to talk to " + server + ":" + opts.port);
  var driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server, opts.port);
  console.log("Initializing session...");
  var caps = getDesiredCaps(opts);
  console.log(caps);
  var test;
  switch (opts.testType) {
    case 'web': test = minimalWebTest; break;
    case 'https': test = minimalWebTestHttps; break;
    case 'appium': test = minimalAppiumTest; break;
    default: test = minimalWebTest;
  }
  try {
    yield test(driver, caps);
    console.log("Reporting pass");
    yield driver.reportPass();
  } catch(e) {
    console.log(e);
    console.log("Reporting failure");
    yield driver.reportFail();
  }
  console.log("Ending session...");
  yield driver.quit();
});
