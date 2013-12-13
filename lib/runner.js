"use strict";

var yiewd = require('yiewd')
  , _ = require('underscore')
  , util = require('util')
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

var fixCaps = function(opts, caps) {
  if (opts.testType === 'appium') {
    caps.browserName = '';
  }
  if (caps.device) {
    if (caps.browserName === 'Safari') {
      caps.app = 'safari';
    } else {
      caps.app = 'http://appium.s3.amazonaws.com/TestApp7.0.app.zip';
    }
    delete caps.browserName;
    if (!caps.device) {
      caps.device = 'iPhone Simulator';
    }
    if (!caps.version) {
      caps.version = '6.1';
    }
  }
  return caps;
};

exports.run = o_O(function*(opts, caps) {
  console.log("Running test against " + opts.configName);
  var driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server,
    opts.port);
  var test = getTestByType(opts.testType);
  caps = fixCaps(opts, caps);
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
