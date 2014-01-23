"use strict";

var tests = {}
  , monocle = require('monocle-js')
  , o_O = monocle.o_O
  , localServer = require('./localserver.js')
  , should = require('should')
  , jsUnit = require('./js-unit');

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

var localTest = o_O(function*(driver, caps, url) {
  localServer.run();
  try {
    var startupTime = yield start(driver, caps);
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

tests.webTestLocalName = o_O(function*(driver, caps, host) {
  if (host === "" || host === "localhost" || host.indexOf(".local") !== -1) {
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
  var fs = yield driver.elementsByTagName('textField');
  yield fs[0].sendKeys('4');
  yield fs[1].sendKeys('5');
  yield driver.elementByTagName("button").click();
  '9'.should.equal(yield driver.elementByTagName('staticText').text());
  return startupTime;
});

tests.androidTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  yield androidCycle(driver);
  return startupTime;
});

tests.androidLongTest = o_O(function*(driver, caps) {
  var startupTime = yield start(driver, caps);
  for (var i = 0; i < 15; i++) {
    yield androidCycle(driver);
  }
  return startupTime;
});

var androidCycle = o_O(function*(driver) {
  yield driver.elementByName("Add Contact").click();
  var fs = yield driver.elementsByTagName("textfield");
  yield fs[0].sendKeys("My Name");
  yield fs[2].sendKeys("someone@somewhere.com");
  "My Name".should.equal(yield fs[0].text());
  "someone@somewhere.com".should.equal(yield fs[2].text());
  yield driver.back();
  yield driver.sleep(2);
  "Add Contact".should.equal(yield driver.elementByTagName("button").text());
  var cb = yield driver.elementByXPath("//checkBox");
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
  yield f.clear();
  yield f.sendKeys("Test string");
  "Test string".should.equal(yield f.getAttribute('value'));
  yield driver.elementByCss("input[type=submit]").click();
  yield driver.sleep(3);
  "This is my way of saying hello".should
    .equal(yield driver.elementByTagName("h1").text());
  return startupTime;
});

tests.jsTest = o_O(function*(driver, caps, opts){
  yield jsUnit.run(driver, caps, opts);
  return 0;
});

module.exports = tests;
