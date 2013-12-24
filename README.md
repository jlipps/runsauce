RunSauce
========

Run many kinds of simple tests with any [Sauce Labs](https://saucelabs.com)
options.

This is probably mostly useful for people who work at
[Sauce](https://github.com/saucelabs).

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
# on a dev server in Mac OS X 10.9 with Safari 7
runsauce -c dev -t selfsigned -p m9 -b s -v 7
```

Build from source:

```bash
git clone https://github.com/jlipps/runsauce.git
cd runsauce
./build.sh

# test it out, in ES5 or ES6 w/ native generator support
./bin/runsauce
```
