"use strict";

var runner = require('./runner.js')
  , _ = require('underscore')
  , opts = require('./parser.js').parse()
  , testsMap = require('./parser.js').testsMap
  , setup = require('./setup.js')
  , monocle = require('monocle-js');

monocle.run(function*() {
  if (_.has(opts, 'setup') && opts.setup) {
    yield setup.interactiveSetup();
    process.exit(0);
  }
  var config = setup.getConfig();
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
  var caps = {
    browserName: opts.browser
    , device: opts.device
    , version: opts.version.toString()
    , platform: opts.platform
    , name: testsMap[opts.test]
  };
  if (opts.orientation) {
    caps['device-orientation'] = opts.orientation;
  }
  yield runner.run(_.extend({
    testType: opts.test
    , wait: opts.wait
    , localname: opts.localname
    , configName: opts.config
    , runs: opts.runs
    , framework: opts.framework
    , processes: opts.processes
    , backendVersion: opts.backendVersion
  }, config[opts.config]), caps);
});
