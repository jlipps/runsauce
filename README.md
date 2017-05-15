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
      "test": ["ios", "ios_hybrid", "ios_loc_serv"],
      "device": ["ip", "ipa|t=ios"],
      "version": ["6.1|a<=1.0", "7.0", "7.1", "8.0|a>=1.3.0", "8.1|a>=1.3.1"],
      "backendVersion": ["1.0", "1.1", "1.2", "1.3.4"]
    }, {
      "test": ["android_hybrid|v>=4.4", "selendroid"],
      "device": ["ae"],
      "version": ["2.3", "4.0", "4.2", "4.3", "4.4", "5.0|a>=1.2.2"],
      "backendVersion": ["1.0", "1.1", "1.2", "1.3.4"]
    }
  ],
  "config": "prod",
  "build": "appium-smoke-%t",
  "processes": 12
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

(Note that you can also use the shortcut keys, e.g., `"t"` instead of `"test"`
and `"d"` instead of `"device"` and so on).

For a working example, see `demo-build.json`, included in this repo.

## Runsauce as a library

You can also build apps on top of runsauce. An example of this is in
`src/matrix` (made available as `./bin/appium-matrix.js`. This app reads
a "build" configuration (see above), then after running the set of Appium tests
puts together a 4-dimensional support matrix with stability annotations. It
outputs to the command-line or as HTML. For example, let's say I have the
desire to see how Appium fares across Appium versions and iOS versions with
respect to the `safariIgnoreFraudWarning` capability. Then I can build
a "build" configuration as follows in, say, "fraud-build.js":

```
module.exports = {
  config: 'prod',
  build: 'appium-fraud-matrix-%t',
  processes: 20,
  name: "Appium iOS fraud warning capability test"
  tests: {
    backendVersion: ['1.0.0', '1.1.0', '1.2.4', '1.3.6', '1.3.7-beta'],
    version: ['6.1', '7.0', '7.1', '8.0|a>=1.3.6', '8.1|a>=1.3.6', '8.2|a>=1.3.7-beta'],
    test: 'web_fraud',
    browser: 's',
    device: ['ip', 'ipa']
  }
};
```

Now I can run the matrix app, specifying my input file and telling it to run
each combination 5 times so we can generate meaningful reliability statistics:

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

This depiction gives us a good idea of which platforms are supported and how
reliable they are! Run `appium-matrix` for the list of parameters:

```
Options:
  -d, --detail  Show detail view of failing tests                [default: false]
  -i, --infile  JSON or JS file that exports a build definition  [required]  [default: null]
  -f, --file    File to store raw results                        [default: null]
  -r, --runs    Number of runs for each test                     [default: 3]
  -s, --skip    Skip actual test run and use results file        [default: false]
  -h, --html    Output html table instead of CLI table           [default: false]
```

Since matrix builds often take a long time to run, it can be useful to dump the
output into a format parseable by the tool, using the `-f` flag. Once this is
done, there are two further useful options:

```
appium-matrix -i build.js -f /my/output.json -s
```

The above will re-generate the CLI report from the output file rather than
actually re-running the matrix.

```
appium-matrix -i build.js -f /my/output.json -s -h > /my/output.hml
```

The above will generate a beautiful little HTML page that is much more readable
especially for large matrices or ones with the `-d` option to show detailed
information.

(For a set of example matrix build definition files, check out
`src/matrix/builds`)

## Report results to Sumo Logic

If you have a SumoLogic collector endpoint set up, Runsauce will report
detailed information about test passes and failures, including timing
information, which can be used for later statistical purposes.

```bash
runsauce -i tests.json -j "https://endpoint1.collection.us2.sumologic.com/...."
```

## Building from source

```bash
git clone https://github.com/jlipps/runsauce.git
cd runsauce
npm install
gulp transpile

# now you can test it out
./bin/runsauce.js
```

### Tests

Uh...
