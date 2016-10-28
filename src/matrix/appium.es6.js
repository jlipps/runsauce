// demonstration of how to use runsauce as a library to build your own custom
// reporting tool

import { asyncify } from 'asyncbox';
import Q from 'q';
import fs from 'fs';
import optimist from 'optimist';

import { getStatusHandler } from './utils';
import { runsauce } from '../main';
import { matrix, printMatrix, printMatrixHTML } from './matrix';

function parse () {
  let optimistObj = optimist
    .options('d', {
      alias: 'detail',
      default: false,
      describe: 'Show detail view of failing tests',
      demand: false
    })
    .options('i', {
      alias: 'infile',
      default: null,
      describe: 'JSON or JS file that exports a build definition',
      demand: true
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
  let build = require(config.infile);
  let concurrency = build.n;
  console.log(`Running ${build.name || 'build'}`);
  if (build.j || build.jsonToSumo) {
    console.log("(Will upload data to SumoLogic after build runs)");
  }
  for (let testset of build.tests) {
    testset.r = config.runs;
  }
  let res = await runsauce({testsuite: build}, false, getStatusHandler(concurrency));
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
