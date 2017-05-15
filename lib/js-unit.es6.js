import request from 'request';
import _ from 'lodash';
import Q from 'q';
import { sleep } from 'asyncbox';

const asyncRequest = _.partial(Q.nfcall, request);

const testUrls = {
  jasmine: "https://saucelabs.com/test_helpers/front_tests/index.html"
  , qunit: "https://saucelabs.com/test_helpers/front_tests/qunit.html"
  , mocha: "https://saucelabs.com/test_helpers/front_tests/mocha.html"
  , 'yui test': "http://saucelabs.com/test_helpers/front_tests/yui.html"
};

async function runTest (caps, opts) {
  const restEndpoint = opts.jsRestEndpoint;
  const requestParams = {
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
  const response = await asyncRequest(requestParams);
  return response[1]['js tests'][0];
}

async function pollStatus (testId, opts) {
  const requestParams = {
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

  let res, testInfo;
  do {
    await sleep(500); // better to wait an extra 500ms before the first poll,
                      // than wait an extra 500ms after the last poll!
    res = await asyncRequest(requestParams);
    testInfo = res[1]['js tests'][0];
    if (testInfo.status == "test error") {
      return false;
    }
  } while(!res[1].completed);

  return testInfo.result.passed;
}

export async function run (driver, caps, opts) {
  let testId = await runTest(caps, opts);
  let passed = await pollStatus(testId, opts);
  if (!passed) {
    throw new Error("JS Unit test failed");
  }
}
