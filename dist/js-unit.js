"use strict";

var request = require("monocle-request"),
    monocle = require("monocle-js"),
    o_O = monocle.o_O;

var testUrls = {
  jasmine: "https://saucelabs.com/test_helpers/front_tests/index.html",
  qunit: "https://saucelabs.com/test_helpers/front_tests/qunit.html",
  mocha: "https://saucelabs.com/test_helpers/front_tests/mocha.html",
  "yui test": "http://saucelabs.com/test_helpers/front_tests/yui.html"
};

var runTest = o_O(regeneratorRuntime.mark(function callee$0$0(caps, opts) {
  var restEndpoint, requestParams, response;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        restEndpoint = opts.jsRestEndpoint;
        requestParams = {
          method: "post",
          url: restEndpoint,
          auth: {
            user: opts.userName,
            pass: opts.accessKey
          },
          json: true,
          body: {
            platforms: [[caps.platform, caps.browserName, caps.version]],
            url: testUrls[opts.framework],
            framework: opts.framework,
            name: caps.name + " - " + opts.framework }
        };
        context$1$0.next = 4;
        return request(requestParams);

      case 4:
        response = context$1$0.sent;
        return context$1$0.abrupt("return", response[1]["js tests"][0]);

      case 6:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

var pollStatus = o_O(regeneratorRuntime.mark(function callee$0$1(testId, opts) {
  var requestParams, res, testInfo;
  return regeneratorRuntime.wrap(function callee$0$1$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        requestParams = {
          method: "post",
          url: opts.jsRestEndpoint + "/status",
          auth: {
            user: opts.userName,
            pass: opts.accessKey
          },
          json: true,
          body: {
            "js tests": [testId]
          }
        };

      case 1:
        context$1$0.next = 3;
        return monocle.utils.sleep(500);

      case 3:
        context$1$0.next = 5;
        return request(requestParams);

      case 5:
        res = context$1$0.sent;

        testInfo = res[1]["js tests"][0];

        if (!(testInfo.status == "test error")) {
          context$1$0.next = 9;
          break;
        }

        return context$1$0.abrupt("return", false);

      case 9:
        if (!res[1].completed) {
          context$1$0.next = 1;
          break;
        }

      case 10:
        return context$1$0.abrupt("return", testInfo.result.passed);

      case 11:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$1, this);
}));

var run = o_O(regeneratorRuntime.mark(function callee$0$2(driver, caps, opts) {
  var testId, passed;
  return regeneratorRuntime.wrap(function callee$0$2$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return runTest(caps, opts);

      case 2:
        testId = context$1$0.sent;
        context$1$0.next = 5;
        return pollStatus(testId, opts);

      case 5:
        passed = context$1$0.sent;

        if (passed) {
          context$1$0.next = 8;
          break;
        }

        throw new Error("JS Unit test failed");

      case 8:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$2, this);
}));

module.exports.run = run;
//better to wait an extra 500ms before the first poll, than wait an extra 500ms after the last poll!