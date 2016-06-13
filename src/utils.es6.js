import Sumologic from 'logs-to-sumologic';

export function sendToSumo (url, logs) {
  const sumologic = Sumologic.createClient({
    url: url
  });
  return new Promise(function(resolve, reject) {
    sumologic.log(logs, function (err) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}
