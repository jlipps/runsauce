const _ = require('lodash');
const util = require('util');
const Q = require('Q');
const wd = require('wd');
const fs = require('fs');
const path = require('path');
const stats = require('stats-lite');
const { sleep } = require('asyncbox');
const { tests } = require('./tests');
const { testsMap } = require('./parser');
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
    case 'selendroid': return tests.selendroidTest;
    case 'web_long': return tests.longWebTest;
    case 'web_guinea': return tests.guineaPigTest;
    case 'web_fraud': return tests.webTestFraud;
    default: return tests.webTest;
  }
}

async function runTest (testSpec, opts, shouldLog, multiRun, statusFn) {
  let start = Date.now();
  let started = false;
  let result = {caps: testSpec.caps, test: testSpec.testName};
  let driver;
  let log = msg => {
    if (shouldLog && !multiRun) console.log(msg);
  };
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
  try {
    let startTime = Date.now();
    await driver.init(testSpec.caps);
    started = true;
    await driver.setImplicitWaitTimeout(15000);
    result.startupTime = Date.now() - startTime;
    result.sessionId = driver.sessionID;
    await testSpec.test(driver, testSpec.caps, opts);
    if (testSpec.wait) {
      log(" - Waiting around for 120s...");
      await sleep(120000);
    }
    if (testSpec.onSauce) {
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
  if (driver.sessionID) {
    if (opts.events) {
      let jsonFile = path.resolve(opts.events, `${driver.sessionID}.json`);
      log(` - Writing event timings to ${jsonFile}`);
      try {
        let res = await driver.sessionCapabilities();
        await Q.nfcall(fs.writeFile, jsonFile, JSON.stringify(res));
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
  if (result.stack) {
    statusFn({test: started ? 'F' : 'E'});
  } else {
    statusFn({test: '.'});
  }
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

async function runTestSet (testSpecs, opts, log, statusFn) {
  let results = [];
  let numTests = testSpecs.length;
  let procs = opts.processes > numTests ? numTests : opts.processes;
  const multiRun = testSpecs.length > 1;
  if (log && multiRun) {
    console.log("");
  }
  // keep a map of tests in progress, this will be as long as our processes.
  // As we add and remove tests slots will be filled and emptied in this map.
  let testsInProgress = {};
  for (let i = 0; i < procs; i++) {
    testsInProgress[i] = null;
  }

  // Create a promise that we will resolve when all tests are done
  let setCb = Q.defer();

  // Helper to get the number of currently-executing tests
  let numTestsInProgress = () => {
    return _.values(testsInProgress).filter(x => x !== null).length;
  };

  // checkRuns periodically polls which tests are in progress and starts
  // new tests whenever a concurrency slot is free. Once all tests are done
  // it resolves the setCb that we deferred above.
  let checkRuns = () => {
    // if we have completed fewer tests than our total, we're not done
    if (results.length < numTests) {
      // if completed + in progress is less than all the tests, we can
      // look into startng more
      if (results.length + numTestsInProgress() < numTests) {
        // loop through our possibly-available test slots
        for (let [slot, testPromise] of _.pairs(testsInProgress)) {
          if (testPromise === null) {
            // if testPromise is null, that means the slot is free and
            // we can start a new test! So we start it and put the promise
            // in the slot to keep track
            let testSpec = testSpecs.shift(); // get the next test
            let newTestPromise = Q(runTest(testSpec, opts, log, multiRun, statusFn));

            // Once we're done with this particular test, handle any
            // unexpected errors and update the results array
            newTestPromise.nodeify((err, res) => {
              if (err) {
                if (!res || !res.stack) {
                  res = res || {};
                  res.stack = err.stack;
                  res.test = testSpec.testName;
                  res.caps = testSpec.caps;
                }
                if (multiRun) {
                  statusFn({test: 'E'});
                }
              }
              testsInProgress[slot] = null;
              results.push(res);
              // now that we've freed a slot, do checkRuns again
              checkRuns();
            });
            testsInProgress[slot] = newTestPromise;
          }
        }
      }
    } else {
      // if we've completed all the tests, resolve the deferred
      setCb.resolve();
    }
  };

  checkRuns();
  await setCb.promise; // wait till we're done with all the tests
  return results;
}

function buildTestSuite (opts) {
  let testSpecs = [];
  let numTests = 0, numCaps = 0, needsLocalServer = false;
  let buildStartTime = Date.now();
  for (let optSpec of opts.tests) {
    let testSpec = {};
    let runs = parseInt(optSpec.runs || 1, 10);
    if (_.contains(["localname", "connect"], optSpec.test)) {
      needsLocalServer = true;
    }
    testSpec.test = getTestByType(optSpec.test);
    testSpec.testName = optSpec.test;
    optSpec.onSauce = opts.userName && opts.accessKey;
    testSpec.caps = getCaps(optSpec, !!opts.events);
    if (testSpec.test.extraCaps) {
      _.extend(testSpec.caps, testSpec.test.extraCaps);
    }
    let build = opts.build;
    if (build) {
      build = build.replace("%t", buildStartTime);
    } else if (optSpec.onSauce && (opts.tests.length > 1 || runs > 1)) {
      build = `runsauce-${opts.userName}-${buildStartTime}`;
    }
    if (build) {
      testSpec.caps.build = build;
    }
    testSpec.onSauce = optSpec.onSauce;
    numTests += runs;
    numCaps++;
    for (let i = 0; i < runs; i++) {
      testSpecs.push(testSpec);
    }
  }
  return [testSpecs, numTests, numCaps, needsLocalServer];
}

async function reportSuite (results, elapsedMs, doLog = true, opts) {
  let cleanResults = results.filter(r => !r.stack);
  let passed = cleanResults.length;
  let failed = results.length - passed;
  let passRate = (passed / results.length) * 100;
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
    let times = _.pluck(cleanResults, 'time').map(t => t / 1000);
    let startupTimes = _.pluck(cleanResults, 'startupTime').map(t => t / 1000);
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

async function run (opts, log = true, statusFn = null) {
  let [testSpecs, numTests, numCaps, needsLocalServer] = buildTestSuite(opts);
  const testStr = numTests + " test" + (numTests !== 1 ? "s" : "");
  const pStr = opts.processes + " process" + (opts.processes !== 1 ? "es": "");
  if (!statusFn) {
    if (numTests > 1) {
      statusFn = (msg) => {
        if (msg.test) {
          process.stdout.write(msg.test);
        } else if (msg.localServer) {
          if (msg.localServer === "starting") {
            console.log(" - Starting simple web server");
          } else if (msg.localServer === "stopping") {
            console.log(" - Stopping simple web server");
          }
        }
      };
    } else {
      statusFn = () => {};
    }
  }

  if (log) {
    console.log("Running " + testStr + " in up to " + pStr + " against " +
                opts.configName + " with " + numCaps + " sets of caps");
  }
  statusFn({numTests});
  if (needsLocalServer) {
    statusFn({localServer: 'starting'});
    runLocalServer();
    statusFn({localServer: 'started'});
  }
  if (opts.verbose || numCaps === 1) {
    if (log) {
      console.log(util.inspect(_.pluck(testSpecs, 'caps')[0]));
    }
  }
  let start = Date.now();
  let results = await runTestSet(testSpecs, opts, log, statusFn);
  if (needsLocalServer) {
    statusFn({localServer: 'stopping'});
    await stopLocalServer();
    statusFn({localServer: 'stopped'});
  }
  return await reportSuite(results, Date.now() - start, log, opts);
}

module.exports = { runTest, runTestSet, run };
