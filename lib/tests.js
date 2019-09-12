const { retryInterval, sleep } = require('asyncbox');
const wd = require('wd');
const _ = require('lodash');
const should = require('should');


const Asserter = wd.asserters.Asserter;
let tests = {};

function markAssertionErrorForRetry (err) {
  err.retriable = err instanceof should.AssertionError;
  throw err;
}

function titleToMatch (match) {
  return new Asserter(function (driver) {
    return driver.title().then((title) => {
      title.should.containEql(match);
      return title;
    }).catch(markAssertionErrorForRetry);
  });
}

function contexts () {
  return new Asserter(function (driver) {
    return driver.contexts().then((contexts) => {
      contexts.length.should.be.above(1);
      return contexts;
    }).catch(markAssertionErrorForRetry);
  });
}

async function selectWebview (driver) {
  await driver.waitFor(contexts(), 10000, 1000);
  let ctxs = await driver.contexts();
  for (let c of ctxs) {
    if (c !== 'NATIVE_APP') {
      await driver.context(c);
      return;
    }
  }
  throw new Error("Couldn't find a webview in contexts: " + JSON.stringify(ctxs));
}

function isAppium1 (caps) {
  return caps.appiumVersion && parseFloat(caps.appiumVersion) >= 1;
}

tests.webTest = async function (driver) {
  await driver.get("https://saucelabs.github.io/training-test-page");
  await driver.waitFor(titleToMatch("I am a page title"), 10000, 1000);
};

tests.longWebTest = async function (driver) {
  for (let i = 0; i < 10; i++) {
    await driver.get("https://saucelabs.github.io/training-test-page");
    await driver.waitFor(titleToMatch("I am a page title"), 10000, 1000);
    await driver.sleep(2000);
  }
};

tests.webTestFraud = async function (driver) {
  await driver.get("http://foo:bar@saucelabs.com/test/guinea-pig");
  await driver.waitFor(titleToMatch("I am a page title"), 7000, 700);
};
tests.webTestFraud.extraCaps = {safariIgnoreFraudWarning: true};

tests.guineaPigTest = async function (driver) {
  await driver.get("https://saucelabs.github.io/training-test-page");
  await driver.waitFor(titleToMatch("I am a page title"), 10000, 1000);
  await driver.elementById('comments').sendKeys("Hello! I am fine");
  await driver.elementById('submit').click();
  await retryInterval(10, 1000, async () => {
    let text = await driver.elementById('your_comments').text();
    text.should.containEql("Hello! I am fine");
  });
};

tests.animationsPerformanceTest = async function (driver) {
  await driver.elementByXPath('//XCUIElementTypeStaticText[@name="Animations test"]').click();
  for (let i=0; i<10; i++) {
    await sleep(30000);
    await driver.getSessionId();
  }
};

let localTest = async function (driver, url) {
  await driver.get(url);
  let h1 = await driver.elementByTagName('h1');
  (await h1.text()).should.containEql("the server of awesome");
};


tests.webTestConnect = async function (driver) {
  await localTest(driver, "http://localhost:8000");
};

tests.webTestLocalName = async function (driver, caps, opts) {
  let host = opts.localname;
  if (!host || host === "" || host === "localhost") {
    throw new Error("Can't run local name test without an interesting " +
                    "hostname. Please use the 'localname' option.");
  }
  await localTest(driver, "http://" + host + ":8000");
};

tests.webTestHttps = async function (driver) {
  await driver.get("https://buildslave.saucelabs.com");
  await driver.waitFor(titleToMatch("Sauce Labs"), 10000, 1000);
};

tests.webTestHttpsSelfSigned = async function (driver) {
  await driver.get("https://selfsigned.buildslave.saucelabs.com");
  await driver.waitFor(titleToMatch("Sauce Labs"), 10000, 1000);
};
tests.webTestHttpsSelfSigned.extraCaps = {
  keepKeyChains: true
};

tests.iosTest = async function (driver, caps) {
  let appium1 = isAppium1(caps);
  let fs;
  if (appium1) {
    // we might get an alert saying the app is slow, click the OK button
    // if it's there
    if (parseFloat(caps.platformVersion) < 10.2) {
      try {
        await driver.elementByAccessibilityId('OK').click();
      } catch (ign) {}
    }
    fs = await driver.elementsByClassName('UIATextField');
  } else {
    fs = await driver.elementsByTagName('textField');
  }
  // some early versions of appium didn't filter out the extra text fields
  // that UIAutomation started putting in, so make the test sensitive
  // to that
  let firstField = fs[0], secondField;
  if (fs.length === 2) {
    secondField = fs[1];
  } else if (fs.length === 4) {
    secondField = fs[2];
  } else {
    throw new Error("Got strange number of fields in testapp: " + fs.length);
  }
  await firstField.sendKeys('4');
  await secondField.sendKeys('5');
  if (appium1) {
    await driver.elementByClassName("UIAButton").click();
  } else {
    await driver.elementByTagName("button").click();
  }
  let text;
  if (appium1) {
    text = await driver.elementByClassName('UIAStaticText').text();
  } else {
    text = await driver.elementByTagName('staticText').text();
  }
  text.should.equal('9');
};

async function iosCycle (driver, caps) {
  let appium1 = isAppium1(caps);
  let el;
  if (appium1) {
    el = await driver.elementByClassName('UIATextField');
  } else {
    el = await driver.elementByTagName('textField');
  }
  await el.sendKeys('123');
  await el.clear();
}

tests.iosSendKeysStressTest = async function (driver, caps) {
  try {
    await driver.elementByAccessibilityId('OK').click();
  } catch (ign) {}
  for (let i = 0; i < (process.env.STRESS_TIMES || 50); i++) {
    try {
      await iosCycle(driver, caps);
    } catch (e) {
      throw new Error(`Failure on stress run ${i}: ${e}`);
    }
  }
}

tests.iosHybridTest = async function (driver, caps) {
  if (!isAppium1(caps)) {
    throw new Error("Hybrid test only works with Appium 1 caps");
  }
  await selectWebview(driver);
  await driver.get("https://google.com");
  await driver.waitFor(titleToMatch("Google"), 10000, 1000);
  await driver.context("NATIVE_APP");
  (await driver.source()).should.containEql("<AppiumAUT>");
};

tests.iosLocServTest = async function (driver) {
  await retryInterval(5, 1000, async () => {
    let uiSwitch = await driver.elementByClassName('UIASwitch');
    let res = await uiSwitch.getAttribute('value');
    [1, true].should.containEql(res);
  });
};
tests.iosLocServTest.extraCaps = {
  locationServicesAuthorized: true,
  locationServicesEnabled: true,
  bundleId: 'io.appium.TestApp'
};

tests.iosIwd = async function (driver, caps) {
  let appium1 = isAppium1(caps);
  let times = 30, timings = [];
  const maxTimeMs = 900;
  const loop = async () => {
    let start = Date.now();
    if (appium1) {
      await driver.elementsByClassName('UIATextField');
    } else {
      await driver.elementsByTagName('textField');
    }
    return Date.now() - start;
  };
  for (let i = 0; i < times; i++) {
    timings.push(await loop());
  }
  const avgTime = _.sum(timings) / times;
  if (avgTime > maxTimeMs) {
    throw new Error(`Expected average command time to be no greater than ` +
                    `${maxTimeMs}ms but it was ${avgTime}ms`);
  }
};

tests.androidTest = async function (driver, caps) {
  await androidCycle(driver, caps);
};

tests.androidLongTest = async function (driver, caps) {
  for (let i = 0; i < 15; i++) {
    await androidCycle(driver, caps);
  }
};

tests.androidLoadTest = async function (driver, caps) {
  const iterations = 20; // 10 minute runtime
  const intervalMs = 30000;

  let args = await driver.elementById('textOptions');
  let goBtn = await driver.elementById('go');

  await args.clear();
  await args.sendKeys(`-M 500 -v 20 -s ${Math.floor(iterations * intervalMs / 1000)}`);

  for (let i = 0; i < iterations; i++) {
    // Only the first click triggers the test, the rest of the clicks are ignored
    // and only to keep the session open whilst the test is running
    await goBtn.click();
    await driver.sleep(30000);
  }
};

async function androidCycle (driver, caps) {
  let appium1 = isAppium1(caps);
  if (appium1) {
    await driver.elementById("addContactButton").click();
  } else {
    await driver.elementByName("Add Contact").click();
  }
  let fs;
  if (appium1) {
    fs = await driver.elementsByClassName("android.widget.EditText");
  } else {
    fs = await driver.elementsByTagName("textfield");
  }
  await fs[0].sendKeys("My Name");
  await fs[2].sendKeys("someone@somewhere.com");
  // do contains search since RDC adds weird extra edit text
  (await fs[0].text()).should.containEql("My Name");
  (await fs[2].text()).should.containEql("someone@somewhere.com");
  await driver.back();
  await driver.sleep(2);
  let text;
  if (appium1) {
    text = await driver.elementByClassName("android.widget.Button").text();
  } else {
    text = await driver.elementByTagName("button").text();
  }
  ["add contact", "save"].should.containEql(text.toLowerCase());
  let cb = null;
  try {
    if (appium1) {
      cb = await driver.elementByXPath("//android.widget.CheckBox");
    } else {
      cb = await driver.elementByXPath("//checkBox");
    }
  } catch (e) {}
  if (cb) {
    await cb.click();
    "Show Invisible Contacts (Only)".should.equal(await cb.text());
  }
}

tests.selendroidTest = async function (driver) {
  await driver.elementById("buttonStartWebView").click();
  await driver.elementByClassName("android.webkit.WebView");
  await selectWebview(driver);
  await driver.sleep(6);
  let f = await driver.elementById("name_input");
  try {
    // selendroid #492, sometimes this errors
    await f.clear();
  } catch (e) {}
  await f.sendKeys("Test string");
  // test against lowercase to handle selendroid + android 4.0 bug
  (await f.getAttribute('value')).toLowerCase().should.containEql("test string");
  await driver.elementByCss("input[type=submit]").click();
  await driver.sleep(3);
  let h1Text = await driver.elementByTagName("h1").text();
  // some versions of selendroid have a bug where this is the empty string
  h1Text.should.match(/()|(This is my way of saying hello)/);
};

tests.androidHybridTest = async function (driver) {
  await selectWebview(driver);
  let el = await driver.elementById('i_am_a_textbox');
  await el.clear();
  await el.sendKeys("Test string");
  let refreshedEl = await driver.elementById('i_am_a_textbox');
  // test against lowercase to handle selendroid + android 4.0 bug
  "test string".should.equal((await refreshedEl.getAttribute('value')).toLowerCase());
};

tests.manualTest = async function (driver) {
  while (true) {
    process.on('SIGINT', function() {
      driver.quit();
      process.exit(0);
    })
    await driver.source();
    await sleep(30000);
    console.log("look at me! im a manual session!");
  }
};

module.exports = { tests };
