"use strict";
var request = require('monocle-request')
  , monocle = require('monocle-js')
  , o_O = monocle.o_O;

var testUrls = {
  jasmine: "https://saucelabs.com/test_helpers/front_tests/index.html"
  , qunit: "https://saucelabs.com/test_helpers/front_tests/qunit.html"
  , mocha: "https://saucelabs.com/test_helpers/front_tests/mocha.html"
  , 'yui test': "http://saucelabs.com/test_helpers/front_tests/yui.html"
};

var runTest = o_O(function*(caps, opts) {
  var restEndpoint = opts.jsRestEndpoint;
  var requestParams = {
    method: 'post',
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
      name: caps.name + ' - ' + opts.framework,
    }
  };
  var response = yield request(requestParams);
  return response[1]['js tests'][0];
});

var pollStatus = o_O(function*(testId, opts) {
  var requestParams = {
    method: 'post',
    url: opts.jsRestEndpoint + '/status',
    auth: {
      user: opts.userName,
      pass: opts.accessKey
    },
    json: true,
    body: {
      "js tests": [testId]
    }
  };

  var res, testInfo;
  do {
    yield monocle.utils.sleep(500); //better to wait an extra 500ms before the first poll, than wait an extra 500ms after the last poll!
    res = yield request(requestParams);
    testInfo = res[1]['js tests'][0];
    if (testInfo.status == "test error") {
      return false;
    }
  } while(!res[1].completed);

  return testInfo.result.passed;
});

var run = o_O(function*(driver, caps, opts) {
  var testId = yield runTest(caps, opts);
  var passed = yield pollStatus(testId, opts);
  if (!passed) {
    throw new Error("JS Unit test failed");
  }
});



module.exports.run = run;
