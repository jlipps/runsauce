// demonstration of how to use runsauce as a library to build your own custom
// reporting tool

import { runsauce } from './main';
import { asyncify } from 'asyncbox';
import Q from 'q';
import fs from 'fs';
import util from 'util';
import _ from 'lodash';

let numTests = 0;
let testsComplete = 0;
const tempFile = '/Users/jlipps/Desktop/sauce_matrix.json';

function onStatus (s) {
  if (s.test) {
    if (testsComplete % 40 === 0) {
      process.stdout.write("\n" + testsComplete + "/" + numTests + " ");
    }
    testsComplete++;
    process.stdout.write(s.test);
  } else if (s.numTests) {
    numTests = s.numTests;
    console.log("Running " + numTests + " tests");
  }
}

async function main () {
  console.log("Running Appium support matrix\n");
  let opts = {c: 'prod', u: 'appium-matrix-%t', n: 20};
  let basicTestOpts = {};
  let deviceTestOpts = {};
  let appiumVers = ['1.0.0', '1.1.0', '1.2.0', '1.2.1', '1.2.2',
                    '1.2.4', '1.3.1', '1.3.3', '1.3.4', '1.3.6'];
  appiumVers = ['1.3.6'];
  let iosVers = ['6.1', '7.0', '7.1', '8.0|a>=1.3.1', '8.1|a>=1.3.1',
                 '8.2|a>=1.3.1'];
  iosVers = ['7.1'];
  basicTestOpts.a = deviceTestOpts.a = appiumVers;
  basicTestOpts.r = deviceTestOpts.r = 3;
  basicTestOpts.v = deviceTestOpts.v = iosVers;
  basicTestOpts.t = ['ios', 'web_guinea', 'selfsigned', 'connect', 'ios_loc_serv'];
  basicTestOpts.t = ['ios'];
  basicTestOpts.d = ['ip', 'ipa'];
  basicTestOpts.d = ['ip'];
  deviceTestOpts.t = ['ios_loc_serv'];
  deviceTestOpts.d = ['iPhone Retina (3.5-inch)|v=7.0', 'iPhone 5s|v=7.1',
                      'iPad 2|v=7.1', 'iPhone 6 Plus|v>=8.0',
                      'iPad Air|v>=8.0'];
  opts.tests = [basicTestOpts, deviceTestOpts];
  opts.tests = [basicTestOpts];

  let res = await runsauce({testsuite: opts}, false, onStatus);
  console.log("Writing json data to " + tempFile);
  await Q.nfcall(fs.writeFile, tempFile, JSON.stringify(res));
  console.log(res);
}

async function cheat () {
  let res = await Q.nfcall(fs.readFile, tempFile);
  res = JSON.parse(res.toString());
  let m = matrix(res.results);
  console.log("Support matrix:");
  for (let a of _.keys(m)) {
    for (let v of _.keys(m[a])) {
      let support;
      if (m[a][v].all === 1) {
        support = 'YES';
      } else if (m[a][v].all === 0) {
        support = 'NO';
      } else {
        support = 'PARTIAL';
      }
      console.log(`Appium ${a} / iOS ${v}: ${support}`);
    }
  }
}

function matrix (runs) {
  let mat = {};
  for (let r of runs) {
    const a = r.caps.appiumVersion;
    const v = r.caps.platformVersion;
    const d = r.caps.deviceName;
    const t = r.test;
    const s = r.stack ? 0 : 1;
    const label = `${t}|${d}`;
    if (!mat[a]) {
      mat[a] = {};
    }
    if (!mat[a][v]) {
      mat[a][v] = {};
    }
    if (!mat[a][v][label]) {
      mat[a][v][label] = [];
    }
    mat[a][v][label].push(s);
  }
  for (let [a, vers] of _.pairs(mat)) {
    for (let [v, tests] of _.pairs(vers)) {
      for (let [label, stats] of _.pairs(tests)) {
        tests[label] = avg(stats);
      }
      tests.all = avg(_.values(tests));
    }
  }
  console.log(util.inspect(mat, {depth: 5}));
  return mat;
}

function sum (arr) {
  return _.reduce(arr, (m, n) => { return m + n; }, 0);
}

function avg (arr) {
  if (arr.length > 0) {
    return sum(arr) / arr.length;
  }
  return 0;
}

//asyncify(main);
asyncify(cheat);
