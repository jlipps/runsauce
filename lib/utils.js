const Sumologic = require('logs-to-sumologic');
const B = require('bluebird');

function sendToSumo (url, logs) {
  const sumologic = Sumologic.createClient({url});
  return new B(function (resolve, reject) {
    sumologic.log(logs, function (err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = { sendToSumo };
