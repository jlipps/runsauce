// demonstration of how to use runsauce as a library to build your own custom
// reporting tool

import { asyncify } from 'asyncbox';
import Q from 'q';
import fs from 'fs';
import optimist from 'optimist';

import { getStatusHandler } from './utils';
import { runsauce } from '../main';
import { matrix, printMatrix, printMatrixHTML } from './matrix';

const CONCURRENCY = 20;

function parse () {
  let optimistObj = optimist
    .options('d', {
      alias: 'detail',
      default: false,
      describe: 'Show detail view of failing tests',
      demand: false
    })
    .options('f', {
      alias: 'file',
      default: null,
      describe: 'File to store raw results',
      demand: false
    })
    .options('r', {
      alias: 'runs',
      default: 3,
      describe: 'Number of runs for each test',
      demand: false
    })
    .options('s', {
      alias: 'skip',
      default: false,
      describe: 'Skip actual test run and use results file',
      demand: false
    })
    .option('h', {
      alias: 'html',
      default: false,
      describe: 'Output html table instead of CLI table',
      demand: false
    })
    .boolean(['detail', 'skip', 'html']);
  return optimistObj.argv;
}

async function main (config) {
  console.log("Running Appium support matrix");
  let opts = {c: 'prod', u: 'appium-matrix-%t', n: CONCURRENCY};
  let basicTestOpts = {};
  let deviceTestOpts = {};
  let appiumVers = ['1.0.0', '1.1.0', '1.2.0', '1.2.1', '1.2.2',
                    '1.2.4', '1.3.1', '1.3.3', '1.3.4', '1.3.6'];
  //appiumVers = ['1.3.6'];
  let iosVers = ['6.1', '7.0', '7.1', '8.0|a>=1.3.1', '8.1|a>=1.3.1',
                 '8.2|a>=1.3.6'];
  //iosVers = ['7.1', '8.1'];
  basicTestOpts.a = deviceTestOpts.a = appiumVers;
  basicTestOpts.r = deviceTestOpts.r = config.runs;
  basicTestOpts.v = deviceTestOpts.v = iosVers;
  basicTestOpts.t = ['ios', 'web_guinea', 'selfsigned', 'connect', 'ios_loc_serv'];
  //basicTestOpts.t = ['ios', 'web_guinea'];
  basicTestOpts.d = ['ip', 'ipa'];
  //basicTestOpts.d = ['ip', 'ipa'];
  deviceTestOpts.t = ['web_guinea', 'ios_loc_serv'];
  deviceTestOpts.d = ['iPhone Retina (3.5-inch)|v=7.0', 'iPhone 5s|v=7.1',
                      'iPad 2|v=7.1', 'iPhone 6 Plus|v>=8.0',
                      'iPad Air|v>=8.0'];
  opts.tests = [basicTestOpts, deviceTestOpts];
  //opts.tests = [basicTestOpts];

  let res = await runsauce({testsuite: opts}, false, getStatusHandler(CONCURRENCY));
  if (config.file) {
    console.log("Writing json data to " + config.file);
    await Q.nfcall(fs.writeFile, config.file, JSON.stringify(res));
  }
  let m = matrix(res.results);
  print(config.html, m, config.detail);
}

function print (html, m, detail) {
  if (html) {
    printMatrixHTML(m, detail);
  } else {
    printMatrix(m, detail);
  }
}

async function skip (config) {
  let res = await Q.nfcall(fs.readFile, config.file);
  res = JSON.parse(res.toString());
  let m = matrix(res.results);
  print(config.html, m, config.detail);
}

export function cli () {
  let config = parse();
  if (config.skip) {
    asyncify(skip, config);
  } else {
    asyncify(main, config);
  }
}
