const _ = require('lodash');
const { testsMap } = require('./parser');

const NATIVE_TESTS = [
  "appium", "ios", "android", "android_long", "android_load", "selendroid", "android_hybrid",
  "ios_hybrid", "ios_loc_serv", "ios_iwd", "ios_sk", "ios_animation_performance"
];

const APPS = {
  'iOS61': 'http://appium.s3.amazonaws.com/TestApp6.1.app.zip',
  'iOS7': 'http://appium.s3.amazonaws.com/TestApp7.0.app.zip',
  'iOS71': 'http://appium.s3.amazonaws.com/TestApp7.1.app.zip',
  'iOS102': 'http://appium.s3.amazonaws.com/TestApp10.2.app.zip',
  'iOSHybrid6': 'http://appium.s3.amazonaws.com/WebViewApp6.1.app.zip',
  'iOSHybrid7': 'http://appium.s3.amazonaws.com/WebViewApp7.1.app.zip',
  'iOSHybrid102': 'http://appium.s3.amazonaws.com/WebViewApp10.2.app.zip',
  'iOSHybridWK': 'http://appium.s3.amazonaws.com/FLWebView.app.zip',
  'Android': 'http://appium.s3.amazonaws.com/ContactManager.apk',
  'Android9': 'http://appium.s3.amazonaws.com/ContactManager9.apk',
  'AndroidHybrid': 'http://appium.s3.amazonaws.com/ApiDemos-debug-2015-03-19.apk',
  'AndroidLoad': 'http://appium.s3.amazonaws.com/stressapptest.apk',
  'Selendroid': 'http://appium.s3.amazonaws.com/selendroid-test-app-0.7.0.apk',
  'iOSAnimationPerformance': 'https://www.dropbox.com/s/9fs5551h92gowrv/iOS-Performance.zip?dl=1'
};

const WEB_TESTS = [
  "https", "selfsigned", "connect", "localname", "web_long", "web",
  "web_guinea", "web_fraud", "manual"
];

// given a testSpec from the runner, get a set of caps
function getCaps (testSpec, eventTimings = false) {
  // set up initial caps which we will fix up or override later
  let caps = {
    browserName: testSpec.browser,
    version: testSpec.version.toString(),
    platform: testSpec.platform,
    newCommandTimeout: 3 * 60 * 1000, // Bump newCommandTimeout to 3 minutes
    autoGrantPermissions: true
  };

  // now set up more caps which we don't want on the caps object at all if
  // they're not truthy
  if (eventTimings) {
    caps.eventTimings = true;
  }
  if (testSpec.orientation) {
    caps['device-orientation'] = testSpec.orientation;
  }
  if (testSpec.device) {
    caps.device = testSpec.device;
  }

  // fix up the caps based on all kinds of horrendous logic to do with varying
  // requirements for different tests, platforms, and versions
  fixCaps(testSpec, caps);

  // give ourselves a nice name that's easily readable on Sauce
  caps.name = getTestName(testsMap[testSpec.test], caps);

  // 'extraCaps' are raw caps parsed from JSON entered on the command line, so
  // we can just extend them onto caps, allowing them to override existing caps
  if (testSpec.extraCaps) {
    _.extend(caps, testSpec.extraCaps);
  }
  return caps;
}

function fixCaps (testSpec, caps) {
  // ensure that versions all look like X.Y(.Z) for later parsing
  if (caps.version && caps.version.toString().indexOf('.') === -1) {
    caps.version = caps.version.toString() + ".0";
  }
  // if we have a device param, or know that we're running a native test, then
  // we know we're using appium so fix up caps according to appium regulations
  if (caps.device || _.includes(NATIVE_TESTS, testSpec.test)) {
    fixAppiumCaps(testSpec, caps);
  }

  // by default, prevent requeue of Sauce VMs so we don't get a falsely
  // positive picture of how well our tests are doing
  caps['prevent-requeue'] = true;
}


function fixAppiumCaps (testSpec, caps) {
  // if we're running a selfsigned test, make sure we tell appium to keep the
  // keychains
  if (testSpec.test.toLowerCase() === "selfsigned") {
    caps.keepKeyChains = true;
  }

  // check for some basic error conditions
  let appiumVer = parseFloat(testSpec.backendVersion) || null;
  if (!appiumVer) {
    throw new Error("You're trying to run an Appium test but didn't set an " +
                    "Appium version with the backendVersion parameter. We " +
                    "need that set in order to determine correct capabilities.");
  }
  if (appiumVer < 1.0) {
    throw new Error("RunSauce only supports Appium 1+");
  }

  caps.appiumVersion = testSpec.backendVersion.toString();
  if (testSpec.automationName) {
    caps.automationName = testSpec.automationName;
  }
  if (/^\d$/.test(caps.appiumVersion)) {
    // ensure the appium version is validly formed
    caps.appiumVersion += ".0";
  }
  let tt = testSpec.test.toLowerCase();
  if (_.includes(NATIVE_TESTS, tt)) {
    // if we're running a native test, ensure browserName is not set otherwise
    // this will cause confusion for Sauce
    caps.browserName = '';
  }

  // Appium uses SE3-style capabilities, not SE2-style caps, so massage these
  // into their correct names. platformName is set further below.
  delete caps.platform;
  caps.deviceName = caps.device;
  delete caps.device;
  caps.platformVersion = caps.version;
  delete caps.version;
  // Set a default deviceName based on test type, if it wasn't included
  if (!caps.deviceName) {
    if (tt.indexOf('ios') === 0) {
      caps.deviceName = 'iPhone Simulator';
    } else {
      caps.deviceName = 'Android Emulator';
    }
  }
  // If we're running a local Appium test, ensure we give ourselves a nice high
  // launch timeout (mostly for old Instruments-based tests)
  if (!testSpec.onSauce) {
    caps.launchTimeout = 35000;
  }

  // Prepare platform-specific caps for iOS or Android
  if (caps.deviceName[0].toLowerCase() === 'i') {
    fixAppiumIosCaps(caps, tt);
  } else {
    fixAppiumAndroidCaps(caps, tt);
  }

  // If we want a web test, ensure browserName is specified appropriately for
  // the platform
  if (_.includes(WEB_TESTS, tt) && !caps.browserName) {
    if (caps.platformName === "iOS") {
      caps.browserName = "safari";
    } else {
      caps.browserName = "chrome";
    }
  }

  // for iOS web tests, give ourselves a generous webview connection retry
  if (_.includes(WEB_TESTS, tt) && caps.platformName === "iOS") {
    caps.webviewConnectRetries = 10;
  }
}

function fixAppiumIosCaps (caps, tt) {
  caps.platformName = 'iOS';
  // set a default platformVersion
  if (!caps.platformVersion) {
    caps.platformVersion = '10.2';
  }
  if (tt === 'ios_animation_performance') {
    caps.app = APPS.iOSAnimationPerformance;
  } else if (_.includes(["ios", "ios_loc_serv", "ios_iwd", "ios_sk"], tt)) {
    // choose which native app to use based on platformVersion
    if (parseFloat(caps.platformVersion) >= 10.2) {
      caps.app = APPS.iOS102;
    } else {
      caps.app = APPS.iOS71;
    }
  } else if (tt === "ios_hybrid") {
    // otherwise we have a hybrid app
    caps.app = APPS.iOSHybridWK;
  }
}

function fixAppiumAndroidCaps (caps, tt) {
  caps.platformName = 'Android';
  // set up default platformVersion
  if (!caps.platformVersion) {
    caps.platformVersion = '5.0';
  }
  // set up android-specific caps based on test type
  if (_.includes(["android", "android_long"], tt)) {
    if (parseInt(caps.platformVersion, 10) >= 9) {
      caps.app = APPS.Android9;
    } else {
      caps.app = APPS.Android;
    }
  } else if (tt === 'android_load') {
    caps.app = APPS.AndroidLoad;
    caps.deviceName = 'Android GoogleApi Emulator'
    caps.platformVersion = '7.1'
  } else if (tt === 'android_hybrid') {
    caps.appActivity = '.view.WebView1';
    caps.app = APPS.AndroidHybrid;
    if (parseFloat(caps.platformVersion) < 4.4) {
      caps.automationName = 'Selendroid';
    }
  }
  if (tt === 'selendroid') {
    caps.automationName = 'Selendroid';
    caps.app = APPS.Selendroid;
  }
}

function getTestName (test, caps) {
  let platform = caps.platform || caps.platformName || '(platform unspecified)';
  let version = caps.version || caps.platformVersion || '(version unspecified)';
  let browser = caps.browserName || caps.deviceName || '(browser unspecified)';
  if (caps.browserName && caps.deviceName) {
    browser = `${caps.browserName} on ${caps.deviceName}`;
  }
  if (!caps.deviceName) {
    return `${test} (${browser} ${version} on ${platform})`;
  }
  return `${test} (${browser} on ${platform} ${version})`;
}

module.exports = { getCaps };
