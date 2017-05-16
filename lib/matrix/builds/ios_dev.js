let opts = {c: 'dev', u: 'appium-ios-matrix-%t', n: 2,
            name: 'Appium iOS support matrix'};
let basicTestOpts = {};
let deviceTestOpts = {};
let appiumVers = ['1.5.0-beta'];
//let iosVers = ['6.1', '7.0', '7.1', '8.0|a>=1.3.1', '8.1|a>=1.3.1',
               //'8.2|a>=1.3.6'];
//let iosVers = ['6.1|a<=1.4.16', '7.0|a<=1.4.16', '7.1', '8.0', '8.1', '8.2', '8.3', '8.4', '9.0', '9.1', '9.2'];
let iosVers = ['8.0', '8.1', '8.2', '8.3', '8.4', '9.0', '9.1', '9.2'];
basicTestOpts.a = deviceTestOpts.a = appiumVers;
basicTestOpts.r = deviceTestOpts.r = 2;
basicTestOpts.v = deviceTestOpts.v = iosVers;
basicTestOpts.t = deviceTestOpts.t = ['ios', 'web_guinea', 'ios_loc_serv',
                                      'web_fraud'];
//basicTestOpts.d = ['ip', 'ipa'];
basicTestOpts.d = ['ip'];
//deviceTestOpts.d = ['iPhone Retina (3.5-inch)|v=7.0', 'iPhone 5s|v=7.1',
                    //'iPad 2|v=7.1', 'iPhone 6 Plus|v>=8.0',
                    //'iPad Air|v>=8.0'];
deviceTestOpts.d = ['iPhone 6 Plus', 'iPad Air'];
//opts.tests = [basicTestOpts, deviceTestOpts];
opts.tests = [basicTestOpts];

module.exports = opts;
