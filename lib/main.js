"use strict";

var runner = require('./runner.js')
  , _ = require('underscore')
  , opts = require('./parser.js')()
  , monocle = require('monocle-js');

var configs = {
  prod: {
    server: undefined
    , port: undefined
    , userName: process.env.SAUCE_USERNAME
    , accessKey: process.env.SAUCE_ACCESS_KEY
    , configName: 'prod'
  },
  dev: {
    server: 'jlipps.dev.saucelabs.net'
    , port: 4444
    , userName: process.env.SAUCE_USERNAME_DEV
    , accessKey: process.env.SAUCE_ACCESS_KEY_DEV
    , configName: 'stew'
  }
};

var setup = function() {
  console.log("doing setup");
};

if (module === require.main) {
  if (_.has(opts, 'setup') && opts.setup) {
    return setup();
  }
  if (!_.has(configs, opts.config)) {
    console.error("Config " + opts.config + " doesn't exist");
    process.exit(1);
  }
  monocle.run(function*() {
    yield runner.run(_.extend({
      testType: opts.test
      , wait: opts.wait
      , localname: opts.localname
    }, configs[opts.config]), {
      browserName: opts.browser
      , version: opts.version
      , platform: opts.platform
    });
  });
}


