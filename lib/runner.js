"use strict";

var yiewd = require('yiewd')
  , util = require('util')
  , _ = require('underscore')
  , tests = require('./tests.js')
  , monocle = require('monocle-js')
  , o_O = monocle.o_O;

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

exports.run = o_O(function*(opts, caps) {
  console.log("Running test against " + opts.configName);
  var driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server, opts.port);
  var test = getTestByType(opts.testType);
  console.log(" - Desired caps: " + util.inspect(caps));
  try {
    yield test(driver, caps, opts.localname);
    if (opts.wait) {
      console.log(" - Waiting around for 120s...");
      yield monocle.utils.sleep(120);
    }
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
