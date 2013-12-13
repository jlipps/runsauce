"use strict";

var path = require('path')
  , fs = require('monocle-fs')
  , monocle = require('monocle-js')
  , o_O = monocle.o_O
  , o_C = monocle.o_C
  , prompt = require('prompt')
  , configFile = path.resolve(process.env.HOME, ".runsauce.json")
  , _ = require('underscore');

prompt.message = ">";
prompt.delimiter = " ";
prompt.colors = false;

var getInput = o_O(function*() {
  var cb = o_C();
  var args = Array.prototype.slice.call(arguments);
  args.push(cb);
  prompt.get.apply(null, args);
  return (yield cb);
});

var promptOverwrite = o_O(function*(config) {
  console.log("A configuration file for runsauce already exists.");
  var res = yield getInput({
    name: 'proceed'
    , description: "Are you sure you want to overwrite it?"
    , default: 'Y'
    , type: 'string'
    , required: true
  });
  if (res.proceed !== "Y") {
    process.exit(0);
  }
  yield fs.writeFile(configFile + ".bak", JSON.stringify(config));
  console.log("Backup written to " + configFile + ".bak");
});

var promptForConfig = o_O(function*() {
  console.log("\nAlright, let's add your Sauce config");
  var res = yield getInput([{
    name: 'userName'
    , description: 'Production username'
    , default: process.env.SAUCE_USERNAME
    , type: 'string'
    , required: true
  }, {
    name: 'accessKey'
    , description: 'Production access key'
    , default: process.env.SAUCE_ACCESS_KEY
    , type: 'string'
    , required: true
  }]);
  return {
    prod: {
      server: 'ondemand.saucelabs.com'
      , port: 80
      , userName: res.userName
      , accessKey: res.accessKey
    }
  };
});

exports.getConfig = o_O(function*() {
  var config;
  try {
    config = require(configFile);
  } catch (e) {
    console.log(e);
    config = null;
  }
  return config;
});

exports.interactiveSetup = o_O(function*() {
  console.log("Running setup!");
  console.log("--------------");
  prompt.start();
  var config = yield exports.getConfig();
  if (config) {
    yield promptOverwrite(config);
  }
  config = yield promptForConfig();
  yield fs.writeFile(configFile, JSON.stringify(config));
  console.log("\nOK, config has been written to " + configFile);
  console.log("\nIt's just JSON, so you can add your own configs as well");
  console.log("Maybe add your stewardess as 'dev'?");
  console.log("\nBye now! You could try to run something, like:");
  console.log('> runsauce --test web --browser safari --version 7 ' +
              '--platform "Mac 10.9"');
});
