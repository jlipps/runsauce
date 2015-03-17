import Table from 'cli-table';
import _ from 'lodash';
import { avg } from './utils';

function getMatrixTable (m) {
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
  return t;
}

function getInnerTable (combo) {
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

export function matrix (runs) {
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

export function printMatrix (m) {
  let t = getMatrixTable(m);
  console.log(t.toString());
}

export function printMatrixHTML (m) {
  let t = getMatrixTable(m);
  let html = '';
  console.log(html);
}

