const _ = require('lodash');
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
  console.log("A configuration file for runsauce already exists, with these entries:");
  let existingServerText = _.keys(config).map(s => {
    let c = config[s];
    return ` - ${s} (${c.userName ? c.userName + '@' : ''}${c.server}:${c.port})`;
  }).join("\n");
  console.log(existingServerText);
  let res = await getInput({
    name: 'proceed',
    description: "Do you want to overwrite the entire config (O), or add a new server (A)?",
    default: 'A',
    type: 'string',
    required: true,
  });
  res.proceed = res.proceed.toLowerCase();
  if (res.proceed !== "o" && res.proceed !== "a") {
    console.log(`Didn't understand '${res.proceed}', please try again later.`);
    process.exit(0);
  }
  if (res.proceed == "o") {
    await writeFile(configFile + ".bak", JSON.stringify(config));
    console.log("Backup written to " + configFile + ".bak");
    return true;
  }
  return false;
}

async function promptForSauceDeets () {
  return await getInput([{
    name: 'userName',
    description: 'Username',
    default: process.env.SAUCE_USERNAME,
    type: 'string',
    required: true,
  }, {
    name: 'accessKey',
    description: 'Access key',
    default: process.env.SAUCE_ACCESS_KEY,
    type: 'string',
    required: true,
  }]);
}

async function promptForConfig () {
  console.log("Alright, let's add your Sauce config");
  let res = await promptForSauceDeets();
  return {
    prod: {
      server: SAUCE_PROD_SERVER,
      port: SAUCE_PROD_PORT,
      userName: res.userName,
      accessKey: res.accessKey,
    }
  };
}

async function promptForServer (config) {
  let existingServers = _.keys(config);
  console.log("\nAlright, let's add a new server.");

  let res = await getInput([{
    name: 'configName',
    description: 'Config Name',
    default: 'dev',
    type: 'string',
    required: true,
  }, {
    name: 'server',
    description: 'Host Address',
    default: 'localhost',
    type: 'string',
    required: true,
  }, {
    name: 'port',
    description: 'Host Port',
    default: '4444',
    type: 'string',
    required: true,
  }, {
    name: 'askForKeys',
    description: 'Does this server need username / accessKey control (Y/N)',
    default: 'N',
    type: 'string',
    required: true
  }]);

  res.port = parseInt(res.port, 10);

  if (res.askForKeys.toLowerCase() === 'y') {
    Object.assign(res, await promptForSauceDeets());
  }
  delete res.askForKeys;
  return Object.assign({}, _.cloneDeep(config), {
    [res.configName]: {
      server: res.server,
      port: res.port,
      userName: res.userName,
      accessKey: res.accessKey,
    }
  });
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
          server: SAUCE_PROD_SERVER,
          port: SAUCE_PROD_PORT,
          userName: u,
          accessKey: process.env.SAUCE_ACCESS_KEY,
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
  let config = getConfig(), overwrite = true;
  if (config) {
    overwrite = await promptOverwrite(config);
  }
  if (overwrite) {
    config = await promptForConfig();
  } else {
    config = await promptForServer(config);
  }
  await writeFile(configFile, JSON.stringify(config));
  console.log("\nOK, config has been written to " + configFile);
  console.log("\nYou can always run --setup again to add more servers.");
  console.log("\nBye now! You could try to run something, like:");
  console.log('> runsauce --test web --browser safari --version 7 ' +
              '--platform "Mac 10.9"');
}

module.exports = { interactiveSetup, getConfig };
