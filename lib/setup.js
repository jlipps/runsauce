const path = require('path');
const fs = require('fs');
const prompt = require('prompt');
const B = require('bluebird');

const configFile = path.resolve(process.env.HOME, ".runsauce.json");
const SAUCE_PROD_SERVER = 'ondemand.saucelabs.com';
const SAUCE_PROD_PORT = 80;

prompt.message = ">";
prompt.delimiter = " ";
prompt.colors = false;

function getInput (opts) {
  return B.promisify(prompt.get, {context: prompt})(opts);
}

function writeFile (file, data) {
  return B.promisify(fs.writeFile)(file, data);
}

async function promptOverwrite (config) {
  console.log("A configuration file for runsauce already exists.");
  let res = await getInput({
    name: 'proceed'
    , description: "Are you sure you want to overwrite it?"
    , default: 'Y'
    , type: 'string'
    , required: true
  });
  if (res.proceed !== "Y") {
    process.exit(0);
  }
  await writeFile(configFile + ".bak", JSON.stringify(config));
  console.log("Backup written to " + configFile + ".bak");
}

async function promptForConfig () {
  console.log("\nAlright, let's add your Sauce config");
  let res = await getInput([{
    name: 'userName'
    , description: 'Production username'
    , default: process.env.SAUCE_USERNAME
    , type: 'string'
    , required: true
  }, {
    name: 'accessKey'
    , description: 'Production access key'
    , default: process.env.SAUCE_ACCESS_KEY
    , type: 'string'
    , required: true
  }]);
  return {
    prod: {
      server: SAUCE_PROD_SERVER
      , port: SAUCE_PROD_PORT
      , userName: res.userName
      , accessKey: res.accessKey
    }
  };
}

function getConfig () {
  let config;
  try {
    config = require(configFile);
  } catch (e) {
    if (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) {
      let u = process.env.SAUCE_USERNAME;
      console.log("(Using env vars for username/access key, run with --setup to persist)");
      return {
        prod: {
          server: SAUCE_PROD_SERVER
          , port: SAUCE_PROD_PORT
          , userName: u
          , accessKey: process.env.SAUCE_ACCESS_KEY
        }
      };
    }

    console.log(e);
    config = null;
  }
  return config;
}

async function interactiveSetup () {
  console.log("Running setup!");
  console.log("--------------");
  prompt.start();
  let config = getConfig();
  if (config) {
    await promptOverwrite(config);
  }
  config = await promptForConfig();
  await writeFile(configFile, JSON.stringify(config));
  console.log("\nOK, config has been written to " + configFile);
  console.log("\nIt's just JSON, so you can add your own configs as well");
  console.log("Maybe add your stewardess as 'dev'?");
  console.log("\nBye now! You could try to run something, like:");
  console.log('> runsauce --test web --browser safari --version 7 ' +
              '--platform "Mac 10.9"');
}

module.exports = { interactiveSetup, getConfig };
