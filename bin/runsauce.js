#!/usr/bin/env node --harmony
"use strict";

var runner = require('../lib/runner.js')
  , _ = require('underscore')
  , opts = require('../lib/parser.js')()
  , setup = require('../lib/setup.js')
  , monocle = require('monocle-js');

if (module === require.main) {
  monocle.run(function*() {
    if (_.has(opts, 'setup') && opts.setup) {
      yield setup.interactiveSetup();
      process.exit(0);
    }
    var config = yield setup.getConfig();
    if (config === null) {
      console.error("Could not load config file, please run with --setup");
      process.exit(1);
    }
    if (!_.has(config, opts.config)) {
      console.error("Config " + opts.config + " doesn't exist");
      process.exit(1);
    }
    yield runner.run(_.extend({
      testType: opts.test
      , wait: opts.wait
      , localname: opts.localname
      , configName: opts.config
    }, config[opts.config]), {
      browserName: opts.browser
      , device: opts.device
      , version: opts.version
      , platform: opts.platform
    });
  });
}



