let opts = {c: 'prod', u: 'appium-ios-stress-matrix-%t', n: 40, name: 'Appium iOS Stress Matrix'};
//let appiumVers = ['1.6.3', '1.6.4'];
let appiumVers = ['1.6.4'];
let iosVers = ['10.0', '10.2'];
opts.tests = [{
  a: appiumVers,
  r: 5,
  v: iosVers,
  t: ['ios_sk'],
  d: ['ip'],
  e: '{"maxTypingFrequency": 8}'
}];

module.exports = opts;
