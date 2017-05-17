const _ = require('lodash');
const path = require('path');
const { parse, testsMap, mapArgs, prepareTestSet } = require('./parser');
const { run } = require('./runner');
const { interactiveSetup, getConfig } = require('./setup');
const { asyncify } = require('asyncbox');


function exit (msg, code = 1) {
  console.log(msg);
  process.exit(code);
}

async function runsauce (opts = null, log = true, statusFn = null) {
  if (!opts) {
    // we can either use this function as a library, in which case we can pass
    // in opts, or else we call it from the CLI, in which case we want to parse
    // opts from the CLI params
    opts = parse();
  } else if (opts.testsuite) {
    // if we have opts passed in with a 'testsuite' property, that means that
    // all the opts will be defined on the testsuite, and we don't need to
    // parse them
  } else {
    // finally, if we passed in opts, ensure that we pass them through our
    // parser, for validation and turning shortcut param names into full param
    // names
    opts = parse(opts);
  }
  let testsuite, tests = null;

  // if we're asking for setup, run the interactive setup and exit
  if (_.has(opts, 'setup') && opts.setup) {
    await interactiveSetup();
    process.exit(0);
  }

  // otherwise validate that a proper set of configs exists
  let config = getConfig();
  if (config === null) {
    exit("Could not load config file, please run with --setup");
  }

  // we can have a 'testsuite', which is a js object defining tests to run, or
  // we can have a path to a testfile, which is simply a file exporting such an
  // object (see the README for the appropriate form of this data)
  if (opts.testsuite || opts.testfile) {
    if (opts.testsuite) {
      // if we have the suite, we're done
      testsuite = opts.testsuite;
    } else {
      // otherwise, read the file into an object
      try {
        testsuite = require(path.resolve(process.cwd(), opts.testfile));
      } catch (e) {
        exit(`You specified "-i ${opts.testfile}" but we couldn't open it!`);
      }
    }
    if (!testsuite.tests instanceof Array) {
      //
      exit("You didn't specify any tests in the testsuite");
    }
    // now our testsuite object will have top-level properties that we want to
    // fold into our overall option object. These properties can either be the
    // shortcut version or the full version.
    opts.config = testsuite.c || testsuite.config;
    opts.build = opts.build || testsuite.u || testsuite.build;
    opts.processes = testsuite.n || testsuite.processes || opts.processes;
    opts.jsonToSumo = testsuite.j || testsuite.jsonToSumo || opts.jsonToSumo;
    opts.events = testsuite.events || opts.events;
    opts.localname = testsuite.localname || testsuite.l || opts.localname;
    tests = testsuite.tests;
  }

  // our list of tests might be very complex, including tests with
  // combinatorial platforms and restrictions. prepareTestSet expands that into
  // an actual list of every test spec we want to run. It actually modifies
  // opts.tests in place. (TODO: it probably shouldn't)
  prepareTestSet(opts, tests);
  // now our list of test specs might still have shortcut values like 'm9'
  // instead of the real platform 'Mac 10.9', so map them to the real values.
  opts.tests = opts.tests.map(t => mapArgs(t));

  // verify that the testsuite has specified a config, and that it exists in
  // the configs file
  if (!_.has(config, opts.config)) {
    exit("Config " + opts.config + " doesn't exist");
  }

  // verify that the test types specified exist
  for (let test of _.map(opts.tests, 'test')) {
    if (!_.includes(_.keys(testsMap), test)) {
      exit("Test type '" + test + "' is not valid, run --tests");
    }
  }

  // finally, run the actual testsuite with all the parameters that we end up
  // with
  return run(_.extend({
    configName: opts.config,
    tests: opts.tests,
    processes: opts.processes,
    verbose: opts.verbose,
    build: opts.build,
    sumoLogic: opts.jsonToSumo,
    events: opts.events,
    localname: opts.localname,
  }, config[opts.config]), log, statusFn);
}

// CLI endpoint that simply kicks off the main process and handles errors
function cli () {
  asyncify(runsauce);
}

module.exports = { runsauce, cli };
