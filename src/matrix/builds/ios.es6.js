let opts = {c: 'prod', u: 'appium-ios-matrix-%t', n: 20,
            name: 'Appium iOS support matrix'};
let basicTestOpts = {};
let deviceTestOpts = {};
let appiumVers = ['1.0.0', '1.1.0', '1.2.4', '1.3.6', '1.3.7', '1.4.0-beta'];
let iosVers = ['6.1', '7.0', '7.1', '8.0|a>=1.3.1', '8.1|a>=1.3.1',
               '8.2|a>=1.3.6'];
basicTestOpts.a = deviceTestOpts.a = appiumVers;
basicTestOpts.r = deviceTestOpts.r = 1;
basicTestOpts.v = deviceTestOpts.v = iosVers;
basicTestOpts.t = ['ios', 'web_guinea', 'selfsigned', 'connect', 'ios_loc_serv'];
basicTestOpts.d = ['ip', 'ipa'];
deviceTestOpts.t = ['web_guinea', 'ios_loc_serv'];
deviceTestOpts.d = ['iPhone Retina (3.5-inch)|v=7.0', 'iPhone 5s|v=7.1',
                    'iPad 2|v=7.1', 'iPhone 6 Plus|v>=8.0',
                    'iPad Air|v>=8.0'];
opts.tests = [basicTestOpts, deviceTestOpts];

export default opts;
