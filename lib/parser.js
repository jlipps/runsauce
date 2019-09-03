const optimist = require('optimist');
const os = require('os');
const _ = require('lodash');

const browserMap = {
  's': 'Safari',
  'b': 'Browser',
  'f': 'firefox',
  'c': 'Chrome',
  'i': 'Internet Explorer',
  'ie': 'Internet Explorer',
  'e': 'MicrosoftEdge',
  'ip': 'iPhone',
  'ipa': 'iPad',
  'a': 'Android',
};

const platformMap = {
  'w': 'Windows 10',
  'w10': 'Windows 10',
  'w8': 'Windows 8',
  'w81': 'Windows 8.1',
  'w7': 'Windows 7',
  'wx': 'Windows XP',
  'm': 'Mac 10.12',
  'm12': 'Mac 10.12',
  'm11': 'Mac 10.11',
  'm10': 'Mac 10.10',
  'm9': 'Mac 10.9',
  'm8': 'Mac 10.8',
  'l': 'Linux',
};

const deviceMap = {
  'ip': 'iPhone Simulator',
  'ipa': 'iPad Simulator',
  'a': 'Android',
  'ae': 'Android Emulator',
  'aeg': 'Android GoogleAPI Emulator',
};

const orientationMap = {
  'p': 'portrait',
  'l': 'landscape',
};

const automationNameMap = {
  'x': 'XCUITest',
  'u2': 'UiAutomator2',
  's': 'Selendroid'
};

let shortcutHelp = function () {
  let t = "All the options have nice shortcuts:\n\n";
  const shortcutTypes = {
    'Platforms (-p)': platformMap,
    'Browsers (-b)': browserMap,
    'Devices (-d)': deviceMap,
    'Orientations (-o)': orientationMap,
    'Automation Names': automationNameMap,
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
  web_guinea: "Basic web guinea pig test",
  web_fraud: "Test of safariIgnoreFraudWarning",
  https: "Basic web test of https site",
  selfsigned: "Basic web test of self-signed https site",
  connect: "Basic web test of locally hosted site",
  localname: "Basic web test of locally hosted site with custom name",
  ios: "Basic ios native test",
  ios_hybrid: "Basic ios hybrid test",
  ios_loc_serv: "iOS location services test",
  ios_iwd: "iOS IWD test",
  ios_sk: "iOS Send Keys Stress test",
  android: "Basic android native test",
  android_long: "Long android native test",
  android_load: "IO/CPU load android native test",
  android_hybrid: "Basic appium hybrid test",
  selendroid: "Basic selendroid hybrid test",
  ios_animation_performance: "iOS Test Running animations for performance testing",
  manual: "Fake manual session"
};

let testsHelp = function() {
  let t = "Here are the available test types:\n\n";
  _.each(module.exports.testsMap, function(test, type) {
    t += type + ": " + test + "\n";
  });
  return t;
};

function parse (argOverride = null) {
  let oldArgv = process.argv;
  if (argOverride) {
    process.argv = argOverride;
  }
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
      describe: 'Web browser',
      demand: false
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
    .options('a', {
      alias: 'backendVersion',
      default: '',
      describe: 'Selenium/Appium version',
      demand: false
    })
    .options('m', {
      alias: 'automationName',
      default: '',
      describe: 'Appium automationName',
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
    .options('e', {
      alias: 'extraCaps',
      describe: 'Extra capabilities (JSON string, will be merged into final caps)',
      demand: false
    })
    .options('j', {
      alias: 'jsonToSumo',
      describe: 'Sumo Logic collection endpoint',
      demand: false
    })
    .options('events', {
      desribe: 'Directory to dump event timing JSON blobs into',
      demand: false
    })
    .options('all', {
      describe: 'Run tests on every Sauce supported Android Emulator and iOS Simulator',
      demand: false,
      default: false
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

  if (argOverride) {
    process.argv = oldArgv;
  }
  return args;
}

function mapArgs (args) {
  // first create a convenient object containing the shortcut params and their
  // actual full param name, along with any shortcut value sets if appropriate
  const optMap = {
    b: ['browser', browserMap],
    p: ['platform', platformMap],
    d: ['device', deviceMap],
    m: ['automationName', automationNameMap],
    a: 'backendVersion',
    o: ['orientation', orientationMap],
    v: 'version',
    l: 'localname',
    w: 'wait',
    t: 'test',
    r: 'runs',
    e: 'extraCaps',
    j: 'jsonToSumo',
    events: 'events',
  };
  // now it's time to iterate through each possible param to do some
  // conversions if necessary
  for (let [shortcut, nameSet] of _.toPairs(optMap)) {
    let name = nameSet;
    let shortcutMap;
    // some options have shortcut maps, so extract those
    if (nameSet instanceof Array) {
      [name, shortcutMap] = nameSet;
    }
    // if we have no value for this particular key/shortcut, pass on through
    if (!args[name] && !args[shortcut]) {
      continue;
    }
    // get our value out of either the fully-spelled-out param or its shortcut
    let val = args[name] || args[shortcut];
    if (shortcutMap) {
      // if we need to turn shortcut values into real long form values, do so
      if (val instanceof Array) {
        // here our value is actually an array of values, so map over them
        args[name] = val.map(v => shortcutMap[v.toLowerCase()] || v);
      } else {
        // otherwise just convert the value to its actual long form
        args[name] = shortcutMap[val.toLowerCase()] || val;
      }
    } else {
      // if there are no shortcut values for this param, just assign it
      args[name] = val;
      if (name === "extraCaps") {
        // extraCaps is special, since it's json so we want to turn it into
        // an object
        args[name] = JSON.parse(args[name]);
      }
    }
    // get rid of the shortcut version of the param if it exists
    delete args[shortcut];
  }
  return args;
}

function prepareTestSet (opts, tests = null) {
  if (tests === null) {
    // if we have just one test, its info is in 'opts', so get it into a
    // single test array
    let testArgs = ['browser', 'b', 'platform', 'p', 'device', 'd',
                    'backendVersion', 'a', 'orientation',
                    'o', 'version', 'v', 'wait', 'w',
                    'test', 't', 'runs', 'r', 'extraCaps', 'e', 'm',
                    'automationName'];
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
  let combiningKeys = ['browser', 'b', 'platform', 'p', 'device', 'd',
                       'backendVersion', 'a', 'orientation', 'o', 'version',
                       'v', 'test', 't'];
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
  tests = tests.filter(t => {
    let okCombo = true;
    for (let v of _.values(t)) {
      let restrictions = v.toString().split('|').slice(1);
      if (restrictions.length === 0) {
        continue;
      }
      for (let restriction of restrictions) {
        const specialChars = ['<', '>', '!'];
        let [restrictOnKey, restrictOnValue] = restriction.split('=');
        let lastChar = restrictOnKey[restrictOnKey.length - 1];
        if (_.includes(specialChars, lastChar)) {
          restrictOnKey = restrictOnKey.slice(0, -1);
        }
        let restrictedValue = t[restrictOnKey].split('|')[0];
        switch (lastChar) {
          case '>':
            if (restrictedValue < restrictOnValue) {
              okCombo = false;
            }
            break;
          case '<':
            if (restrictedValue > restrictOnValue) {
              okCombo = false;
            }
            break;
          case '!':
            okCombo = restrictedValue !== restrictOnValue;
            break;
          default:
            okCombo = restrictedValue === restrictOnValue;
        }
      }
      if (!okCombo) return false;
    }
    return true;
  }).map(t => {
    for (let [k, v] of _.toPairs(t)) {
      t[k] = v.toString().split('|')[0];
    }
    return t;
  });
  opts.tests = tests;
  return tests;
}

module.exports = { parse, prepareTestSet, testsMap, mapArgs };
