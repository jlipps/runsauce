// demonstration of how to use runsauce as a library to build your own custom
// reporting tool

import { runsauce } from './main';
import { asyncify } from 'asyncbox';
import Q from 'q';
import fs from 'fs';
import util from 'util';
import Table from 'cli-table';
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
  printMatrix(m);
}

async function cheat () {
  let res = await Q.nfcall(fs.readFile, tempFile);
  res = JSON.parse(res.toString());
  let m = matrix(res.results);
  console.log("Support matrix:");
  printMatrix(m);
}

function printMatrix (m) {
  let rowHeaders = _.keys(m);
  let colHeaders = [];
  for (let a of _.keys(m)) {
    for (let v of _.keys(m[a])) {
      if (!_.contains(colHeaders, v)) {
        colHeaders.push(v);
      }
    }
  }
  let t = new Table();
  t.push(colHeaders);
  for (let r of rowHeaders) {
    let row = [`Appium ${r}`];
    for (let c of colHeaders) {
      let support;
      let ok_combos = [], bad_combos = [], problem_combos = [];
      console.log(m[r][c]);
      if (m[r][c].all === 1) {
        support = 'YES';
      } else if (m[r][c].all === 0) {
        support = 'NO';
      } else {
        support = 'PARTIAL';
        for (let [label, stat] of _.pairs(m[r][c])) {
          if (label === 'all') {
            continue;
          }
          if (stat === 1) {
            ok_combos.push(label);
          } else if (stat === 0) {
            bad_combos.push(label);
          } else {
            problem_combos.push(label);
          }
        }
      }
      row.push(support);
    }
    t.push(row);
  }
  let newColHeaders = [""];
  for (let c of t[0]) {
    newColHeaders.push(`iOS ${c}`);
  }
  t[0] = newColHeaders;
  console.log(t.toString());
  process.exit();
  for (let a of _.keys(m)) {
    for (let v of _.keys(m[a])) {
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
  for (let [, vers] of _.pairs(mat)) {
    for (let [, tests] of _.pairs(vers)) {
      for (let [tLabel, stats] of _.pairs(tests)) {
        tests[tLabel] = avg(stats);
      }
      tests.all = avg(_.values(tests));
    }
  }
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
