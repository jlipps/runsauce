let opts = {c: 'prod', u: 'appium-new-androids-matrix-%t', n: 40, name: 'New Androids'};
//let appiumVers = ['1.6.3', '1.6.4'];
let appiumVers = ['1.6.3', '1.6.4'];
let vers = ['6.0', '7.0'];
opts.tests = [{
  a: appiumVers,
  r: 10,
  v: vers,
  t: ['android', 'web_guinea'],
  d: ['Android GoogleAPI Emulator']
}];

module.exports = opts;
