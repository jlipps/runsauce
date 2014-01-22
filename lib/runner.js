"use strict";

var yiewd = require('yiewd')
  , _ = require('underscore')
  , util = require('util')
  , tests = require('./tests.js')
  , testsMap = require('./parser.js').testsMap
  , monocle = require('monocle-js')
  , o_O = monocle.o_O
  , o_C = monocle.o_C;

var getTestByType = function(testType) {
  switch (testType) {
    case 'https': return tests.webTestHttps;
    case 'selfsigned': return tests.webTestHttpsSelfSigned;
    case 'connect': return tests.webTestConnect;
    case 'localname': return tests.webTestLocalName;
    case 'appium': case 'ios': return tests.iosTest;
    case 'android': return tests.androidTest;
    case 'android_long': return tests.androidLongTest;
    case 'selendroid': return tests.selendroidTest;
    default: return tests.webTest;
  }
};

var fixCaps = function(opts, caps, onSauce) {
  if (caps.device ||
      _.contains(['appium', 'ios', 'android', 'selendroid'], opts.testType)) {
    caps = fixAppiumCaps(opts, caps, onSauce);
  } else {
    delete caps.device;
  }
  return caps;
};


var fixAppiumCaps = function(opts, caps, onSauce) {
  if (caps.browserName === 'Safari') {
    caps.app = 'safari';
  } else if (caps.browserName === 'Chrome') {
    caps.app = 'chrome';
  }
  delete caps.browserName;
  if (!caps.device) {
    caps.device = 'iPhone Simulator';
  }
  if (!onSauce) {
    caps.launchTimeout = 15000;
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

exports.runTest = o_O(function*(multiRun, test, caps, opts, onSauce) {
  var start = Date.now();
  var result = {};
  var driver;
  var log = function(msg) {
    if (!multiRun) console.log(msg);
  };
  if (onSauce) {
    driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server,
                         opts.port);
  } else {
    driver = yiewd.remote(opts.server, opts.port);
  }
  try {
    result.startupTime = yield test(driver, caps, opts.localname);
    if (opts.wait) {
      log(" - Waiting around for 120s...");
      yield monocle.utils.sleep(120000);
    }
    if (onSauce) {
      log(" - Reporting pass");
      yield driver.reportPass();
    }
    result.stack = null;
  } catch(e) {
    log(e.stack);
    result.stack = e.stack;
    if (driver.driver.sessionID && onSauce) {
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
  var testTime = result.time - result.startupTime;
  log(" - Session finished in " + (result.time / 1000).toFixed(2) + "s");
  log("   - Startup time: " + (result.startupTime / 1000).toFixed(2) +
      "s, " + (result.startupTime / result.time * 100).toFixed(2) + "%");
  log("   - Test time: " + (testTime / 1000).toFixed(2) +
      "s, " + (testTime / result.time * 100).toFixed(2) + "%");
  return result;
});

exports.runTestSet = o_O(function*(multiRun, test, caps, opts, onSauce) {
  var results = [];
  if (multiRun) {
    console.log("");
  }
  var testsInProgress = {};
  for (var i = 0; i < opts.processes; i++) {
    testsInProgress[i] = null;
  }
  var setCb = o_C();
  var numTestsInProgress = function() {
    var num = 0;
    for (var i = 0; i < opts.processes; i++) {
      if (testsInProgress[i] !== null) {
        num++;
      }
    }
    return num;
  };
  var checkRuns = function() {
    if (results.length < opts.runs) {
      if (results.length + numTestsInProgress() < opts.runs) {
        _.each(testsInProgress, function(testCb, slot) {
          if (testCb === null) {
            testsInProgress[slot] = exports.runTest(multiRun, test, caps, opts, onSauce);
            testsInProgress[slot].add(function(err, res) {
              if (err) {
                console.log("Got error running test: " + err.message);
                console.log(err);
              }
              testsInProgress[slot] = null;
              results.push(res);
            });
          }
        });
      }
      setTimeout(checkRuns, 75);
    } else {
      setCb();
    }
  };
  checkRuns();
  yield setCb;
  return results;
});

exports.run = o_O(function*(opts, caps) {
  var onSauce = true;
  if (!opts.userName || opts.accessKey) {
    onSauce = false;
  }
  if (opts.processes > opts.runs) {
    opts.runs = opts.processes;
  }
  var testStr = opts.runs + " test" + (opts.runs !== 1 ? "s" : "");
  var pStr = opts.processes + " process" + (opts.processes !== 1 ? "es": "");
  var test = getTestByType(opts.testType);
  caps = fixCaps(opts, caps, onSauce);
  console.log("Running " + testStr + " in " + pStr + " against " +
              opts.configName + " with caps:");
  console.log(util.inspect(caps));
  var multiRun = opts.runs > 1;
  var results = yield exports.runTestSet(multiRun, test, caps, opts, onSauce);
  var cleanResults = [];
  _.each(results, function(res) {
    if (!res.stack) {
      cleanResults.push(res);
    }
  });
  if (multiRun) {
    console.log("\n");
    if (cleanResults.length) {
      var sum = _.reduce(_.pluck(cleanResults, 'time'), function(m, n) { return m + n; }, 0);
      var avg = sum / cleanResults.length;
      var startSum = _.reduce(_.pluck(cleanResults, 'startupTime'), function(m, n) { return m + n; }, 0);
      var startAvg = startSum / cleanResults.length;
      console.log("Average successful test run time: " + (avg / 1000).toFixed(2) + "s");
      console.log("Average successful test startup time: " + (startAvg / 1000).toFixed(2) +
          "s (" + (startAvg / avg * 100).toFixed(2) + "% of total)");
    } else {
      console.log("No statistics available since every test failed");
    }

    _.each(results, function(res, i) {
      if (res.stack) {
        console.log("");
        console.log("Error for run " + i);
        console.log("----------------");
        console.log(res.stack);
      }
    });
  }
});
