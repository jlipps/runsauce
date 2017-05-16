let opts = {c: 'prod', u: 'appium-fraud-matrix-%t', n: 20,
            name: "Appium iOS fraud warning capability test"};
opts.tests = [{
  a: ['1.0.0', '1.1.0', '1.2.4', '1.3.6', '1.3.7-beta'],
  v: ['6.1', '7.0', '7.1', '8.0|a>=1.3.6', '8.1|a>=1.3.6', '8.2|a>=1.3.7-beta'],
  t: 'web_fraud',
  r: 1,
  b: 's',
  d: ['ip', 'ipa']
}];

module.exports = opts;
