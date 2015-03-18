import _ from 'lodash';

export function getStatusHandler (concurrency) {
  let numTests = 0;
  let testsComplete = 0;
  return function (s) {
    let breakOn = 80;
    if (s.test) {
      if (testsComplete % breakOn === 0) {
        let padding = numTests.toString().length - testsComplete.toString().length;
        let paddingStr = "";
        for (let i = 0; i < padding; i++) {
          paddingStr += " ";
        }
        process.stdout.write("\n" + paddingStr + testsComplete + "/" +
                             numTests + " ");
      }
      testsComplete++;
      process.stdout.write(s.test);
    } else if (s.numTests) {
      numTests = s.numTests;
      console.log(`Running ${numTests} tests in ${concurrency} processes`);
    }
    if (testsComplete === numTests) {
      process.stdout.write("\n");
    }
  };
}

export function sum (arr) {
  return _.reduce(arr, (m, n) => { return m + n; }, 0);
}

export function avg (arr) {
  if (arr.length > 0) {
    return sum(arr) / arr.length;
  }
  return 0;
}

