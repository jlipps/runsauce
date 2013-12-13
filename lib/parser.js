"use strict";

var optimist = require('optimist')
  , os = require('os')
  , _ = require('underscore');

var browserMap = {
  's': 'Safari'
  , 'c': 'Chrome'
  , 'i': 'Internet Explorer'
  , 'ie': 'Internet Explorer'
  , 'ip': 'iPhone'
  , 'ipa': 'iPad'
  , 'a': 'Android'
};

var platformMap = {
  'w': 'Windows 2012',
  'w12': 'Windows 2012',
  'w8': 'Windows 2008',
  'wx': 'Windows XP',
  'm': 'Mac 10.9',
  'm9': 'Mac 10.9',
  'm8': 'Mac 10.8',
  'm6': 'Mac 10.6',
  'l': 'Linux'
};

var deviceMap = {
  'ip': 'iPhone Simulator'
  , 'ipa': 'iPad Simulator'
  , 'a': 'Android'
  , 'ae': 'Android Emulator'
};

var shortcutHelp = function() {
  var t = "All the options have nice shortcuts:\n\n";
  var shortcutTypes = {
    'Platforms (-p)': platformMap
    , 'Browsers (-b)': browserMap
    , 'Devices (-d)': deviceMap
  };
  _.each(shortcutTypes, function(map, type) {
    t += type + ":\n";
    _.each(map, function(long, short) {
      t += short + ": " + long + "\n";
    });
    t += "\n";
  });
  t += "So you could do:\n";
  t += "> runsauce -t selfsigned -p m9 -b s -v 7\n";
  t += "To run the selfsigned test on OS X 10.9, Safari 7\n";
  return t;
};

var testsHelp = function() {
  var t = "Here are the available test types:\n\n";
  t += "web:        Basic web test (default)\n";
  t += "https:      Basic web test of https site\n";
  t += "selfsigned: Basic web test of self-signed https site\n";
  t += "connect:    Basic web test of locally hosted site\n";
  t += "localname:  Basic web test of locally hosted site with custom name\n";
  t += "appium:     Basic mobile native test\n";
  return t;
};

module.exports = function() {
  var optimistObj = optimist
    .options('c', {
      alias: 'config',
      default: 'prod',
      describe: 'Config key to use',
      demand: true
    })
    .options('t', {
      alias: 'test',
      default: 'web',
      describe: 'What kind of test to run',
      demand: true
    })
    .options('b', {
      alias: 'browser',
      default: 'Chrome',
      describe: 'Web browser',
      demand: true
    })
    .options('d', {
      alias: 'device',
      describe: 'Mobile device',
      demand: false
    })
    .options('p', {
      alias: 'platform',
      default: '',
      describe: 'Operating system',
      demand: false
    })
    .options('v', {
      alias: 'version',
      default: '',
      describe: 'Browser/device version',
      demand: false
    })
    .options('w', {
      alias: 'wait',
      default: false,
      describe: 'Wait to call driver.quit()',
      demand: false
    })
    .options('l', {
      alias: 'localname',
      default: os.hostname(),
      describe: 'What to call "localhost" in connect tests',
      demand: true
    })
    .options('?', {
      alias: 'help',
      describe: 'Show this help',
      demand: false
    })
    .options('s', {
      alias: 'shortcuts',
      describe: 'Show all the shortcuts',
      demand: false
    })
    .options('tests', {
      describe: 'Show all the test types',
      demand: false
    })
    .boolean(['setup', 'wait', 'help', 'shortcuts', 'tests']);


  var args = optimistObj.argv;
  if (args.help) {
    var helpText = optimistObj.help();
    helpText += "\n(To see all the shortcuts, run with --shortcuts)\n";
    helpText += "\n(To see all the test types, run with --tests)\n";
    console.error(helpText);
    process.exit(0);
  }

  if (args.shortcuts) {
    console.log(shortcutHelp());
    process.exit(0);
  }

  if (args.tests) {
    console.log(testsHelp());
    process.exit(0);
  }

  // allow browser shortcuts
  var browser = args.b.toLowerCase();
  if (_.has(browserMap, browser)) {
    args.b = args.browser = browserMap[browser];
  }

  // allow platform shortcuts
  var plat = args.p.toLowerCase();
  if (_.has(platformMap, plat)) {
    args.p = args.platform = platformMap[plat];
  }

  if (args.d) {
    // allow device shortcuts
    var device = args.d.toLowerCase();
    if (_.has(deviceMap, device)) {
      args.d = args.device = deviceMap[device];
    }
  }

  return args;
};
