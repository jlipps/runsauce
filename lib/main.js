"use strict";

var runner = require('./runner.js')
  , _ = require('underscore')
  , monocle = require('monocle-js');

var configs = {
  prod: {
    server: undefined
    , port: undefined
    , userName: process.env.SAUCE_USERNAME
    , accessKey: process.env.SAUCE_ACCESS_KEY
    , configName: 'prod'
  },
  stew: {
    server: 'jlipps.dev.saucelabs.net'
    , port: 4444
    , userName: process.env.SAUCE_USERNAME_DEV
    , accessKey: process.env.SAUCE_ACCESS_KEY_DEV
    , configName: 'stew'
  }
};


if (module === require.main) {
  monocle.run(function*() {
    yield runner.run(_.extend({
      browserName: 'Chrome'
      , version: ''
      , platform: 'Mac 10.9'
      , testType: 'connect'
    }, configs.prod));
  });
}


