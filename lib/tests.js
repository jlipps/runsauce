"use strict";

var tests = {}
  , monocle = require('monocle-js')
  , o_O = monocle.o_O
  , localServer = require('./localserver.js')
  , jsUnit = require('./js-unit');

require('should');

var isAppium1 = function(caps) {
  return caps.appiumVersion && parseFloat(caps.appiumVersion) >= 1;
};

var start = o_O(function*(driver, caps) {
  var startTime = Date.now();
  yield driver.init(caps);
  yield driver.setImplicitWaitTimeout(15000);
  return (Date.now() - startTime);
});

tests.webTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  yield driver.get("http://google.com");
  (yield driver.title()).should.include("Google");
  return startupTime;
});

tests.longWebTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  for (var i = 0; i < 10; i++) {
    yield driver.get("http://google.com");
    (yield driver.title()).should.include("Google");
    yield driver.sleep(2000);
  }
  return startupTime;
});

var localTest = o_O(function*(driver, caps, url) {
  localServer.run();
  var startupTime;
  try {
    startupTime = yield start(driver, caps);
    yield driver.get(url);
    var h1 = yield driver.elementByTagName('h1');
    (yield h1.text()).should.include("the server of awesome");
  } catch (e) {
    yield localServer.stop();
    throw e;
  }
  yield localServer.stop();
  return startupTime;
});

tests.webTestConnect = o_O(function*(driver, caps) {
  return (yield localTest(driver, caps, "http://localhost:8000"));
});

tests.webTestLocalName = o_O(function*(driver, caps, opts) {
  var host = opts.localname;
  if (host === "" || host === "localhost" || host.indexOf(".local") === -1) {
    throw new Error("Can't run local name test without an interesting hostname");
  }
  return (yield localTest(driver, caps, "http://" + host + ":8000"));
});

tests.webTestHttps = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  yield driver.get("https://buildslave.saucelabs.com");
  (yield driver.title()).should.include("Sauce Labs");
  return startupTime;
});

tests.webTestHttpsSelfSigned = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  yield driver.get("https://selfsigned.buildslave.saucelabs.com");
  (yield driver.title()).should.include("Sauce Labs");
  return startupTime;
});

tests.iosTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  var appium1 = isAppium1(caps);
  var fs;
  if (appium1) {
    fs = yield driver.elementsByClassName('UIATextField');
  } else {
    fs = yield driver.elementsByTagName('textField');
  }
  yield fs[0].sendKeys('4');
  yield fs[1].sendKeys('5');
  if (appium1) {
    yield driver.elementByClassName("UIAButton").click();
  } else {
    yield driver.elementByTagName("button").click();
  }
  var text;
  if (appium1) {
    text = yield driver.elementByClassName('UIAStaticText').text();
  } else {
    text = yield driver.elementByTagName('staticText').text();
  }
  text.should.equal('9');
  return startupTime;
});

tests.iosHybridTest = o_O(function*(driver, caps) {
  if (!isAppium1(caps)) {
    throw new Error("Hybrid test only works with Appium 1 caps");
  }
  var startupTime = yield start(driver, caps);
  var ctxs = yield driver.contexts();
  ctxs.length.should.be.above(0);
  yield driver.context(ctxs[ctxs.length - 1]);
  yield driver.get("http://google.com");
  (yield driver.title()).should.include("Google");
  yield driver.context(ctxs[0]);
  (yield driver.source()).should.include("<AppiumAUT>");
  return startupTime;
});

tests.androidTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  yield androidCycle(driver, caps);
  return startupTime;
});

tests.androidLongTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  for (var i = 0; i < 15; i++) {
    yield androidCycle(driver, caps);
  }
  return startupTime;
});

var androidCycle = o_O(function*(driver, caps) {
  var appium1 = isAppium1(caps);
  if (appium1) {
    yield driver.elementByAccessibilityId("Add Contact").click();
  } else {
    yield driver.elementByName("Add Contact").click();
  }
  var fs;
  if (appium1) {
    fs = yield driver.elementsByClassName("android.widget.EditText");
  } else {
    fs = yield driver.elementsByTagName("textfield");
  }
  yield fs[0].sendKeys("My Name");
  yield fs[2].sendKeys("someone@somewhere.com");
  "My Name".should.equal(yield fs[0].text());
  "someone@somewhere.com".should.equal(yield fs[2].text());
  yield driver.back();
  yield driver.sleep(2);
  var text;
  if (appium1) {
    text = yield driver.elementByClassName("android.widget.Button").text();
  } else {
    text = yield driver.elementByTagName("button").text();
  }
  text.should.equal("Add Contact");
  var cb;
  if (appium1) {
    cb = yield driver.elementByXPath("//android.widget.CheckBox");
  } else {
    cb = yield driver.elementByXPath("//checkBox");
  }
  yield cb.click();
  "Show Invisible Contacts (Only)".should.equal(yield cb.text());
});

tests.selendroidTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  yield driver.elementById("buttonStartWebView").click();
  yield driver.elementByClassName("android.webkit.WebView");
  yield driver.window("WEBVIEW");
  yield driver.sleep(6);
  var f = yield driver.elementById("name_input");
  // TODO: uncomment following line when selendroid fixes #492
  //yield f.clear();
  yield f.sendKeys("Test string");
  (yield f.getAttribute('value')).should.include("Test string");
  yield driver.elementByCss("input[type=submit]").click();
  yield driver.sleep(3);
  "This is my way of saying hello".should
    .equal(yield driver.elementByTagName("h1").text());
  return startupTime;
});

tests.androidHybridTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  yield driver.sleep(3);
  var ctxs = yield driver.contexts();
  yield driver.context(ctxs[ctxs.length - 1]);
  var el = yield driver.elementById('i_am_a_textbox');
  yield el.clear();
  yield el.type("Test string");
  "Test string".should.equal(yield el.getAttribute('value'));
  return startupTime;
});

tests.jsTest = o_O(function*(driver, caps, opts){
  yield jsUnit.run(driver, caps, opts);
  return 0;
});

module.exports = tests;
