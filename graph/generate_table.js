const fs = require("fs");
const csv = require("csv-parser");

function readCSV(filename) {
  return new Promise((resolve) => {
    const times = [];

    fs.createReadStream(filename)
      .pipe(csv())
      .on("data", (row) => {
        times.push(Number(row.time));
      })
      .on("end", () => {
        resolve(times);
      });
  });
}

function stats(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const variance =
    arr.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / arr.length;
  const std = Math.sqrt(variance);

  return {
    mean: mean.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    std: std.toFixed(2),
  };
}

(async () => {
  const encTimes = await readCSV("encryption_results.csv");
  const decTimes = await readCSV("decryption_results.csv");

  const enc = stats(encTimes);
  const dec = stats(decTimes);

  console.log("\n📊 PERFORMANCE SUMMARY (ms)\n");
  console.table({
    "Mean (ms)": {
      Encryption: enc.mean,
      Decryption: dec.mean,
    },
    "Min (ms)": {
      Encryption: enc.min,
      Decryption: dec.min,
    },
    "Max (ms)": {
      Encryption: enc.max,
      Decryption: dec.max,
    },
    "Std Dev (ms)": {
      Encryption: enc.std,
      Decryption: dec.std,
    },
  });

  // Save table to CSV (for paper)
  const output =
    "Metric,Encryption(ms),Decryption(ms)\n" +
    `Mean,${enc.mean},${dec.mean}\n` +
    `Min,${enc.min},${dec.min}\n` +
    `Max,${enc.max},${dec.max}\n` +
    `Std Dev,${enc.std},${dec.std}\n`;

  fs.writeFileSync("performance_summary.csv", output);

  console.log("\n performance_summary.csv generated\n");
})();
