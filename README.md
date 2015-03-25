RunSauce
========

Run many kinds of simple tests with any [Sauce Labs](https://saucelabs.com)
options.

This is probably mostly useful for people who work at
[Sauce](https://github.com/saucelabs).

## Basic Usage

```bash
npm install -g runsauce

# configure with your username / access key
runsauce --setup

# run a test with all the default options
runsauce

# check out all the options
runsauce --help
runsauce --tests
runsauce --shortcuts

# do something craaazy, like run a test against a self-signed https cert
# on a dev server in Mac OS X 10.9 with Safari 7, doing this 10 times with
# 5 parallel tasks
runsauce -c dev -t selfsigned -p m9 -b s -v 7 -r 10 -n 5
```

## Running sets of tests

You can also specify complex sets of tests and platforms to run. First, create
a JSON file with your specification (notice the DSL you can use to restrict
combinations of platforms):

```
{
  "tests": [
    {
      "t": ["ios", "ios_hybrid", "ios_loc_serv"],
      "d": ["ip", "ipa|t=ios"],
      "v": ["6.1|a<=1.0", "7.0", "7.1", "8.0|a>=1.3.0", "8.1|a>=1.3.1"],
      "a": ["1.0", "1.1", "1.2", "1.3.4"]
    }, {
      "t": ["android_hybrid|v>=4.4", "selendroid"],
      "d": ["ae"],
      "v": ["2.3", "4.0", "4.2", "4.3", "4.4", "5.0|a>=1.2.2"],
      "a": ["1.0", "1.1", "1.2", "1.3.4"]
    }
  ],
  "c": "prod",
  "u": "appium-smoke-%t",
  "n": 12
}
```

This will take each test set and run every possible combination of test type,
device name, platform version, and Appium version (but it will filter out
combinations deemed unsuitable by the restrictions---e.g., a platform version
of `"6.1|a<=1.0"` means that it will run on 6.1, but only in the case where
the Appium version is <= 1.0). It will run these tests against the `prod`
config, and give a build name of `appium-smoke-%t` (where `%t` is replaced by
a timestamp). Finally, it will run at a concurrency of 12! I can now run
this "build" with the following command:

```
./bin/runsauce -i my-build.json
```

## Runsauce as a library

You can also build apps on top of runsauce. An example of this is in `src/matrix` (made available as `./bin/appium-matrix.js`. This app reads a "build" configuration (see above), then after running this puts together a 4-dimensional support matrix with stability annotations. It outputs to the command-line or as HTML. For example, let's say I have the desire to see how Appium fares across Appium versions and iOS versions with respect to the `safariIgnoreFraudWarning` capability. Then I can build a "build" configuration as follows in "fraud-build.js":

```
let opts = {c: 'prod', u: 'appium-fraud-matrix-%t', n: 20,
            name: "Appium iOS fraud warning capability test"};
opts.tests = [{
  a: ['1.0.0', '1.1.0', '1.2.4', '1.3.6', '1.3.7-beta'],
  v: ['6.1', '7.0', '7.1', '8.0|a>=1.3.6', '8.1|a>=1.3.6', '8.2|a>=1.3.7-beta'],
  t: 'web_fraud',
  b: 's',
  d: ['ip', 'ipa']
}];

export default opts;
```

Now I can run the matrix app, specifying my input file and telling it to run each combination 5 times so we can generate meaningful reliability statistics:

```
./bin/appium-matrix.js -d -r 5 -i fraud-build.js
```

Ultimately the app will output something like:

```
┌───────────────────┬───────────────────────────────┬───────────────────────────────┬───────────────────────────────┬─────────┬───────────────────────────────┬─────────┐
│                   │ iOS 6.1                       │ iOS 7.0                       │ iOS 7.1                       │ iOS 8.0 │ iOS 8.1                       │ iOS 8.2 │
├───────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┼─────────┼───────────────────────────────┼─────────┤
│ Appium 1.0.0      │ ┌───────────┬──────┬────────┐ │ ✗                             │ ✗                             │ —       │ —                             │ —       │
│                   │ │ 0.92      │ iPad │ iPhone │ │                               │                               │         │                               │         │
│                   │ ├───────────┼──────┼────────┤ │                               │                               │         │                               │         │
│                   │ │ web_fraud │ ✓    │ 0.83   │ │                               │                               │         │                               │         │
│                   │ └───────────┴──────┴────────┘ │                               │                               │         │                               │         │
├───────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┼─────────┼───────────────────────────────┼─────────┤
│ Appium 1.1.0      │ ✓                             │ ✗                             │ ✗                             │ —       │ —                             │ —       │
├───────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┼─────────┼───────────────────────────────┼─────────┤
│ Appium 1.2.4      │ ✓                             │ ✓                             │ ┌───────────┬────────┬──────┐ │ —       │ —                             │ —       │
│                   │                               │                               │ │ 0.92      │ iPhone │ iPad │ │         │                               │         │
│                   │                               │                               │ ├───────────┼────────┼──────┤ │         │                               │         │
│                   │                               │                               │ │ web_fraud │ ✓      │ 0.83 │ │         │                               │         │
│                   │                               │                               │ └───────────┴────────┴──────┘ │         │                               │         │
├───────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┼─────────┼───────────────────────────────┼─────────┤
│ Appium 1.3.6      │ ✓                             │ ┌───────────┬────────┬──────┐ │ ✓                             │ ✗       │ ✓                             │ —       │
│                   │                               │ │ 0.83      │ iPhone │ iPad │ │                               │         │                               │         │
│                   │                               │ ├───────────┼────────┼──────┤ │                               │         │                               │         │
│                   │                               │ │ web_fraud │ ✓      │ 0.67 │ │                               │         │                               │         │
│                   │                               │ └───────────┴────────┴──────┘ │                               │         │                               │         │
├───────────────────┼───────────────────────────────┼───────────────────────────────┼───────────────────────────────┼─────────┼───────────────────────────────┼─────────┤
│ Appium 1.3.7-beta │ ┌───────────┬────────┬──────┐ │ ┌───────────┬────────┬──────┐ │ ✓                             │ ✗       │ ┌───────────┬────────┬──────┐ │ ✓       │
│                   │ │ 0.92      │ iPhone │ iPad │ │ │ 0.83      │ iPhone │ iPad │ │                               │         │ │ 0.92      │ iPhone │ iPad │ │         │
│                   │ ├───────────┼────────┼──────┤ │ ├───────────┼────────┼──────┤ │                               │         │ ├───────────┼────────┼──────┤ │         │
│                   │ │ web_fraud │ ✓      │ 0.83 │ │ │ web_fraud │ 0.83   │ 0.83 │ │                               │         │ │ web_fraud │ 0.83   │ ✓    │ │         │
│                   │ └───────────┴────────┴──────┘ │ └───────────┴────────┴──────┘ │                               │         │ └───────────┴────────┴──────┘ │         │
└───────────────────┴───────────────────────────────┴───────────────────────────────┴───────────────────────────────┴─────────┴───────────────────────────────┴─────────┘
```

Ultimately it gives us a good idea of which platforms are supported and how reliable they are! See `src/matrix/appium.es6.js` for more parameters.

## Building from source

```bash
git clone https://github.com/jlipps/runsauce.git
cd runsauce
gulp transpile

# test it out
./bin/runsauce.js
```
