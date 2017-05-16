const Sumologic = require('logs-to-sumologic');

function sendToSumo (url, logs) {
  const sumologic = Sumologic.createClient({url});
  return new Promise(function(resolve, reject) {
    sumologic.log(logs, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = { sendToSumo };
