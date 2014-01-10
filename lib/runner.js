"use strict";

var yiewd = require('yiewd')
  , _ = require('underscore')
  , util = require('util')
  , tests = require('./tests.js')
  , testsMap = require('./parser.js').testsMap
  , monocle = require('monocle-js')
  , o_O = monocle.o_O;

var getTestByType = function(testType) {
  switch (testType) {
    case 'https': return tests.webTestHttps;
    case 'selfsigned': return tests.webTestHttpsSelfSigned;
    case 'connect': return tests.webTestConnect;
    case 'localname': return tests.webTestLocalName;
    case 'appium': case 'ios': return tests.iosTest;
    case 'android': return tests.androidTest;
    case 'selendroid': return tests.selendroidTest;
    default: return tests.webTest;
  }
};

var fixCaps = function(opts, caps) {
  if (_.contains(['appium', 'ios', 'android', 'selendroid'], opts.testType)) {
    caps.browserName = '';
  }
  if (caps.device) {
    caps = fixAppiumCaps(opts, caps);
  } else {
    delete caps.device;
  }
  return caps;
};


var fixAppiumCaps = function(opts, caps) {
  if (caps.browserName === 'Safari') {
    caps.app = 'safari';
  } else if (caps.browserName === 'Chrome') {
    caps.app = 'chrome';
  }
  delete caps.browserName;
  if (!caps.device) {
    caps.device = 'iPhone Simulator';
  }
  if (caps.device[0].toLowerCase() === 'i') {
    caps.app = 'http://appium.s3.amazonaws.com/TestApp7.0.app.zip';
    if (!caps.platform) {
      caps.platform = "Mac 10.9";
    }
    if (!caps.version) {
      caps.version = caps.platform === "Mac 10.9" ? '7.0' : '6.1';
    }
  } else {
    caps.app = 'http://appium.s3.amazonaws.com/ContactManager.apk';
    caps['app-package'] = 'com.example.android.contactmanager';
    caps['app-activity'] = '.ContactManager';
    if (!caps.platform) {
      caps.platform = "Linux";
    }
    if (!caps.version) {
      caps.version = '4.2';
    }
    if (opts.testType.toLowerCase() === 'selendroid') {
      caps.app = 'http://appium.s3.amazonaws.com/selendroid-test-app-0.7.0.apk';
      caps['app-package'] = 'io.selendroid.testapp';
      caps['app-activity'] = '.HomeScreenActivity';
      caps.webviewSupport = true;
    }
  }
  return caps;
};

exports.runTest = o_O(function*(multiRun, test, driver, caps, opts) {
  var start = Date.now();
  var result = {};
  var log = function(msg) {
    if (!multiRun) console.log(msg);
  };
  try {
    yield test(driver, caps, opts.localname);
    if (opts.wait) {
      log(" - Waiting around for 120s...");
      yield monocle.utils.sleep(120000);
    }
    log(" - Reporting pass");
    yield driver.reportPass();
    result.stack = null;
  } catch(e) {
    log(e.stack);
    result.stack = e.stack;
    if (driver.driver.sessionID) {
      log(" - Reporting failure");
      yield driver.reportFail();
    }
  }
  if (driver.driver.sessionID) {
    log(" - Ending session");
    yield driver.quit();
  }
  if (multiRun) {
    if (result.stack) {
      process.stdout.write('F');
    } else {
      process.stdout.write('.');
    }
  }
  result.time = (Date.now() - start);
  log(" - Session finished in " + (result.time / 1000) + "s");
  return result;
});

exports.run = o_O(function*(opts, caps) {
  var testStr = opts.runs + " test" + (opts.runs !== 1 ? "s" : "");
  console.log("Running " + testStr + " against " + opts.configName);
  var driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server,
    opts.port);
  var test = getTestByType(opts.testType);
  caps = fixCaps(opts, caps);
  console.log(" - Desired caps: " + util.inspect(caps));
  console.log(" - Test type: " + testsMap[opts.testType]);
  var multiRun = opts.runs > 1;
  var results = [];
  if (multiRun) {
    console.log("");
  }
  for (var i = 0; i < opts.runs; i++) {
    results.push(yield exports.runTest(multiRun, test, driver, caps, opts));
  }
  if (multiRun) {
    console.log("\n");
    var sum = _.reduce(_.pluck(results, 'time'), function(m, n) { return m + n; }, 0);
    var avg = sum / results.length;
    console.log("Average test run time: " + (avg / 1000) + "s");
  }
});
