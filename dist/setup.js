"use strict";

var path = require("path"),
    fs = require("monocle-fs"),
    monocle = require("monocle-js"),
    o_O = monocle.o_O,
    o_C = monocle.o_C,
    prompt = require("prompt"),
    configFile = path.resolve(process.env.HOME, ".runsauce.json");

prompt.message = ">";
prompt.delimiter = " ";
prompt.colors = false;

var getInput = o_O(regeneratorRuntime.mark(function callee$0$0() {
  var _arguments = arguments;
  var cb, args;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        cb = o_C();
        args = Array.prototype.slice.call(_arguments);

        args.push(cb);
        prompt.get.apply(null, args);
        context$1$0.next = 6;
        return cb;

      case 6:
        return context$1$0.abrupt("return", context$1$0.sent);

      case 7:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

var promptOverwrite = o_O(regeneratorRuntime.mark(function callee$0$1(config) {
  var res;
  return regeneratorRuntime.wrap(function callee$0$1$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        console.log("A configuration file for runsauce already exists.");
        context$1$0.next = 3;
        return getInput({
          name: "proceed",
          description: "Are you sure you want to overwrite it?",
          "default": "Y",
          type: "string",
          required: true
        });

      case 3:
        res = context$1$0.sent;

        if (res.proceed !== "Y") {
          process.exit(0);
        }
        context$1$0.next = 7;
        return fs.writeFile(configFile + ".bak", JSON.stringify(config));

      case 7:
        console.log("Backup written to " + configFile + ".bak");

      case 8:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$1, this);
}));

var promptForConfig = o_O(regeneratorRuntime.mark(function callee$0$2() {
  var res;
  return regeneratorRuntime.wrap(function callee$0$2$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        console.log("\nAlright, let's add your Sauce config");
        context$1$0.next = 3;
        return getInput([{
          name: "userName",
          description: "Production username",
          "default": process.env.SAUCE_USERNAME,
          type: "string",
          required: true
        }, {
          name: "accessKey",
          description: "Production access key",
          "default": process.env.SAUCE_ACCESS_KEY,
          type: "string",
          required: true
        }]);

      case 3:
        res = context$1$0.sent;
        return context$1$0.abrupt("return", {
          prod: {
            server: "ondemand.saucelabs.com",
            port: 80,
            userName: res.userName,
            accessKey: res.accessKey,
            jsRestEndpoint: "https://saucelabs.com/rest/v1/" + res.userName + "/js-tests"
          }
        });

      case 5:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$2, this);
}));

exports.getConfig = function () {
  var config;
  try {
    config = require(configFile);
  } catch (e) {
    console.log(e);
    config = null;
  }
  return config;
};

exports.interactiveSetup = o_O(regeneratorRuntime.mark(function callee$0$3() {
  var config;
  return regeneratorRuntime.wrap(function callee$0$3$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        console.log("Running setup!");
        console.log("--------------");
        prompt.start();
        config = exports.getConfig();

        if (!config) {
          context$1$0.next = 7;
          break;
        }

        context$1$0.next = 7;
        return promptOverwrite(config);

      case 7:
        context$1$0.next = 9;
        return promptForConfig();

      case 9:
        config = context$1$0.sent;
        context$1$0.next = 12;
        return fs.writeFile(configFile, JSON.stringify(config));

      case 12:
        console.log("\nOK, config has been written to " + configFile);
        console.log("\nIt's just JSON, so you can add your own configs as well");
        console.log("Maybe add your stewardess as 'dev'?");
        console.log("\nBye now! You could try to run something, like:");
        console.log("> runsauce --test web --browser safari --version 7 " + "--platform \"Mac 10.9\"");

      case 17:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$3, this);
}));