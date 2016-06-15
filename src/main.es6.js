import _ from 'lodash';
import path from 'path';
import { parse as parseOpts, testsMap, mapArgs,
         prepareTestSet } from './parser';
import { run } from './runner';
import { interactiveSetup, getConfig } from './setup';


function exit (msg, code = 1) {
  console.log(msg);
  process.exit(code);
}

export async function runsauce (opts = null, log = true, statusFn = null) {
  if (!opts) {
    opts = parseOpts();
  } else if (opts.testsuite) {
    // do nothing
  } else {
    opts = parseOpts(opts);
  }
  let testfile, tests = null;
  if (_.has(opts, 'setup') && opts.setup) {
    await interactiveSetup();
    process.exit(0);
  }
  let config = getConfig();
  if (config === null) {
    exit("Could not load config file, please run with --setup");
  }
  if (opts.testsuite || opts.testfile) {
    if (opts.testsuite) {
      testfile = opts.testsuite;
    } else {
      try {
        testfile = require(path.resolve(process.cwd(), opts.testfile));
      } catch (e) {
        exit(`You specified "-i ${opts.testfile}" but we couldn't open it!`);
      }
    }
    if (!testfile.tests instanceof Array) {
      exit("You didn't specify any tests in the testfile!");
    }
    opts.config = testfile.c || testfile.config;
    opts.build = opts.build || testfile.u || testfile.build;
    opts.processes = testfile.n || testfile.processes || opts.processes;
    tests = testfile.tests;
  }
  prepareTestSet(opts, tests);
  opts.tests = opts.tests.map(t => mapArgs(t));
  if (!_.has(config, opts.config)) {
    exit("Config " + opts.config + " doesn't exist");
  }
  for (let test of _.pluck(opts.tests, 'test')) {
    if (!_.contains(_.keys(testsMap), test)) {
      exit("Test type '" + test + "' is not valid, run --tests");
    }
  }
  return run(_.extend({
    configName: opts.config,
    tests: opts.tests,
    processes: opts.processes,
    verbose: opts.verbose,
    build: opts.build,
  }, config[opts.config]), log, statusFn);
}

export function cli () {
  runsauce().then(() => {}, err => {
    console.error(err.stack);
    process.exit(1);
  });
}
