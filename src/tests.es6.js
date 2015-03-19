import { run as runJsUnit } from './js-unit';
import { retryInterval } from 'asyncbox';
import wd from 'wd';
import 'should';

const Asserter = wd.asserters.Asserter;
let tests = {};

function titleToMatch (match) {
  return new Asserter(function (driver, cb) {
    driver.title().then((title) => {
      title.should.contain(match);
      return true;
    }).nodeify(cb);
  });
}

function contexts () {
  return new Asserter(function (driver, cb) {
    driver.contexts().then((contexts) => {
      contexts.length.should.be.above(1);
      return true;
    }).nodeify(cb);
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
  throw new Error("Couldn't find a webview in contexts: " +
                  JSON.stringify(ctxs));
}

function isAppium1 (caps) {
  return caps.appiumVersion && parseFloat(caps.appiumVersion) >= 1;
}

tests.webTest = async function (driver) {
  await driver.get("http://saucelabs.com/test/guinea-pig");
  await driver.waitFor(titleToMatch("I am a page title"), 10000, 1000);
};

tests.longWebTest = async function (driver) {
  for (let i = 0; i < 10; i++) {
    await driver.get("http://saucelabs.com/test/guinea-pig");
    await driver.waitFor(titleToMatch("I am a page title"), 10000, 1000);
    await driver.sleep(2000);
  }
};

tests.guineaPigTest = async function (driver) {
  await driver.get("http://saucelabs.com/test/guinea-pig");
  await driver.waitFor(titleToMatch("I am a page title"), 10000, 1000);
  await driver.elementById('comments').sendKeys("Hello! I am fine");
  await driver.elementById('submit').click();
  await retryInterval(10, 1000, async () => {
    let text = await driver.elementById('your_comments').text();
    text.should.include("Hello! I am fine");
  });
};

let localTest = async function (driver, url) {
  await driver.get(url);
  let h1 = await driver.elementByTagName('h1');
  (await h1.text()).should.include("the server of awesome");
};


tests.webTestConnect = async function (driver) {
  await localTest(driver, "http://localhost:8000");
};

tests.webTestLocalName = async function (driver, opts) {
  let host = opts.localname;
  if (host === "" || host === "localhost" || host.indexOf(".local") === -1) {
    throw new Error("Can't run local name test without an interesting hostname");
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

tests.iosHybridTest = async function (driver, caps) {
  if (!isAppium1(caps)) {
    throw new Error("Hybrid test only works with Appium 1 caps");
  }
  let ctxs = await driver.contexts();
  ctxs.length.should.be.above(0);
  await driver.context(ctxs[ctxs.length - 1]);
  await driver.get("http://google.com");
  await driver.waitFor(titleToMatch("Google"), 10000, 1000);
  await driver.context(ctxs[0]);
  (await driver.source()).should.include("<AppiumAUT>");
};

tests.iosLocServTest = async function (driver) {
  let uiSwitch = await driver.elementByClassName('UIASwitch');
  (await uiSwitch.getAttribute('value')).should.eql(1);
};
tests.iosLocServTest.extraCaps = {
  locationServicesAuthorized: true,
  locationServicesEnabled: true,
  bundleId: 'io.appium.TestApp'
};

tests.androidTest = async function (driver, caps) {
  await androidCycle(driver, caps);
};

tests.androidLongTest = async function (driver, caps) {
  for (let i = 0; i < 15; i++) {
    await androidCycle(driver, caps);
  }
};

async function androidCycle (driver, caps) {
  let appium1 = isAppium1(caps);
  if (appium1) {
    await driver.elementByAccessibilityId("Add Contact").click();
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
  "My Name".should.equal(await fs[0].text());
  "someone@somewhere.com".should.equal(await fs[2].text());
  await driver.back();
  await driver.sleep(2);
  let text;
  if (appium1) {
    text = await driver.elementByClassName("android.widget.Button").text();
  } else {
    text = await driver.elementByTagName("button").text();
  }
  text.should.equal("Add Contact");
  let cb;
  if (appium1) {
    cb = await driver.elementByXPath("//android.widget.CheckBox");
  } else {
    cb = await driver.elementByXPath("//checkBox");
  }
  await cb.click();
  "Show Invisible Contacts (Only)".should.equal(await cb.text());
}

tests.selendroidTest = async function (driver) {
  await driver.elementById("buttonStartWebView").click();
  await driver.elementByClassName("android.webkit.WebView");
  await driver.window("WEBVIEW");
  await driver.sleep(6);
  let f = await driver.elementById("name_input");
  // TODO: uncomment following line when selendroid fixes #492
  //await f.clear();
  await f.sendKeys("Test string");
  (await f.getAttribute('value')).toLowerCase().should.include("test string");
  await driver.elementByCss("input[type=submit]").click();
  await driver.sleep(3);
  "This is my way of saying hello".should
    .equal(await driver.elementByTagName("h1").text());
};

tests.androidHybridTest = async function (driver) {
  await selectWebview(driver);
  let el = await driver.elementById('i_am_a_textbox');
  await el.clear();
  await el.sendKeys("Test string");
  let refreshedEl = await driver.elementById('i_am_a_textbox');
  "Test string".should.equal(await refreshedEl.getAttribute('value'));
};

tests.jsTest = async function (driver, caps, opts) {
  await runJsUnit(driver, caps, opts);
};

export { tests };
