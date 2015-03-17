// demonstration of how to use runsauce as a library to build your own custom
// reporting tool

import { asyncify } from 'asyncbox';
import Q from 'q';
import fs from 'fs';

import { getStatusHandler } from './utils';
import { runsauce } from '../main';
import { matrix, printMatrix } from './matrix';

const CONCURRENCY = 20;
const tempFile = '/Users/jlipps/Desktop/sauce_matrix.json';

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

  let res = await runsauce({testsuite: opts}, false, getStatusHandler(CONCURRENCY));
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

export function cli () {
  //asyncify(main);
  asyncify(cheat);
}
