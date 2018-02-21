const _ = require('lodash');
const util = require('util');
const B = require('bluebird');
const wd = require('wd');
const fs = require('fs');
const path = require('path');
const stats = require('stats-lite');
const { sleep } = require('asyncbox');
const { tests } = require('./tests');
const { sendToSumo } = require('./utils');
const { run: runLocalServer, stop: stopLocalServer } = require('./localserver');
const { getCaps } = require('./caps');

const PJSON = require('../package.json');

function getTestByType (testType) {
  switch (testType) {
    case 'https': return tests.webTestHttps;
    case 'selfsigned': return tests.webTestHttpsSelfSigned;
    case 'connect': return tests.webTestConnect;
    case 'localname': return tests.webTestLocalName;
    case 'appium': case 'ios': return tests.iosTest;
    case 'ios_hybrid': return tests.iosHybridTest;
    case 'ios_loc_serv': return tests.iosLocServTest;
    case 'ios_iwd': return tests.iosIwd;
    case 'ios_sk': return tests.iosSendKeysStressTest;
    case 'android': return tests.androidTest;
    case 'android_long': return tests.androidLongTest;
    case 'android_hybrid': return tests.androidHybridTest;
    case 'android_load': return tests.androidLoadTest;
    case 'selendroid': return tests.selendroidTest;
    case 'web_long': return tests.longWebTest;
    case 'web_guinea': return tests.guineaPigTest;
    case 'web_fraud': return tests.webTestFraud;
    default: return tests.webTest;
  }
}

// initialize a driver and run a single test
async function runTest (testSpec, opts, shouldLog, multiRun, statusFn) {
  let start = Date.now();
  let started = false;
  // initialize our results object for later decoration
  let result = {caps: testSpec.caps, test: testSpec.testName};
  let driver;
  // if we aren't in a context where we're running multiple texts and should
  // otherwise log, write out to the console with this little function
  let log = msg => {
    if (shouldLog && !multiRun) {
      console.log(msg);
    }
  };

  // set up our driver
  if (testSpec.onSauce) {
    driver = wd.promiseChainRemote({
      hostname: opts.server,
      port: opts.port,
      user: opts.userName,
      pwd: opts.accessKey,
      protocol: opts.port === 443 ? "https:" : "http:"
    });
  } else {
    driver = wd.promiseChainRemote(opts.server, opts.port);
  }

  // wrap test execution in try/catch so we can recover gracefully
  try {
    let startTime = Date.now();
    await driver.init(testSpec.caps);
    started = true;

    // always good to set an implicit wait timeout!
    await driver.setImplicitWaitTimeout(15000);

    // store startup time and session id on the results object so we can always
    // go look at the job page if something failed
    result.startupTime = Date.now() - startTime;
    result.sessionId = driver.sessionID;

    // actually run the teset
    await testSpec.test(driver, testSpec.caps, opts);

    // TODO: probably don't need this 'wait' feature anymore?
    if (testSpec.wait) {
      log(" - Waiting around for 120s...");
      await sleep(120000);
    }

    if (testSpec.onSauce) {
      // if we're running Sauce, set job status as passed
      log(" - Reporting pass");
      try {
        await driver.sauceJobStatus(true);
      } catch (e) {
        log(" - [Error reporting pass]");
      }
    } else {
      log(" - Test passed");
    }
    result.stack = null;
  } catch (e) {
    // if something bad happened, store the error stack and report a failure to
    // sauce if necessary
    log("");
    log(e.stack);
    log("");
    result.stack = e.stack;
    if (driver.sessionID && testSpec.onSauce) {
      log(" - Reporting failure");
      try {
        await driver.sauceJobStatus(false);
      } catch (e2) {
        log(" - [Error reporting failure]");
      }
    } else {
      log(" - Test failed");
    }
  }

  // if we actually started a session, we can end the session as well as
  // retrieve any event timing information from the appium server and write it
  // to a local file
  if (driver.sessionID) {
    if (opts.events) {
      let jsonFile = path.resolve(opts.events, `${driver.sessionID}.json`);
      log(` - Writing event timings to ${jsonFile}`);
      try {
        let res = await driver.sessionCapabilities();
        await B.promisify(fs.writeFile)(jsonFile, JSON.stringify(res));
      } catch (e) {
        log(` - [Error writing event timings: ${e.message}]`);
      }
    }
    log(" - Ending session");
    try {
      await driver.quit();
    } catch (e) {
      result.stack = e;
      log(" - [Error ending session]");
    }
  }

  // now write out the appropriate status to let the user know what happened
  if (result.stack) {
    statusFn({test: started ? 'F' : 'E'});
  } else {
    statusFn({test: '.'});
  }

  // finally, log out a bunch of stats if the session finished successfully,
  // and include the sauce link if we're running on sauce
  result.time = (Date.now() - start);
  let testTime = result.time - result.startupTime;
  log(" - Session finished in " + (result.time / 1000).toFixed(2) + "s");
  if (!result.stack) {
    log("   - Startup time: " + (result.startupTime / 1000).toFixed(2) +
        "s, " + (result.startupTime / result.time * 100).toFixed(2) + "%");
    log("   - Test time: " + (testTime / 1000).toFixed(2) +
        "s, " + (testTime / result.time * 100).toFixed(2) + "%");
  } else {
    log("   - No timing information available since test failed");
    if (result.sessionId) {
      log("   - Sauce link: https://saucelabs.com/tests/" + result.sessionId);
    }
  }
  return result;
}

// run a set of tests asynchronously in parallel
async function runTestSet (testSpecs, opts, log, statusFn) {
  // create a results list to keep track of results of each test
  let results = [];
  let numTests = testSpecs.length;

  // set the number of parallel "threads" that we can use. It's either the
  // number of tests or the number of allowed processes, whichever is greater
  let procs = opts.processes > numTests ? numTests : opts.processes;

  // keep track of whether we're running more than one test
  const multiRun = testSpecs.length > 1;
  if (log && multiRun) {
    console.log("");
  }
  // keep a map of tests in progress, this will be as long as our processes.
  // As we add and remove tests slots will be filled and emptied in this map.
  let testsInProgress = {};
  for (let i = 0; i < procs; i++) {
    // 'zero out' the slots
    testsInProgress[i] = null;
  }

  // define a helper to get the number of currently-executing tests
  let numTestsInProgress = () => {
    return _.values(testsInProgress).filter(x => x !== null).length;
  };

  // create and await a promise which will be resolved when all the tests have
  // finished
  await new B((resolve) => {
    // checkRuns periodically polls which tests are in progress and starts
    // new tests whenever a concurrency slot is free. Once all tests are done
    // it resolves the allDone that we deferred above.
    let checkRuns = () => {
      if (results.length >= numTests) {
        // if we've completed all the tests, resolve the deferred
        resolve();
        return;
      }
      // otherwise we're not done, and if completed + in progress is less than
      // all the tests, we can look into starting more
      if (results.length + numTestsInProgress() < numTests) {
        // loop through our possibly-available test slots
        for (let [slot, testPromise] of _.toPairs(testsInProgress)) {
          if (testPromise === null) {
            // if testPromise is null, that means the slot is free and
            // we can start a new test! So we start it and put the promise
            // in the slot to keep track
            let testSpec = testSpecs.shift(); // get the next test
            let newTestPromise = runTest(testSpec, opts, log, multiRun, statusFn);
            // recast newTestPromise as a Bluebird promise so we get .finally
            newTestPromise = B.resolve(newTestPromise);

            // Once we're done with this particular test, handle any
            // unexpected errors and update the results array
            newTestPromise.then((res) => {
              // in the normal case, when the test is done we push the result
              // onto the results list
              results.push(res);
            }).catch((err) => {
              // it could turn out that runTest itself throws, so handle that
              // here and make sure we print out an error condition
              let res = {};
              res.stack = err.stack;
              res.test = testSpec.testName;
              res.caps = testSpec.caps;
              if (multiRun) {
                statusFn({test: 'E'});
              }
              results.push(res);
            }).finally(() => {
              // regardless of error or not, we free up a slot and signal that
              // we should check for the ability to start a new test
              testsInProgress[slot] = null;
              checkRuns();
            });

            // add the new test promise into the appropriate slot
            testsInProgress[slot] = newTestPromise;
          }
        }
      }
    };

    // kick off the first spin of checkRuns; the next invocations will happen
    // recursively
    checkRuns();
  });
  return results;
}

// build a suite of tests from various params
function buildTestSuite (opts) {
  // define a list to hold each test we're eventually going to run
  let testSpecs = [];
  // we also keep track of how many total tests we're going to run, as well as
  // how many distinct sets of capabilities (some might be run more than once)
  let numTests = 0, numCaps = 0, needsLocalServer = false;
  let buildStartTime = Date.now();

  // go through each of opts.tests, which we call an 'optSpec' since it is
  // a set of options which will generate a testSpec
  for (let optSpec of opts.tests) {
    let testSpec = {};
    // how many times should we run this particular test? default to 1
    let runs = parseInt(optSpec.runs || 1, 10);

    // flag whether this test is going to need us to start a local http server
    // to test sauce connect
    if (_.includes(["localname", "connect"], optSpec.test)) {
      needsLocalServer = true;
    }

    // assign important details to this testSpec, including whether we're
    // running on Sauce and the (heavily modified) capabilities, all based on
    // the optSpec
    testSpec.test = getTestByType(optSpec.test);
    testSpec.testName = optSpec.test;
    optSpec.onSauce = testSpec.onSauce = opts.userName && opts.accessKey;
    testSpec.caps = getCaps(optSpec, !!opts.events);

    // if we've passed in a build name, decorate it with a timestamp if the
    // '%t' symbol was used. Also, if we have more than one test, auto-create
    // a build id if one was not defined, to make these runs sit together in
    // the Sauce UI
    let build = opts.build;
    if (build) {
      build = build.replace("%t", buildStartTime);
    } else if (optSpec.onSauce && (opts.tests.length > 1 || runs > 1)) {
      build = `runsauce-${opts.userName}-${buildStartTime}`;
    }
    if (build) {
      testSpec.caps.build = build;
    }

    numTests += runs;
    numCaps++;
    // ensure that if we want to run this test more than once, we duplicate the
    // testSpec in our list
    for (let i = 0; i < runs; i++) {
      testSpecs.push(testSpec);
    }
  }
  return [testSpecs, numTests, numCaps, needsLocalServer];
}

// put together various statistics about a suite and display it to the user
async function reportSuite (results, elapsedMs, doLog = true, opts) {
  let cleanResults = results.filter(r => !r.stack);
  let passed = cleanResults.length;
  let failed = results.length - passed;
  let passRate = (passed / results.length) * 100;
  // we should only log under certain conditions, so wrap those up into
  // a little helper function
  let log = (msg) => {
    if (doLog && results.length > 1) {
      console.log(msg);
    }
  };
  log("\n");
  log("RAN: " + results.length + " // PASSED: " + passed + " // FAILED: " +
      failed + " (" + passRate.toFixed(2) + "% pass rate)");
  let report = {results, passed, failed, passRate: passRate / 100};
  if (cleanResults.length) {
    let times = _.map(cleanResults, 'time').map(t => t / 1000);
    let startupTimes = _.map(cleanResults, 'startupTime').map(t => t / 999);
    let sum = _.reduce(times, (m, n) => { return m + n; }, 0);
    let avg = sum / cleanResults.length;
    let stddev = stats.stdev(times);
    let startSum = _.reduce(startupTimes, (m, n) => { return m + n; }, 0);
    let startAvg = startSum / cleanResults.length;
    let startStddev = stats.stdev(startupTimes);
    log(`Average successful test run time: ${avg.toFixed(2)}s\n` +
        `  Std Dev: ${stddev.toFixed(2)}\n` +
        `Average successful test startup time: ${startAvg.toFixed(2)}\n` +
        `  Std Dev: ${startStddev.toFixed(2)}\n` +
        `  % of test time: ${(startAvg / avg * 100).toFixed(2)}%\n` +
        `Total run time: ${(elapsedMs / 1000).toFixed(2)}s`);
    _.extend(report, {testTimeAvg: avg, testTimeStdDev: stddev,
                      startTimeAvg: startAvg, startTimeStdDev: startStddev,
                      totalSuiteTime: elapsedMs / 1000});
  } else {
    log("No statistics available since every test failed");
  }

  let errs = 0;
  for (let res of results) {
    errs++;
    if (res.stack) {
      log("");
      log("----------------");
      log("Error for test #" + errs );
      log("----------------");
      if (res.sessionId) {
        log("SAUCE URL: https://saucelabs.com/tests/" + res.sessionId);
      }
      log("TEST: " + res.test);
      log("CAPS: " + util.inspect(res.caps));
      log("----------------");
      log(res.stack);
    }
  }

  // if we want to send data to sumoLogic, do that now
  if (opts.sumoLogic) {
    let sumoResults = _.cloneDeep(results);
    for (let res of sumoResults) {
      // Add saucerun version, mark status & remove stack trace
      res.runsauceVersion = PJSON.version;
      res.status = res.stack ? 'failure' : 'success';
      delete res.stack;
    }
    log("Sending results to Sumo Logic");
    try {
      await sendToSumo(opts.sumoLogic, sumoResults);
      log("Success!");
    } catch (err) {
      log("Couldn't send results to Sumo Logic");
      log(err);
    }
  }

  return report;
}

// main runner function which gets all the tests set up based on the options
// the user has set, runs the tests, and delivers reports
async function run (opts, log = true, statusFn = null) {
  let [testSpecs, numTests, numCaps, needsLocalServer] = buildTestSuite(opts);
  const testStr = numTests + " test" + (numTests !== 1 ? "s" : "");
  const pStr = opts.processes + " process" + (opts.processes !== 1 ? "es": "");

  // the user can pass in their own status function (which is nice for building
  // other apps on top of runsauce). But if it's not defined, we define our
  // own, which does different things based on whether we're running more than
  // one test or not.
  if (!statusFn) {
      statusFn = (msg) => {
        if (numTests > 1 && msg.test) {
          process.stdout.write(msg.test);
        } else if (msg.localServer) {
          // if we're running a local server, print those status messages
          // regardless of number of tests
          if (msg.localServer === "starting") {
            console.log(" - Starting simple web server");
          } else if (msg.localServer === "stopping") {
            console.log(" - Stopping simple web server");
          }
        }
      };
  }

  if (log) {
    console.log("Running " + testStr + " in up to " + pStr + " against " +
                opts.configName + " with " + numCaps + " sets of caps");
  }
  // 'emit' the number of tests we're going to run
  statusFn({numTests});

  // if we need a local web server to test sauce connect, start that now
  if (needsLocalServer) {
    statusFn({localServer: 'starting'});
    runLocalServer();
    statusFn({localServer: 'started'});
  }

  // by default, only show detailed capabilities if we're running just one
  // test, or if we've asked for verbose logging
  if ((opts.verbose || numCaps === 1) && log) {
    console.log(util.inspect(_.map(testSpecs, 'caps')[0]));
  }

  let start = Date.now();
  // actually run the suite
  let results = await runTestSet(testSpecs, opts, log, statusFn);
  // stop the local server if we started it
  if (needsLocalServer) {
    statusFn({localServer: 'stopping'});
    await stopLocalServer();
    statusFn({localServer: 'stopped'});
  }
  // write out reports!
  return await reportSuite(results, Date.now() - start, log, opts);
}

module.exports = { runTest, runTestSet, run };
