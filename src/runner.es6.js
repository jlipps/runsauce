import _ from 'lodash';
import util from 'util';
import Q from 'q';
import yiewd from 'yiewd';
import { sleep } from 'asyncbox';
import { tests } from './tests';

const APPS = {
  'iOS7': 'http://appium.s3.amazonaws.com/TestApp7.0.app.zip',
  'iOS71': 'http://appium.s3.amazonaws.com/TestApp7.1.app.zip',
  'iOSHybrid6': 'http://appium.s3.amazonaws.com/WebViewApp6.1.app.zip',
  'iOSHybrid7': 'http://appium.s3.amazonaws.com/WebViewApp7.1.app.zip',
  'Android': 'http://appium.s3.amazonaws.com/ContactManager.apk',
  'AndroidHybrid': 'http://appium.s3.amazonaws.com/ApiDemos-debug-2014-08.apk',
  'Selendroid': 'http://appium.s3.amazonaws.com/selendroid-test-app-0.7.0.apk'
};

const NATIVE_TESTS = ["appium", "ios", "android", "android_long",
                      "selendroid", "android_hybrid", "ios_hybrid"];

function getTestByType (testType) {
  switch (testType) {
    case 'https': return tests.webTestHttps;
    case 'selfsigned': return tests.webTestHttpsSelfSigned;
    case 'connect': return tests.webTestConnect;
    case 'localname': return tests.webTestLocalName;
    case 'appium': case 'ios': return tests.iosTest;
    case 'ios_hybrid': return tests.iosHybridTest;
    case 'android': return tests.androidTest;
    case 'android_long': return tests.androidLongTest;
    case 'android_hybrid': return tests.androidHybridTest;
    case 'selendroid': return tests.selendroidTest;
    case 'js': return tests.jsTest;
    case 'web_long': return tests.longWebTest;
    default: return tests.webTest;
  }
}

function fixCaps (opts, caps, onSauce) {
  if (caps.version && caps.version.toString().length === 1) {
    caps.version = caps.version.toString() + ".0";
  }
  if (caps.device ||
      _.contains(NATIVE_TESTS, opts.testType)) {
    caps = fixAppiumCaps(opts, caps, onSauce);
  } else {
    delete caps.device;
  }
  let tt = opts.testType.toLowerCase();
  if (tt === "selfsigned") {
    caps.keepKeyChains = true;
  }
  caps['prevent-requeue'] = true;
  return caps;
}

function fixAppium18Caps (opts, caps, onSauce) {
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
    caps.app = APPS.iOS;
    if (!caps.platform) {
      caps.platform = "Mac 10.9";
    }
    if (!caps.version) {
      caps.version = caps.platform === "Mac 10.9" ? '7.0' : '6.1';
    }
  } else {
    caps.app = APPS.Android;
    caps['app-package'] = 'com.example.android.contactmanager';
    caps['app-activity'] = '.ContactManager';
    if (!caps.platform) {
      caps.platform = "Linux";
    }
    if (!caps.version) {
      caps.version = '4.2';
    }
    if (opts.testType.toLowerCase() === 'selendroid') {
      caps.app = APPS.Selendroid;
      caps['app-package'] = 'io.selendroid.testapp';
      caps['app-activity'] = '.HomeScreenActivity';
      caps.webviewSupport = true;
    }
  }
  return caps;
}

function fixAppium1Caps (opts, caps, onSauce) {
  caps.appiumVersion = opts.backendVersion.toString();
  if (/^\d$/.test(caps.appiumVersion)) {
    caps.appiumVersion += ".0";
  }
  let tt = opts.testType.toLowerCase();
  if (_.contains(NATIVE_TESTS, tt)) {
    caps.browserName = '';
  }
  delete caps.platform;
  caps.deviceName = caps.device;
  delete caps.device;
  caps.platformVersion = caps.version;
  delete caps.version;
  if (!caps.deviceName) {
    caps.deviceName = 'iPhone Simulator';
  }
  if (!onSauce) {
    caps.launchTimeout = 15000;
  }
  if (caps.deviceName[0].toLowerCase() === 'i') {
    caps.platformName = 'iOS';
    if (!caps.platformVersion) {
      caps.platformVersion = '7.1';
    }
    if (tt === "ios") {
      if (parseFloat(caps.platformVersion < 7.1)) {
        caps.app = APPS.iOS7;
      } else {
        caps.app = APPS.iOS71;
      }
    } else if (tt === "ios_hybrid") {
      if (parseFloat(caps.platformVersion) < 7) {
        caps.app = APPS.iOSHybrid6;
      } else {
        caps.app = APPS.iOSHybrid7;
      }
    }
  } else {
    caps.platformName = 'Android';
    if (_.contains(["android", "android_long"], tt)) {
      caps.app = APPS.Android;
    } else if (tt === 'android_hybrid') {
      caps.appActivity = '.view.WebView1';
      caps.app = APPS.AndroidHybrid;
    }
    if (!caps.platformVersion) {
      caps.platformVersion = '4.3';
    }
    if (tt === 'selendroid') {
      caps.automationName = 'Selendroid';
      caps.app = APPS.Selendroid;
    }
  }
  return caps;
}

function fixAppiumCaps (opts, caps, onSauce) {
  let appiumVer = parseFloat(opts.backendVersion) || null;
  if (appiumVer >= 1) {
    return fixAppium1Caps(opts, caps, onSauce);
  } else {
    return fixAppium18Caps(opts, caps, onSauce);
  }
}

export async function runTest (multiRun, test, caps, opts, onSauce) {
  let start = Date.now();
  let result = {};
  let driver;
  let log = function(msg) {
    if (!multiRun) console.log(msg);
  };
  if (onSauce) {
    driver = yiewd.sauce(opts.userName, opts.accessKey, opts.server,
                         opts.port);
  } else {
    driver = yiewd.remote(opts.server, opts.port);
  }
  try {
    result.startupTime = await test(driver, caps, opts);
    if (opts.wait) {
      log(" - Waiting around for 120s...");
      await sleep(120000);
    }
    if (onSauce) {
      log(" - Reporting pass");
      await driver.reportPass();
    } else {
      log(" - Test passed");
    }
    result.stack = null;
  } catch(e) {
    log("");
    log(e.stack);
    log("");
    result.stack = e.stack;
    if (driver.sessionID && onSauce) {
      log(" - Reporting failure");
      await driver.reportFail();
      result.sessionId = driver.sessionID;
    } else {
      log(" - Test failed");
    }
  }
  if (driver.sessionID) {
    log(" - Ending session");
    await driver.quit();
  }
  if (multiRun) {
    if (result.stack) {
      process.stdout.write('F');
    } else {
      process.stdout.write('.');
    }
  }
  result.time = (Date.now() - start);
  let testTime = result.time - result.startupTime;
  log(" - Session finished in " + (result.time / 1000).toFixed(2) + "s");
  if (!result.stack) {
    log("   - Startup time: " + (result.startupTime / 1000).toFixed(2) +
        "s, " + (result.startupTime / result.time * 100).toFixed(2) + "%");
    log("   - Test time: " + (testTime / 1000).toFixed(2) +
        "s, " + (testTime / result.time * 100).toFixed(2) + "%");
  } else {
    log("   - No timing information available since test failed");
    if (result.sessionId) {
      log("   - Sauce link: https://saucelabs.com/tests/" + result.sessionId);
    }
  }
  return result;
}

export async function runTestSet (multiRun, test, caps, opts, onSauce) {
  let results = [];
  if (multiRun) {
    console.log("");
  }
  let testsInProgress = {};
  for (let i = 0; i < opts.processes; i++) {
    testsInProgress[i] = null;
  }
  let setCb = Q.defer();
  let numTestsInProgress = function() {
    let num = 0;
    for (let i = 0; i < opts.processes; i++) {
      if (testsInProgress[i] !== null) {
        num++;
      }
    }
    return num;
  };
  let checkRuns = function() {
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
      setCb.resolve();
    }
  };
  checkRuns();
  await setCb.promise;
  return results;
}

export async function run (opts, caps) {
  let onSauce = true;
  if (!opts.userName || !opts.accessKey || opts.testType == 'js') {
    onSauce = false;
  }
  if (opts.processes > opts.runs) {
    opts.runs = opts.processes;
  }
  let testStr = opts.runs + " test" + (opts.runs !== 1 ? "s" : "");
  let pStr = opts.processes + " process" + (opts.processes !== 1 ? "es": "");
  let test = getTestByType(opts.testType);
  caps = fixCaps(opts, caps, onSauce);
  console.log("Running " + testStr + " in " + pStr + " against " +
              opts.configName + " with caps:");
  console.log(util.inspect(caps));
  let multiRun = opts.runs > 1;
  let results = await runTestSet(multiRun, test, caps, opts, onSauce);
  let cleanResults = [];
  _.each(results, function(res) {
    if (!res.stack) {
      cleanResults.push(res);
    }
  });
  if (multiRun) {
    console.log("\n");
    if (cleanResults.length) {
      let sum = _.reduce(_.pluck(cleanResults, 'time'), function(m, n) { return m + n; }, 0);
      let avg = sum / cleanResults.length;
      let startSum = _.reduce(_.pluck(cleanResults, 'startupTime'), function(m, n) { return m + n; }, 0);
      let startAvg = startSum / cleanResults.length;
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
        if (res.sessionId) {
          console.log("https://saucelabs.com/tests/" + res.sessionId);
        }
        console.log("----------------");
        console.log(res.stack);
      }
    });
  }
}
