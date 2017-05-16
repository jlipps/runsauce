let opts = {c: 'prod', u: 'appium-ios-stability-%t', n: 50,
            name: 'Appium iOS stability matrix', r: 10};
let basicTestOpts = {};
let appiumVers = ['1.4.16', '1.5.3', '1.6.0'];
let iosVers = ['8.4|a<=1.5.3', '9.0|a<=1.5.3', '9.1|a<=1.5.3', '9.2|a<=1.5.3', '9.3|a>=1.5.3', '10.0|a>=1.6.0'];
basicTestOpts.a = appiumVers;
basicTestOpts.v = iosVers;
basicTestOpts.t = ['ios', 'web_guinea'];
basicTestOpts.d = ['ip'];
//basicTestOpts.e = '{"prevent-requeue": false}';
opts.tests = [basicTestOpts];

module.exports = opts;
