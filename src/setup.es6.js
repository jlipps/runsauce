import path from 'path';
import fs from 'fs';
import prompt from 'prompt';
import Q from 'q';

const configFile = path.resolve(process.env.HOME, ".runsauce.json");

prompt.message = ">";
prompt.delimiter = " ";
prompt.colors = false;

function getInput (opts) {
  return Q.nfcall(prompt.get, opts);
}

function writeFile (file, data) {
  return Q.nfcall(fs.writeFile, file, data);
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
      server: 'ondemand.saucelabs.com'
      , port: 80
      , userName: res.userName
      , accessKey: res.accessKey
      , jsRestEndpoint: 'https://saucelabs.com/rest/v1/' + res.userName + '/js-tests'
    }
  };
}

export function getConfig () {
  let config;
  try {
    config = require(configFile);
  } catch (e) {
    console.log(e);
    config = null;
  }
  return config;
}

export async function interactiveSetup () {
  console.log("Running setup!");
  console.log("--------------");
  prompt.start();
  let config = exports.getConfig();
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
