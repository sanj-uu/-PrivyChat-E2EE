const fs = require("fs");
const csv = require("csv-parser");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

const width = 800;
const height = 600;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

function readCSV(file) {
  return new Promise(resolve => {
    const data = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on("data", row => {
        data.push({
          size: Number(row.size),
          time: Number(row.time)
        });
      })
      .on("end", () => resolve(data));
  });
}

(async () => {
  const enc = await readCSV("encryption_results.csv");
  const dec = await readCSV("decryption_results.csv");

  const encConfig = {
    type: "line",
    data: {
      labels: dec.map(d => d.size),
      datasets: [{
        label: "Decryption Time (ms)",
        data: dec.map(d => d.time),
        borderColor: "blue",
        fill: false
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Message Size (bytes)" }},
        y: { title: { display: true, text: "Time (ms)" }}
      }
    }
  };

  const image = await chartJSNodeCanvas.renderToBuffer(encConfig);
  fs.writeFileSync("decryption_time.png", image);

  console.log("Graph generated : decryption_time.png");
})();
