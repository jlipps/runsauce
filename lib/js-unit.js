var request = require('monocle-request')
  , monocle = require('monocle-js')
  , o_O = monocle.o_O
  , o_C = monocle.callback
  , should = require('should');

var test_urls = {
	jasmine: "https://saucelabs.com/test_helpers/front_tests/index.html"
	, qunit: "https://jonahss.dev.saucelabs.net/test_helpers/front_tests/qunit.html"
	, mocha: "https://jonahss.dev.saucelabs.net/test_helpers/front_tests/mocha.html"
	, 'yui test': "https://jonahss.dev.saucelabs.net/test_helpers/front_tests/yui.html"
}

var runTest = o_O(function*(caps, opts){
	var rest_endpoint = opts.js_rest_endpoint;
	var requestParams = {
      method: 'post',
      url: rest_endpoint,
      auth: {
        user: opts.userName,
        pass: opts.accessKey
      },
      json: true,
      body: {
        platforms: [[caps.platform, caps.browserName, caps.version]],
        url: test_urls[opts.framework],
        framework: opts.framework,
        name: caps.name,
      }
    };

	var response = yield request(requestParams)

	return response[1]['js tests'][0];
});

var pollStatus = o_O(function*(testId, opts){

	var requestParams = {
      method: 'post',
      url: opts.js_rest_endpoint + '/status',
      auth: {
        user: opts.userName,
        pass: opts.accessKey
      },
      json: true,
      body: {
        "js tests": [testId]
      }
    };

	var checkStatus = o_O(function*(){

		var res = yield request(requestParams);

		var testInfo = res[1]['js tests'][0];

		if (testInfo.status == "test error"){
			console.log('test error', testInfo.url)
		} 

		if (!res[1].completed){
			yield monocle.utils.sleep(10 * 1000);
			return yield checkStatus(requestParams);
		} else {
			return testInfo;
		}

	});

	var testInfo = yield checkStatus();

	return testInfo.result.passed;
});

var run = o_O(function*(driver, caps, opts){
	
	var testId = yield runTest(caps, opts);

	var passed = yield pollStatus(testId, opts);

	passed.should.equal(true)
});



module.exports.run = run;