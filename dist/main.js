"use strict";

var runner = require("./runner.js"),
    _ = require("underscore"),
    opts = require("./parser.js").parse(),
    testsMap = require("./parser.js").testsMap,
    setup = require("./setup.js"),
    monocle = require("monocle-js");

monocle.run(regeneratorRuntime.mark(function callee$0$0() {
  var config, caps;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if (!(_.has(opts, "setup") && opts.setup)) {
          context$1$0.next = 4;
          break;
        }

        context$1$0.next = 3;
        return setup.interactiveSetup();

      case 3:
        process.exit(0);

      case 4:
        config = setup.getConfig();

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
        caps = {
          browserName: opts.browser,
          device: opts.device,
          version: opts.version.toString(),
          platform: opts.platform,
          name: testsMap[opts.test]
        };

        if (opts.orientation) {
          caps["device-orientation"] = opts.orientation;
        }
        context$1$0.next = 12;
        return runner.run(_.extend({
          testType: opts.test,
          wait: opts.wait,
          localname: opts.localname,
          configName: opts.config,
          runs: opts.runs,
          framework: opts.framework,
          processes: opts.processes,
          backendVersion: opts.backendVersion
        }, config[opts.config]), caps);

      case 12:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));