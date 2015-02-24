"use strict";

var tests = {},
    monocle = require("monocle-js"),
    o_O = monocle.o_O,
    localServer = require("./localserver.js"),
    jsUnit = require("./js-unit");

require("should");

var isAppium1 = function isAppium1(caps) {
  return caps.appiumVersion && parseFloat(caps.appiumVersion) >= 1;
};

var start = o_O(regeneratorRuntime.mark(function callee$0$0(driver, caps) {
  var startTime;
  return regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        startTime = Date.now();
        context$1$0.next = 3;
        return driver.init(caps);

      case 3:
        context$1$0.next = 5;
        return driver.setImplicitWaitTimeout(15000);

      case 5:
        return context$1$0.abrupt("return", Date.now() - startTime);

      case 6:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$0, this);
}));

tests.webTest = o_O(regeneratorRuntime.mark(function callee$0$1(driver, caps) {
  var startupTime;
  return regeneratorRuntime.wrap(function callee$0$1$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return start(driver, caps);

      case 2:
        startupTime = context$1$0.sent;
        context$1$0.next = 5;
        return driver.get("http://google.com");

      case 5:
        context$1$0.next = 7;
        return driver.title();

      case 7:
        context$1$0.sent.should.include("Google");
        return context$1$0.abrupt("return", startupTime);

      case 9:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$1, this);
}));

tests.longWebTest = o_O(regeneratorRuntime.mark(function callee$0$2(driver, caps) {
  var startupTime, i;
  return regeneratorRuntime.wrap(function callee$0$2$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return start(driver, caps);

      case 2:
        startupTime = context$1$0.sent;
        i = 0;

      case 4:
        if (!(i < 10)) {
          context$1$0.next = 15;
          break;
        }

        context$1$0.next = 7;
        return driver.get("http://google.com");

      case 7:
        context$1$0.next = 9;
        return driver.title();

      case 9:
        context$1$0.sent.should.include("Google");
        context$1$0.next = 12;
        return driver.sleep(2000);

      case 12:
        i++;
        context$1$0.next = 4;
        break;

      case 15:
        return context$1$0.abrupt("return", startupTime);

      case 16:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$2, this);
}));

var localTest = o_O(regeneratorRuntime.mark(function callee$0$3(driver, caps, url) {
  var startupTime, h1;
  return regeneratorRuntime.wrap(function callee$0$3$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        localServer.run();
        context$1$0.prev = 1;
        context$1$0.next = 4;
        return start(driver, caps);

      case 4:
        startupTime = context$1$0.sent;
        context$1$0.next = 7;
        return driver.get(url);

      case 7:
        context$1$0.next = 9;
        return driver.elementByTagName("h1");

      case 9:
        h1 = context$1$0.sent;
        context$1$0.next = 12;
        return h1.text();

      case 12:
        context$1$0.sent.should.include("the server of awesome");
        context$1$0.next = 20;
        break;

      case 15:
        context$1$0.prev = 15;
        context$1$0.t1 = context$1$0["catch"](1);
        context$1$0.next = 19;
        return localServer.stop();

      case 19:
        throw context$1$0.t1;

      case 20:
        context$1$0.next = 22;
        return localServer.stop();

      case 22:
        return context$1$0.abrupt("return", startupTime);

      case 23:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$3, this, [[1, 15]]);
}));

tests.webTestConnect = o_O(regeneratorRuntime.mark(function callee$0$4(driver, caps) {
  return regeneratorRuntime.wrap(function callee$0$4$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return localTest(driver, caps, "http://localhost:8000");

      case 2:
        return context$1$0.abrupt("return", context$1$0.sent);

      case 3:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$4, this);
}));

tests.webTestLocalName = o_O(regeneratorRuntime.mark(function callee$0$5(driver, caps, opts) {
  var host;
  return regeneratorRuntime.wrap(function callee$0$5$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        host = opts.localname;

        if (!(host === "" || host === "localhost" || host.indexOf(".local") === -1)) {
          context$1$0.next = 3;
          break;
        }

        throw new Error("Can't run local name test without an interesting hostname");

      case 3:
        context$1$0.next = 5;
        return localTest(driver, caps, "http://" + host + ":8000");

      case 5:
        return context$1$0.abrupt("return", context$1$0.sent);

      case 6:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$5, this);
}));

tests.webTestHttps = o_O(regeneratorRuntime.mark(function callee$0$6(driver, caps) {
  var startupTime;
  return regeneratorRuntime.wrap(function callee$0$6$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return start(driver, caps);

      case 2:
        startupTime = context$1$0.sent;
        context$1$0.next = 5;
        return driver.get("https://buildslave.saucelabs.com");

      case 5:
        context$1$0.next = 7;
        return driver.title();

      case 7:
        context$1$0.sent.should.include("Sauce Labs");
        return context$1$0.abrupt("return", startupTime);

      case 9:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$6, this);
}));

tests.webTestHttpsSelfSigned = o_O(regeneratorRuntime.mark(function callee$0$7(driver, caps) {
  var startupTime;
  return regeneratorRuntime.wrap(function callee$0$7$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        caps.keepKeyChains = true;
        context$1$0.next = 3;
        return start(driver, caps);

      case 3:
        startupTime = context$1$0.sent;
        context$1$0.next = 6;
        return driver.get("https://selfsigned.buildslave.saucelabs.com");

      case 6:
        context$1$0.next = 8;
        return driver.title();

      case 8:
        context$1$0.sent.should.include("Sauce Labs");
        return context$1$0.abrupt("return", startupTime);

      case 10:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$7, this);
}));

tests.iosTest = o_O(regeneratorRuntime.mark(function callee$0$8(driver, caps) {
  var startupTime, appium1, fs, text;
  return regeneratorRuntime.wrap(function callee$0$8$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return start(driver, caps);

      case 2:
        startupTime = context$1$0.sent;
        appium1 = isAppium1(caps);

        if (!appium1) {
          context$1$0.next = 10;
          break;
        }

        context$1$0.next = 7;
        return driver.elementsByClassName("UIATextField");

      case 7:
        fs = context$1$0.sent;
        context$1$0.next = 13;
        break;

      case 10:
        context$1$0.next = 12;
        return driver.elementsByTagName("textField");

      case 12:
        fs = context$1$0.sent;

      case 13:
        context$1$0.next = 15;
        return fs[0].sendKeys("4");

      case 15:
        context$1$0.next = 17;
        return fs[1].sendKeys("5");

      case 17:
        if (!appium1) {
          context$1$0.next = 22;
          break;
        }

        context$1$0.next = 20;
        return driver.elementByClassName("UIAButton").click();

      case 20:
        context$1$0.next = 24;
        break;

      case 22:
        context$1$0.next = 24;
        return driver.elementByTagName("button").click();

      case 24:
        if (!appium1) {
          context$1$0.next = 30;
          break;
        }

        context$1$0.next = 27;
        return driver.elementByClassName("UIAStaticText").text();

      case 27:
        text = context$1$0.sent;
        context$1$0.next = 33;
        break;

      case 30:
        context$1$0.next = 32;
        return driver.elementByTagName("staticText").text();

      case 32:
        text = context$1$0.sent;

      case 33:
        text.should.equal("9");
        return context$1$0.abrupt("return", startupTime);

      case 35:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$8, this);
}));

tests.iosHybridTest = o_O(regeneratorRuntime.mark(function callee$0$9(driver, caps) {
  var startupTime, ctxs;
  return regeneratorRuntime.wrap(function callee$0$9$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if (isAppium1(caps)) {
          context$1$0.next = 2;
          break;
        }

        throw new Error("Hybrid test only works with Appium 1 caps");

      case 2:
        context$1$0.next = 4;
        return start(driver, caps);

      case 4:
        startupTime = context$1$0.sent;
        context$1$0.next = 7;
        return driver.contexts();

      case 7:
        ctxs = context$1$0.sent;

        ctxs.length.should.be.above(0);
        context$1$0.next = 11;
        return driver.context(ctxs[ctxs.length - 1]);

      case 11:
        context$1$0.next = 13;
        return driver.get("http://google.com");

      case 13:
        context$1$0.next = 15;
        return driver.title();

      case 15:
        context$1$0.sent.should.include("Google");
        context$1$0.next = 18;
        return driver.context(ctxs[0]);

      case 18:
        context$1$0.next = 20;
        return driver.source();

      case 20:
        context$1$0.sent.should.include("<AppiumAUT>");
        return context$1$0.abrupt("return", startupTime);

      case 22:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$9, this);
}));

tests.androidTest = o_O(regeneratorRuntime.mark(function callee$0$10(driver, caps) {
  var startupTime;
  return regeneratorRuntime.wrap(function callee$0$10$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return start(driver, caps);

      case 2:
        startupTime = context$1$0.sent;
        context$1$0.next = 5;
        return androidCycle(driver, caps);

      case 5:
        return context$1$0.abrupt("return", startupTime);

      case 6:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$10, this);
}));

tests.androidLongTest = o_O(regeneratorRuntime.mark(function callee$0$11(driver, caps) {
  var startupTime, i;
  return regeneratorRuntime.wrap(function callee$0$11$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return start(driver, caps);

      case 2:
        startupTime = context$1$0.sent;
        i = 0;

      case 4:
        if (!(i < 15)) {
          context$1$0.next = 10;
          break;
        }

        context$1$0.next = 7;
        return androidCycle(driver, caps);

      case 7:
        i++;
        context$1$0.next = 4;
        break;

      case 10:
        return context$1$0.abrupt("return", startupTime);

      case 11:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$11, this);
}));

var androidCycle = o_O(regeneratorRuntime.mark(function callee$0$12(driver, caps) {
  var appium1, fs, text, cb;
  return regeneratorRuntime.wrap(function callee$0$12$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        appium1 = isAppium1(caps);

        if (!appium1) {
          context$1$0.next = 6;
          break;
        }

        context$1$0.next = 4;
        return driver.elementByAccessibilityId("Add Contact").click();

      case 4:
        context$1$0.next = 8;
        break;

      case 6:
        context$1$0.next = 8;
        return driver.elementByName("Add Contact").click();

      case 8:
        if (!appium1) {
          context$1$0.next = 14;
          break;
        }

        context$1$0.next = 11;
        return driver.elementsByClassName("android.widget.EditText");

      case 11:
        fs = context$1$0.sent;
        context$1$0.next = 17;
        break;

      case 14:
        context$1$0.next = 16;
        return driver.elementsByTagName("textfield");

      case 16:
        fs = context$1$0.sent;

      case 17:
        context$1$0.next = 19;
        return fs[0].sendKeys("My Name");

      case 19:
        context$1$0.next = 21;
        return fs[2].sendKeys("someone@somewhere.com");

      case 21:
        context$1$0.next = 23;
        return fs[0].text();

      case 23:
        context$1$0.t2 = context$1$0.sent;
        "My Name".should.equal(context$1$0.t2);
        context$1$0.next = 27;
        return fs[2].text();

      case 27:
        context$1$0.t3 = context$1$0.sent;
        "someone@somewhere.com".should.equal(context$1$0.t3);
        context$1$0.next = 31;
        return driver.back();

      case 31:
        context$1$0.next = 33;
        return driver.sleep(2);

      case 33:
        if (!appium1) {
          context$1$0.next = 39;
          break;
        }

        context$1$0.next = 36;
        return driver.elementByClassName("android.widget.Button").text();

      case 36:
        text = context$1$0.sent;
        context$1$0.next = 42;
        break;

      case 39:
        context$1$0.next = 41;
        return driver.elementByTagName("button").text();

      case 41:
        text = context$1$0.sent;

      case 42:
        text.should.equal("Add Contact");

        if (!appium1) {
          context$1$0.next = 49;
          break;
        }

        context$1$0.next = 46;
        return driver.elementByXPath("//android.widget.CheckBox");

      case 46:
        cb = context$1$0.sent;
        context$1$0.next = 52;
        break;

      case 49:
        context$1$0.next = 51;
        return driver.elementByXPath("//checkBox");

      case 51:
        cb = context$1$0.sent;

      case 52:
        context$1$0.next = 54;
        return cb.click();

      case 54:
        context$1$0.next = 56;
        return cb.text();

      case 56:
        context$1$0.t4 = context$1$0.sent;
        "Show Invisible Contacts (Only)".should.equal(context$1$0.t4);

      case 58:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$12, this);
}));

tests.selendroidTest = o_O(regeneratorRuntime.mark(function callee$0$13(driver, caps) {
  var startupTime, f;
  return regeneratorRuntime.wrap(function callee$0$13$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return start(driver, caps);

      case 2:
        startupTime = context$1$0.sent;
        context$1$0.next = 5;
        return driver.elementById("buttonStartWebView").click();

      case 5:
        context$1$0.next = 7;
        return driver.elementByClassName("android.webkit.WebView");

      case 7:
        context$1$0.next = 9;
        return driver.window("WEBVIEW");

      case 9:
        context$1$0.next = 11;
        return driver.sleep(6);

      case 11:
        context$1$0.next = 13;
        return driver.elementById("name_input");

      case 13:
        f = context$1$0.sent;
        context$1$0.next = 16;
        return f.sendKeys("Test string");

      case 16:
        context$1$0.next = 18;
        return f.getAttribute("value");

      case 18:
        context$1$0.sent.toLowerCase().should.include("test string");
        context$1$0.next = 21;
        return driver.elementByCss("input[type=submit]").click();

      case 21:
        context$1$0.next = 23;
        return driver.sleep(3);

      case 23:
        context$1$0.next = 25;
        return driver.elementByTagName("h1").text();

      case 25:
        context$1$0.t5 = context$1$0.sent;
        "This is my way of saying hello".should.equal(context$1$0.t5);
        return context$1$0.abrupt("return", startupTime);

      case 28:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$13, this);
}));

tests.androidHybridTest = o_O(regeneratorRuntime.mark(function callee$0$14(driver, caps) {
  var startupTime, ctxs, el;
  return regeneratorRuntime.wrap(function callee$0$14$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return start(driver, caps);

      case 2:
        startupTime = context$1$0.sent;
        context$1$0.next = 5;
        return driver.sleep(3);

      case 5:
        context$1$0.next = 7;
        return driver.contexts();

      case 7:
        ctxs = context$1$0.sent;
        context$1$0.next = 10;
        return driver.context(ctxs[ctxs.length - 1]);

      case 10:
        context$1$0.next = 12;
        return driver.elementById("i_am_a_textbox");

      case 12:
        el = context$1$0.sent;
        context$1$0.next = 15;
        return el.clear();

      case 15:
        context$1$0.next = 17;
        return el.type("Test string");

      case 17:
        context$1$0.next = 19;
        return el.getAttribute("value");

      case 19:
        context$1$0.t6 = context$1$0.sent;
        "Test string".should.equal(context$1$0.t6);
        return context$1$0.abrupt("return", startupTime);

      case 22:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$14, this);
}));

tests.jsTest = o_O(regeneratorRuntime.mark(function callee$0$15(driver, caps, opts) {
  return regeneratorRuntime.wrap(function callee$0$15$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return jsUnit.run(driver, caps, opts);

      case 2:
        return context$1$0.abrupt("return", 0);

      case 3:
      case "end":
        return context$1$0.stop();
    }
  }, callee$0$15, this);
}));

module.exports = tests;

// TODO: uncomment following line when selendroid fixes #492
//yield f.clear();