import _ from 'lodash';
import { parse as parseOpts, testsMap } from './parser';
import { run } from './runner';
import { interactiveSetup, getConfig } from './setup';

const opts = parseOpts();

async function main () {
  if (_.has(opts, 'setup') && opts.setup) {
    await interactiveSetup();
    process.exit(0);
  }
  let config = getConfig();
  if (config === null) {
    console.error("Could not load config file, please run with --setup");
    process.exit(1);
  }
  if (!_.has(config, opts.config)) {
    console.error("Config " + opts.config + " doesn't exist");
    process.exit(1);
  }
  if (!_.contains(_.keys(testsMap), opts.test)) {
    console.error("Test type '" + opts.test + "' is not valid, run --tests");
    process.exit(1);
  }
  let caps = {
    browserName: opts.browser
    , device: opts.device
    , version: opts.version.toString()
    , platform: opts.platform
    , name: testsMap[opts.test]
  };
  if (opts.orientation) {
    caps['device-orientation'] = opts.orientation;
  }
  await run(_.extend({
    testType: opts.test
    , wait: opts.wait
    , localname: opts.localname
    , configName: opts.config
    , runs: opts.runs
    , framework: opts.framework
    , processes: opts.processes
    , backendVersion: opts.backendVersion
  }, config[opts.config]), caps);
}

export function runsauce () {
  main().then(() => {}, err => {
    console.error(err.stack);
    process.exit(1);
  });
}


