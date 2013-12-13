"use strict";

var yiewd = require('yiewd')
  , util = require('util')
  , _ = require('underscore')
  , tests = require('./tests.js')
  , o_O = require('monocle-js').o_O;

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
    case 'https': return tests.webTestHttps;
    case 'selfsigned': return tests.webTestHttpsSelfSigned;
    case 'connect': return tests.webTestConnect;
    case 'localname': return tests.webTestLocalName;
    case 'appium': return tests.appiumTest;
    default: return tests.webTest;
  }
};

exports.run = o_O(function*(opts) {
  console.log("Running test against " + opts.configName);
  var driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server, opts.port);
  var test = getTestByType(opts.testType);
  var caps = getDesiredCaps(opts);
  console.log(" - Desired caps: " + util.inspect(caps));
  try {
    yield test(driver, caps);
    console.log(" - Reporting pass");
    yield driver.reportPass();
  } catch(e) {
    console.log(e.stack);
    if (driver.driver.sessionID) {
      console.log(" - Reporting failure");
      yield driver.reportFail();
    }
  }
  if (driver.driver.sessionID) {
    console.log(" - Ending session");
    yield driver.quit();
  }
});
