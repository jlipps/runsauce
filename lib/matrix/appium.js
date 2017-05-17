// demonstration of how to use runsauce as a library to build your own custom
// reporting tool

const { asyncify } = require('asyncbox');
const B = require('bluebird');
const fs = require('fs');
const optimist = require('optimist');
const _ = require('lodash');

const { getStatusHandler } = require('./utils');
const { runsauce } = require('../main');
const { matrix, printMatrix, printMatrixHTML } = require('./matrix');

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
  let sumoUrl = build.j || build.jsonToSumo;
  if (sumoUrl) {
    console.log(`(Will upload data to SumoLogic at ${_.trunc(sumoUrl, 50)} after build runs)`);
  }
  for (let testset of build.tests) {
    testset.r = config.runs;
  }
  let res = await runsauce({testsuite: build}, false, getStatusHandler(concurrency));
  if (config.file) {
    console.log("Writing json data to " + config.file);
    await B.promisify(fs.writeFile)(config.file, JSON.stringify(res));
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
  let res = await B.promisify(fs.readFile)(config.file);
  res = JSON.parse(res.toString());
  let m = matrix(res.results);
  print(config.html, m, config.detail);
}

function cli () {
  let config = parse();
  if (config.skip) {
    asyncify(skip, config);
  } else {
    asyncify(main, config);
  }
}

module.exports = { cli };
