"use strict";

var path = require('path')
  , fs = require('monocle-fs')
  , monocle = require('monocle-js')
  , o_O = monocle.o_O
  , o_C = monocle.o_C
  , rawPrompt = require('prompt')
  , _ = require('underscore');

var prompt = {
  start: rawPrompt.start,
  get: o_O(function*() {
    var cb = o_C();
    var args = Array.prototype.slice.call(arguments);
    args.push(cb);
    rawPrompt.get.apply(null, args);
    return (yield cb);
  })
};

exports.getConfig = o_O(function*() {
  var configFile = path.resolve(process.env.HOME, ".runsauce.json");
  var config;
  try {
    config = require(configFile);
  } catch (e) {
    config = null;
  }
});

exports.interactiveSetup = o_O(function*() {
  console.log("Running setup!");
  prompt.start();
  var config = yield exports.getConfig();
  //if (config) {
    console.log("A configuration file for runsauce already exists.");
    var proceed = yield prompt.get({
      description: "Are you sure you want to overwrite it? [Y/n] ",
      default: 'Y'
    });
    if (proceed === "Y") {
      console.log("ok");
    }
  //}
});
