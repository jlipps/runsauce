RunSauce
========

Run many kinds of simple tests with any Sauce options. Requires Node &gt;=
0.11.3 (for generator support). Don't be afraid to build from source!

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
# in Mac OS X 10.9 with Safari 7
runsauce -t selfsigned -p m9 -b s -v 7
