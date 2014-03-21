#!/usr/bin/env node --harmony
"use strict";

if(require('monocle-js').native) {
  require('../lib/main.js');
} else {
  require('../lib/es5/main.js');
}
