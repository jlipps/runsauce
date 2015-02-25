import { run as runLocalServer,
         stop as stopLocalServer } from './localserver.js';
import { run as runJsUnit } from './js-unit';
import 'should';

let tests = {};

function isAppium1 (caps) {
  return caps.appiumVersion && parseFloat(caps.appiumVersion) >= 1;
}

let start = async function (driver, caps) {
  let startTime = Date.now();
  await driver.init(caps);
  await driver.setImplicitWaitTimeout(15000);
  return (Date.now() - startTime);
};

tests.webTest = async function (driver, caps) {
  let startupTime = await start(driver, caps);
  await driver.get("http://google.com");
  (await driver.title()).should.include("Google");
  return startupTime;
};

tests.longWebTest = async function (driver, caps) {
  let startupTime = await start(driver, caps);
  for (let i = 0; i < 10; i++) {
    await driver.get("http://google.com");
    (await driver.title()).should.include("Google");
    await driver.sleep(2000);
  }
  return startupTime;
};

let localTest = async function (driver, caps, url) {
  runLocalServer();
  let startupTime;
  try {
    startupTime = await start(driver, caps);
    await driver.get(url);
    let h1 = await driver.elementByTagName('h1');
    (await h1.text()).should.include("the server of awesome");
  } catch (e) {
    await stopLocalServer();
    throw e;
  }
  await stopLocalServer();
  return startupTime;
};


tests.webTestConnect = async function (driver, caps) {
  return (await localTest(driver, caps, "http://localhost:8000"));
};

tests.webTestLocalName = async function (driver, caps, opts) {
  let host = opts.localname;
  if (host === "" || host === "localhost" || host.indexOf(".local") === -1) {
    throw new Error("Can't run local name test without an interesting hostname");
  }
  return (await localTest(driver, caps, "http://" + host + ":8000"));
};

tests.webTestHttps = async function (driver, caps) {
  let startupTime = await start(driver, caps);
  await driver.get("https://buildslave.saucelabs.com");
  (await driver.title()).should.include("Sauce Labs");
  return startupTime;
};

tests.webTestHttpsSelfSigned = async function (driver, caps) {
  caps.keepKeyChains = true;
  let startupTime = await start(driver, caps);
  await driver.get("https://selfsigned.buildslave.saucelabs.com");
  (await driver.title()).should.include("Sauce Labs");
  return startupTime;
};

tests.iosTest = async function (driver, caps) {
  let startupTime = await start(driver, caps);
  let appium1 = isAppium1(caps);
  let fs;
  if (appium1) {
    fs = await driver.elementsByClassName('UIATextField');
  } else {
    fs = await driver.elementsByTagName('textField');
  }
  await fs[0].sendKeys('4');
  await fs[1].sendKeys('5');
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
  return startupTime;
};

tests.iosHybridTest = async function (driver, caps) {
  if (!isAppium1(caps)) {
    throw new Error("Hybrid test only works with Appium 1 caps");
  }
  let startupTime = await start(driver, caps);
  let ctxs = await driver.contexts();
  ctxs.length.should.be.above(0);
  await driver.context(ctxs[ctxs.length - 1]);
  await driver.get("http://google.com");
  (await driver.title()).should.include("Google");
  await driver.context(ctxs[0]);
  (await driver.source()).should.include("<AppiumAUT>");
  return startupTime;
};

tests.androidTest = async function (driver, caps) {
  let startupTime = await start(driver, caps);
  await androidCycle(driver, caps);
  return startupTime;
};

tests.androidLongTest = async function (driver, caps) {
  let startupTime = await start(driver, caps);
  for (let i = 0; i < 15; i++) {
    await androidCycle(driver, caps);
  }
  return startupTime;
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

tests.selendroidTest = async function (driver, caps) {
  let startupTime = await start(driver, caps);
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
  return startupTime;
};

tests.androidHybridTest = async function (driver, caps) {
  let startupTime = await start(driver, caps);
  await driver.sleep(3);
  let ctxs = await driver.contexts();
  await driver.context(ctxs[ctxs.length - 1]);
  let el = await driver.elementById('i_am_a_textbox');
  await el.clear();
  await el.type("Test string");
  "Test string".should.equal(await el.getAttribute('value'));
  return startupTime;
};

tests.jsTest = async function (driver, caps, opts){
  await runJsUnit(driver, caps, opts);
  return 0;
};

export { tests };
