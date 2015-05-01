let opts = {c: 'prod', u: 'appium-android-matrix-%t', n: 20,
            name: "Appium Android support matrix"};
let androidWebTestOpts = {};
let androidTestOpts = {};
let appiumVers = ['1.0.0', '1.1.0', '1.2.4', '1.3.6', '1.3.7', '1.4.0'];
androidTestOpts.a = androidWebTestOpts.a = appiumVers;
androidTestOpts.r = 1;
let androidVers = ['2.3', '4.0', '4.1', '4.2', '4.3', '4.4', '5.0', '5.1'];
androidWebTestOpts.v = androidTestOpts.v = androidVers;
androidWebTestOpts.t = ['web_guinea|v>=4.4', 'selfsigned|v>=4.4', 'connect|v>=4.4'];
androidWebTestOpts.d = ['ae', 'Samsung Galaxy S4 Device|v=4.4', 'Samsung Galaxy S5 Device|v=4.4'];
androidWebTestOpts.b = ['b|d=ae', 'c|d!=ae'];
androidTestOpts.t = ['android|v>=4.2', 'android_hybrid|v>=4.4', 'selendroid'];
androidTestOpts.d = ['ae', 'Samsung Galaxy S4 Emulator|v>=4.2|v<=4.4', 'Samsung Galaxy S4 Device|v=4.3',
                     'Samsung Galaxy S4 Device|v=4.4', 'Samsung Galaxy S5 Device|v=4.4'];
opts.tests = [androidTestOpts, androidWebTestOpts];

export default opts;
