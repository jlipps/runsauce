// demonstration of how to use runsauce as a library to build your own custom
// reporting tool

import { runsauce } from './main';
import { asyncify } from 'asyncbox';
import Q from 'q';
import fs from 'fs';
import Table from 'cli-table';
import _ from 'lodash';

let numTests = 0;
let testsComplete = 0;
const CONCURRENCY = 20;
const tempFile = '/Users/jlipps/Desktop/sauce_matrix.json';

function onStatus (s) {
  let breakOn = 80;
  if (s.test) {
    if (testsComplete % breakOn === 0) {
      process.stdout.write("\n" + testsComplete + "/" + numTests + " ");
    }
    testsComplete++;
    process.stdout.write(s.test);
  } else if (s.numTests) {
    numTests = s.numTests;
    console.log(`Running ${numTests} tests in ${CONCURRENCY} processes`);
  }
}

async function main () {
  console.log("Running Appium support matrix");
  let opts = {c: 'prod', u: 'appium-matrix-%t', n: CONCURRENCY};
  let basicTestOpts = {};
  let deviceTestOpts = {};
  let appiumVers = ['1.0.0', '1.1.0', '1.2.0', '1.2.1', '1.2.2',
                    '1.2.4', '1.3.1', '1.3.3', '1.3.4', '1.3.6'];
  //appiumVers = ['1.3.6'];
  let iosVers = ['6.1', '7.0', '7.1', '8.0|a>=1.3.1', '8.1|a>=1.3.1',
                 '8.2|a>=1.3.1'];
  //iosVers = ['7.1', '8.1'];
  basicTestOpts.a = deviceTestOpts.a = appiumVers;
  basicTestOpts.r = deviceTestOpts.r = 3;
  basicTestOpts.v = deviceTestOpts.v = iosVers;
  basicTestOpts.t = ['ios', 'web_guinea', 'selfsigned', 'connect', 'ios_loc_serv'];
  //basicTestOpts.t = ['ios', 'web_guinea'];
  basicTestOpts.d = ['ip', 'ipa'];
  //basicTestOpts.d = ['ip', 'ipa'];
  deviceTestOpts.t = ['ios_loc_serv'];
  deviceTestOpts.d = ['iPhone Retina (3.5-inch)|v=7.0', 'iPhone 5s|v=7.1',
                      'iPad 2|v=7.1', 'iPhone 6 Plus|v>=8.0',
                      'iPad Air|v>=8.0'];
  opts.tests = [basicTestOpts, deviceTestOpts];
  //opts.tests = [basicTestOpts];

  let res = await runsauce({testsuite: opts}, false, onStatus);
  console.log("Writing json data to " + tempFile);
  await Q.nfcall(fs.writeFile, tempFile, JSON.stringify(res));
  let m = matrix(res.results);
  printMatrix(m);
}

async function cheat () {
  let res = await Q.nfcall(fs.readFile, tempFile);
  res = JSON.parse(res.toString());
  let m = matrix(res.results);
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
      if (m[r][c].all === 1) {
        support = '\u2713';
      } else if (m[r][c].all === 0) {
        support = '\u2717';
      } else {
        support = getInnerTable(m[r][c]);
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
}

function getInnerTable (combo) {
  let support = 'PARTIAL';
  let tests = [], devices = [];
  let avgForSet = "";
  for (let [test, deviceObjs] of _.pairs(combo)) {
    if (test === 'all') {
      avgForSet = deviceObjs.toFixed(2);
      continue;
    }
    tests.push(test);
    for (let dName of _.keys(deviceObjs)) {
      devices.push(dName);
    }
  }
  tests = _.uniq(tests);
  devices = _.uniq(devices);
  let innerTable = new Table({head: [avgForSet].concat(devices)});
  for (let t of tests) {
    let rowObj = {};
    let row = [];
    for (let d of devices) {
      let val = combo[t][d];
      if (val === 1) {
        row.push("\u2713");
      } else if (val === 0) {
        row.push("\u2717");
      } else {
        row.push(val.toFixed(2));
      }
    }
    rowObj[t] = row;
    innerTable.push(rowObj);
  }
  for (let [i, h] of _.pairs(innerTable.options.head)) {
    innerTable.options.head[i] = h.replace(' Simulator', '');
  }
  return innerTable.toString();
}

function matrix (runs) {
  let mat = {};
  for (let r of runs) {
    const a = r.caps.appiumVersion;
    const v = r.caps.platformVersion;
    const d = r.caps.deviceName;
    const t = r.test;
    const s = r.stack ? 0 : 1;
    if (!mat[a]) {
      mat[a] = {};
    }
    if (!mat[a][v]) {
      mat[a][v] = {};
    }
    if (!mat[a][v][t]) {
      mat[a][v][t] = {};
    }
    if (!mat[a][v][t][d]) {
      mat[a][v][t][d] = [];
    }
    mat[a][v][t][d].push(s);
  }
  for (let [, vers] of _.pairs(mat)) {
    for (let [, tests] of _.pairs(vers)) {
      let testValues = [];
      for (let [, devices] of _.pairs(tests)) {
        for (let [dLabel, stats] of _.pairs(devices)) {
          let avgStats = avg(stats);
          devices[dLabel] = avgStats;
          testValues.push(avgStats);
        }
      }
      tests.all = avg(testValues);
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

asyncify(main);
//asyncify(cheat);
