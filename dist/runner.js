"use strict";

var yiewd = require("yiewd"),
    _ = require("underscore"),
    util = require("util"),
    tests = require("./tests.js"),
    monocle = require("monocle-js"),
    o_O = monocle.o_O,
    o_C = monocle.o_C;

var getTestByType = function getTestByType(testType) {
  switch (testType) {
    case "https":
      return tests.webTestHttps;
    case "selfsigned":
      return tests.webTestHttpsSelfSigned;
    case "connect":
      return tests.webTestConnect;
    case "localname":
      return tests.webTestLocalName;
    case "appium":case "ios":
      return tests.iosTest;
    case "ios_hybrid":
      return tests.iosHybridTest;
    case "android":
      return tests.androidTest;
    case "android_long":
      return tests.androidLongTest;
    case "android_hybrid":
      return tests.androidHybridTest;
    case "selendroid":
      return tests.selendroidTest;
    case "js":
      return tests.jsTest;
    case "web_long":
      return tests.longWebTest;
    default:
      return tests.webTest;
  }
};

var NATIVE_TESTS = ["appium", "ios", "android", "android_long", "selendroid", "android_hybrid", "ios_hybrid"];

var fixCaps = function fixCaps(opts, caps, onSauce) {
  if (caps.version && caps.version.toString().length === 1) {
    caps.version = caps.version.toString() + ".0";
  }
  if (caps.device || _.contains(NATIVE_TESTS, opts.testType)) {
    caps = fixAppiumCaps(opts, caps, onSauce);
  } else {
    delete caps.device;
  }
  var tt = opts.testType.toLowerCase();
  if (tt === "selfsigned") {
    caps.keepKeyChains = true;
  }
  caps["prevent-requeue"] = true;
  return caps;
};

var apps = {
  iOS7: "http://appium.s3.amazonaws.com/TestApp7.0.app.zip",
  iOS71: "http://appium.s3.amazonaws.com/TestApp7.1.app.zip",
  iOSHybrid6: "http://appium.s3.amazonaws.com/WebViewApp6.1.app.zip",
  iOSHybrid7: "http://appium.s3.amazonaws.com/WebViewApp7.1.app.zip",
  Android: "http://appium.s3.amazonaws.com/ContactManager.apk",
  AndroidHybrid: "http://appium.s3.amazonaws.com/ApiDemos-debug-2014-08.apk",
  Selendroid: "http://appium.s3.amazonaws.com/selendroid-test-app-0.7.0.apk"
};

var fixAppium18Caps = function fixAppium18Caps(opts, caps, onSauce) {
  if (caps.browserName === "Safari") {
    caps.app = "safari";
  } else if (caps.browserName === "Chrome") {
    caps.app = "chrome";
  }
  delete caps.browserName;
  if (!caps.device) {
    caps.device = "iPhone Simulator";
  }
  if (!onSauce) {
    caps.launchTimeout = 15000;
  }
  if (caps.device[0].toLowerCase() === "i") {
    caps.app = apps.iOS;
    if (!caps.platform) {
      caps.platform = "Mac 10.9";
    }
    if (!caps.version) {
      caps.version = caps.platform === "Mac 10.9" ? "7.0" : "6.1";
    }
  } else {
    caps.app = apps.Android;
    caps["app-package"] = "com.example.android.contactmanager";
    caps["app-activity"] = ".ContactManager";
    if (!caps.platform) {
      caps.platform = "Linux";
    }
    if (!caps.version) {
      caps.version = "4.2";
    }
    if (opts.testType.toLowerCase() === "selendroid") {
      caps.app = apps.Selendroid;
      caps["app-package"] = "io.selendroid.testapp";
      caps["app-activity"] = ".HomeScreenActivity";
      caps.webviewSupport = true;
    }
  }
  return caps;
};

var fixAppium1Caps = function fixAppium1Caps(opts, caps, onSauce) {
  caps.appiumVersion = opts.backendVersion.toString();
  if (/^\d$/.test(caps.appiumVersion)) {
    caps.appiumVersion += ".0";
  }
  var tt = opts.testType.toLowerCase();
  if (_.contains(NATIVE_TESTS, tt)) {
    caps.browserName = "";
  }
  delete caps.platform;
  caps.deviceName = caps.device;
  delete caps.device;
  caps.platformVersion = caps.version;
  delete caps.version;
  if (!caps.deviceName) {
    caps.deviceName = "iPhone Simulator";
  }
  if (!onSauce) {
    caps.launchTimeout = 15000;
  }
  if (caps.deviceName[0].toLowerCase() === "i") {
    caps.platformName = "iOS";
    if (!caps.platformVersion) {
      caps.platformVersion = "7.1";
    }
    if (tt === "ios") {
      if (parseFloat(caps.platformVersion < 7.1)) {
        caps.app = apps.iOS7;
      } else {
        caps.app = apps.iOS71;
      }
    } else if (tt === "ios_hybrid") {
      if (parseFloat(caps.platformVersion) < 7) {
        caps.app = apps.iOSHybrid6;
      } else {
        caps.app = apps.iOSHybrid7;
      }
    }
  } else {
    caps.platformName = "Android";
    if (_.contains(["android", "android_long"], tt)) {
      caps.app = apps.Android;
    } else if (tt === "android_hybrid") {
      caps.appActivity = ".view.WebView1";
      caps.app = apps.AndroidHybrid;
    }
    if (!caps.platformVersion) {
      caps.platformVersion = "4.3";
    }
    if (tt === "selendroid") {
      caps.automationName = "Selendroid";
      caps.app = apps.Selendroid;
    }
  }
  return caps;
};

var fixAppiumCaps = function fixAppiumCaps(opts, caps, onSauce) {
  var appiumVer = parseFloat(opts.backendVersion) || null;
  if (appiumVer >= 1) {
    return fixAppium1Caps(opts, caps, onSauce);
  } else {
    return fixAppium18Caps(opts, caps, onSauce);
  }
};

exports.runTest = o_O(regeneratorRuntime.mark(function callee$0$0(multiRun, test, caps, opts, onSauce) {
  var start, result, driver, log, testTime;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        start = Date.now();
        result = {};

        log = function log(msg) {
          if (!multiRun) console.log(msg);
        };

        if (onSauce) {
          driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server, opts.port);
        } else {
          driver = yiewd.remote(opts.server, opts.port);
        }
        context$1$0.prev = 4;
        context$1$0.next = 7;
        return test(driver, caps, opts);

      case 7:
        result.startupTime = context$1$0.sent;

        if (!opts.wait) {
          context$1$0.next = 12;
          break;
        }

        log(" - Waiting around for 120s...");
        context$1$0.next = 12;
        return monocle.utils.sleep(120000);

      case 12:
        if (!onSauce) {
          context$1$0.next = 18;
          break;
        }

        log(" - Reporting pass");
        context$1$0.next = 16;
        return driver.reportPass();

      case 16:
        context$1$0.next = 19;
        break;

      case 18:
        log(" - Test passed");

      case 19:
        result.stack = null;
        context$1$0.next = 36;
        break;

      case 22:
        context$1$0.prev = 22;
        context$1$0.t0 = context$1$0["catch"](4);

        log("");
        log(context$1$0.t0.stack);
        log("");
        result.stack = context$1$0.t0.stack;

        if (!(driver.sessionID && onSauce)) {
          context$1$0.next = 35;
          break;
        }

        log(" - Reporting failure");
        context$1$0.next = 32;
        return driver.reportFail();

      case 32:
        result.sessionId = driver.sessionID;
        context$1$0.next = 36;
        break;

      case 35:
        log(" - Test failed");

      case 36:
        if (!driver.sessionID) {
          context$1$0.next = 40;
          break;
        }

        log(" - Ending session");
        context$1$0.next = 40;
        return driver.quit();

      case 40:
        if (multiRun) {
          if (result.stack) {
            process.stdout.write("F");
          } else {
            process.stdout.write(".");
          }
        }
        result.time = Date.now() - start;
        testTime = result.time - result.startupTime;

        log(" - Session finished in " + (result.time / 1000).toFixed(2) + "s");
        if (!result.stack) {
          log("   - Startup time: " + (result.startupTime / 1000).toFixed(2) + "s, " + (result.startupTime / result.time * 100).toFixed(2) + "%");
          log("   - Test time: " + (testTime / 1000).toFixed(2) + "s, " + (testTime / result.time * 100).toFixed(2) + "%");
        } else {
          log("   - No timing information available since test failed");
          if (result.sessionId) {
            log("   - Sauce link: https://saucelabs.com/tests/" + result.sessionId);
          }
        }
        return context$1$0.abrupt("return", result);

      case 46:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$0, this, [[4, 22]]);
}));

exports.runTestSet = o_O(regeneratorRuntime.mark(function callee$0$1(multiRun, test, caps, opts, onSauce) {
  var results, testsInProgress, i, setCb, numTestsInProgress, checkRuns;
  return regeneratorRuntime.wrap(function callee$0$1$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        results = [];

        if (multiRun) {
          console.log("");
        }
        testsInProgress = {};

        for (i = 0; i < opts.processes; i++) {
          testsInProgress[i] = null;
        }
        setCb = o_C();

        numTestsInProgress = function numTestsInProgress() {
          var num = 0;
          for (var i = 0; i < opts.processes; i++) {
            if (testsInProgress[i] !== null) {
              num++;
            }
          }
          return num;
        };

        checkRuns = (function (_checkRuns) {
          var _checkRunsWrapper = function checkRuns() {
            return _checkRuns.apply(this, arguments);
          };

          _checkRunsWrapper.toString = function () {
            return _checkRuns.toString();
          };

          return _checkRunsWrapper;
        })(function () {
          if (results.length < opts.runs) {
            if (results.length + numTestsInProgress() < opts.runs) {
              _.each(testsInProgress, function (testCb, slot) {
                if (testCb === null) {
                  testsInProgress[slot] = exports.runTest(multiRun, test, caps, opts, onSauce);
                  testsInProgress[slot].add(function (err, res) {
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
        });

        checkRuns();
        context$1$0.next = 10;
        return setCb;

      case 10:
        return context$1$0.abrupt("return", results);

      case 11:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$1, this);
}));

exports.run = o_O(regeneratorRuntime.mark(function callee$0$2(opts, caps) {
  var onSauce, testStr, pStr, test, multiRun, results, cleanResults, sum, avg, startSum, startAvg;
  return regeneratorRuntime.wrap(function callee$0$2$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        onSauce = true;

        if (!opts.userName || !opts.accessKey || opts.testType == "js") {
          onSauce = false;
        }
        if (opts.processes > opts.runs) {
          opts.runs = opts.processes;
        }
        testStr = opts.runs + " test" + (opts.runs !== 1 ? "s" : "");
        pStr = opts.processes + " process" + (opts.processes !== 1 ? "es" : "");
        test = getTestByType(opts.testType);

        caps = fixCaps(opts, caps, onSauce);
        console.log("Running " + testStr + " in " + pStr + " against " + opts.configName + " with caps:");
        console.log(util.inspect(caps));
        multiRun = opts.runs > 1;
        context$1$0.next = 12;
        return exports.runTestSet(multiRun, test, caps, opts, onSauce);

      case 12:
        results = context$1$0.sent;
        cleanResults = [];

        _.each(results, function (res) {
          if (!res.stack) {
            cleanResults.push(res);
          }
        });
        if (multiRun) {
          console.log("\n");
          if (cleanResults.length) {
            sum = _.reduce(_.pluck(cleanResults, "time"), function (m, n) {
              return m + n;
            }, 0);
            avg = sum / cleanResults.length;
            startSum = _.reduce(_.pluck(cleanResults, "startupTime"), function (m, n) {
              return m + n;
            }, 0);
            startAvg = startSum / cleanResults.length;

            console.log("Average successful test run time: " + (avg / 1000).toFixed(2) + "s");
            console.log("Average successful test startup time: " + (startAvg / 1000).toFixed(2) + "s (" + (startAvg / avg * 100).toFixed(2) + "% of total)");
          } else {
            console.log("No statistics available since every test failed");
          }

          _.each(results, function (res, i) {
            if (res.stack) {
              console.log("");
              console.log("Error for run " + i);
              if (res.sessionId) {
                console.log("https://saucelabs.com/tests/" + res.sessionId);
              }
              console.log("----------------");
              console.log(res.stack);
            }
          });
        }

      case 16:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$2, this);
}));