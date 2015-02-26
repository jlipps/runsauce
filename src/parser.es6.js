import optimist from 'optimist';
import os from 'os';
import _ from 'lodash';

const browserMap = {
  's': 'Safari'
  , 'b': 'Browser'
  , 'c': 'Chrome'
  , 'i': 'Internet Explorer'
  , 'ie': 'Internet Explorer'
  , 'ip': 'iPhone'
  , 'ipa': 'iPad'
  , 'a': 'Android'
};

const platformMap = {
  'w': 'Windows 2012',
  'w12': 'Windows 2012',
  'w8': 'Windows 2008',
  'wx': 'Windows XP',
  'm': 'Mac 10.10',
  'm10': 'Mac 10.10',
  'm9': 'Mac 10.9',
  'm8': 'Mac 10.8',
  'm6': 'Mac 10.6',
  'l': 'Linux',
  's': 'SquirrelOS'
};

const testFrameworkMap = {
  'j': 'jasmine',
  'q': 'qunit',
  'm': 'mocha',
  'y': 'yui test',
  'c': 'custom'
};

const deviceMap = {
  'ip': 'iPhone Simulator'
  , 'ipa': 'iPad Simulator'
  , 'a': 'Android'
  , 'ae': 'Android Emulator'
};

const orientationMap = {
  'p': 'portrait'
, 'l': 'landscape'
};

let shortcutHelp = function () {
  let t = "All the options have nice shortcuts:\n\n";
  const shortcutTypes = {
    'Platforms (-p)': platformMap
    , 'Browsers (-b)': browserMap
    , 'Devices (-d)': deviceMap
    , 'JS Test Framework (-f)': testFrameworkMap
    , 'Orientations': orientationMap
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

const testsMap = {
  web: "Basic web test (default)",
  web_long: "Longer basic web test",
  https: "Basic web test of https site",
  selfsigned: "Basic web test of self-signed https site",
  connect: "Basic web test of locally hosted site",
  localname: "Basic web test of locally hosted site with custom name",
  ios: "Basic ios native test",
  ios_hybrid: "Basic ios hybrid test",
  android: "Basic android native test",
  android_long: "Long android native test",
  android_hybrid: "Basic appium hybrid test",
  selendroid: "Basic selendroid hybrid test",
  js: "Basic js unit test"
};

let testsHelp = function() {
  let t = "Here are the available test types:\n\n";
  _.each(module.exports.testsMap, function(test, type) {
    t += type + ": " + test + "\n";
  });
  return t;
};

export function parse () {
  let optimistObj = optimist
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
    .options('f', {
      alias: 'framework',
      default: 'custom',
      describe: 'JS Test Framework',
      demand: false
    })
    .options('v', {
      alias: 'version',
      default: '',
      describe: 'Browser/device version',
      demand: false
    })
    .options('a', {
      alias: 'backendVersion',
      default: '',
      describe: 'Selenium/Appium version',
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
    .options('o', {
      alias: 'orientation',
      default: '',
      describe: 'Device orientation',
      demand: false
    })
    .options('r', {
      alias: 'runs',
      default: 1,
      describe: 'How many times to run this test',
      demand: false
    })
    .options('n', {
      alias: 'processes',
      default: 1,
      describe: 'How many parallel threads to run tests in',
      demand: false
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
    .options('i', {
      alias: 'testfile',
      describe: 'JSON file containing run specs',
      demand: false
    })
    .options('tests', {
      describe: 'Show all the test types',
      demand: false
    })
    .options('z', {
      alias: 'verbose',
      describe: 'Show more logging',
      demand: false
    })
    .options('u', {
      alias: 'build',
      describe: 'Sauce build id',
      demand: false
    })
    .boolean(['setup', 'wait', 'help', 'shortcuts', 'tests', 'verbose']);


  let args = optimistObj.argv;
  if (args.help) {
    let helpText = optimistObj.help();
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

  mapArgs(args);

  return args;
}

function mapArgs (args) {
  const optMap = {
    b: ['browser', browserMap],
    p: ['platform', platformMap],
    d: ['device', deviceMap],
    f: ['framework', testFrameworkMap],
    a: 'backendVersion',
    o: 'orientation',
    v: 'version',
    l: 'localname',
    w: 'wait',
    t: 'test',
    r: 'runs',
  };
  for (let [shortcut, nameSet] of _.pairs(optMap)) {
    let name = nameSet;
    let shortcutMap;
    if (nameSet instanceof Array) {
      [name, shortcutMap] = nameSet;
    }
    if (args.name || !args[shortcut]) {
      continue;
    }
    if (shortcutMap) {
      if (args[shortcut] instanceof Array) {
        args[name] = args[shortcut].map(v => shortcutMap[v.toLowerCase()] || v);
      } else {
        args[name] = shortcutMap[args[shortcut].toLowerCase()] || args[shortcut];
      }
    } else {
      args[name] = args[shortcut];
    }
    delete args[shortcut];
  }
  return args;
}

function prepareTestSet (opts, tests = null) {
  if (tests === null) {
    // if we have just one test, its info is in 'opts', so get it into a
    // single test array
    let testArgs = ['browser', 'platform', 'device', 'framework',
                    'backendVersion', 'orientation', 'version',
                    'localname', 'wait', 'test'];
    let singleTest = {};
    for (let testArg of testArgs) {
      if (_.has(opts, testArg)) {
        singleTest[testArg] = opts[testArg];
        delete opts[testArg];
      }
    }
    tests = [singleTest];
  }

  // now our keys can be arrays so we need to find all combinations of
  // platforms
  let combiningKeys = ['browser', 'platform', 'device', 'backendVersion',
                       'orientation', 'version', 'test'];
  for (let k of combiningKeys) {
    for (let t of tests) {
      if (t[k] instanceof Array) {
        if (t[k].length === 0) {
          throw new Error("Invalid empty array value for test option");
        }
        // get all our options, the first in a variable and the rest in a list
        let [firstOpt, rest] = [t[k][0], t[k].slice(1)];

        // now update the test we have a reference for with the first value...
        t[k] = firstOpt;
        for (let otherOpt of rest) {
          // ... creating new tests for the other values
          let newT = _.clone(t);
          newT[k] = otherOpt;
          tests.push(newT);
        }
      }
    }
    // now our tests array has been updated with new tests, so on the next
    // iteration, other keys can be expanded and will combine with the
    // already-expanded set from this iteration
  }
  opts.tests = tests;
  return tests;
}

export { prepareTestSet, testsMap, mapArgs };
