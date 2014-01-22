var request = require('monocle-request')
  , monocle = require('monocle-js')
  , o_O = monocle.o_O
  , o_C = monocle.callback
  , should = require('should');

var test_urls = {
	jasmine: "https://saucelabs.com/test_helpers/front_tests/index.html"
	, qunit: "https://saucelabs.com/test_helpers/front_tests/qunit.html"
	, mocha: "https://saucelabs.com/test_helpers/front_tests/mocha.html"
	, 'yui test': "http://saucelabs.com/test_helpers/front_tests/yui.html"
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
        name: caps.name + ' - ' + opts.framework,
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

    var res;
	do {
		res = yield request(requestParams);

		var testInfo = res[1]['js tests'][0];

		if (testInfo.status == "test error"){
			console.log('test error', testInfo.url)
			return false;
		} 
		
	} while(yield monocle.utils.sleep(5 * 1000), !res[1].completed);

	return testInfo.result.passed;

});

var run = o_O(function*(driver, caps, opts){
	
	var testId = yield runTest(caps, opts);

	var passed = yield pollStatus(testId, opts);

	if (passed){
		console.log('- Reporting pass');
	} else {
		console.log('- Reporting failure');
	}
});



module.exports.run = run;