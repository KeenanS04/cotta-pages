import React, { useState, useMemo } from 'react';

const resultsData = {
  accuracy: [
    { method: "None", "M1": "0.00", "M2": "0.00", "M3": "0.00", "M4": "0.00", "M5": "0.00", "M6": "0.00", "M7": "0.00" },
    { method: "Normal TTA", "M1": "5.08", "M2": "9.45", "M3": "2.83", "M4": "23.08", "M5": "4.72", "M6": "9.46", "M7": "3.78" },
    { method: "TENT TTA", "M1": "7.27", "M2": "11.16", "M3": "4.03", "M4": "23.37", "M5": "3.46", "M6": "-13.52", "M7": "4.46" },
    { method: "CoTTA", "M1": "8.37", "M2": "11.71", "M3": "5.20", "M4": "26.53", "M5": "6.44", "M6": "-2.49", "M7": "5.49" },
    { method: "CoTTA-Poly", "M1": "8.99", "M2": "11.24", "M3": "5.21", "M4": "25.66", "M5": "6.62", "M6": "-7.44", "M7": "5.82" },
    { method: "CoTTA-KL", "M1": "8.32", "M2": "11.70", "M3": "5.22", "M4": "26.58", "M5": "6.45", "M6": "-2.58", "M7": "5.51" },
    { method: "CoTTA-Cosine", "M1": "7.43", "M2": "11.17", "M3": "4.25", "M4": "25.77", "M5": "5.63", "M6": "-5.65", "M7": "4.62" },
    { method: "CoTTA-SelfTrain", "M1": "-3.06", "M2": "-17.67", "M3": "-30.70", "M4": "-1.74", "M5": "-15.06", "M6": "-45.56", "M7": "-14.34" }
  ],
  precision: [
    { method: "None", "M1": "0.00", "M2": "0.00", "M3": "0.00", "M4": "0.00", "M5": "0.00", "M6": "0.00", "M7": "0.00" },
    { method: "Normal TTA", "M1": "2.43", "M2": "5.50", "M3": "1.14", "M4": "8.60", "M5": "1.72", "M6": "5.95", "M7": "0.83" },
    { method: "TENT TTA", "M1": "6.23", "M2": "8.83", "M3": "3.00", "M4": "11.08", "M5": "2.47", "M6": "-3.52", "M7": "2.63" },
    { method: "CoTTA", "M1": "5.62", "M2": "7.60", "M3": "3.28", "M4": "11.92", "M5": "3.35", "M6": "-5.82", "M7": "2.69" },
    { method: "CoTTA-Poly", "M1": "6.20", "M2": "7.43", "M3": "3.27", "M4": "11.09", "M5": "3.50", "M6": "-11.70", "M7": "2.98" },
    { method: "CoTTA-KL", "M1": "5.57", "M2": "7.55", "M3": "3.32", "M4": "12.00", "M5": "3.36", "M6": "-5.95", "M7": "2.70" },
    { method: "CoTTA-Cosine", "M1": "4.87", "M2": "7.26", "M3": "2.83", "M4": "11.24", "M5": "2.66", "M6": "-9.01", "M7": "2.03" },
    { method: "CoTTA-SelfTrain", "M1": "-0.74", "M2": "3.49", "M3": "-0.73", "M4": "-4.56", "M5": "-0.11", "M6": "-26.08", "M7": "-1.15" }
  ],
  recall: [
    { method: "None", "M1": "0.00", "M2": "0.00", "M3": "0.00", "M4": "0.00", "M5": "0.00", "M6": "0.00", "M7": "0.00" },
    { method: "Normal TTA", "M1": "5.08", "M2": "9.45", "M3": "2.83", "M4": "23.08", "M5": "4.72", "M6": "9.46", "M7": "3.78" },
    { method: "TENT TTA", "M1": "7.27", "M2": "11.16", "M3": "4.03", "M4": "23.37", "M5": "3.46", "M6": "-13.52", "M7": "4.46" },
    { method: "CoTTA", "M1": "8.37", "M2": "11.71", "M3": "5.20", "M4": "26.53", "M5": "6.44", "M6": "-2.49", "M7": "5.49" },
    { method: "CoTTA-Poly", "M1": "8.99", "M2": "11.24", "M3": "5.21", "M4": "25.66", "M5": "6.62", "M6": "-7.44", "M7": "5.82" },
    { method: "CoTTA-KL", "M1": "8.32", "M2": "11.70", "M3": "5.22", "M4": "26.58", "M5": "6.45", "M6": "-2.58", "M7": "5.51" },
    { method: "CoTTA-Cosine", "M1": "7.43", "M2": "11.17", "M3": "4.25", "M4": "25.77", "M5": "5.63", "M6": "-5.65", "M7": "4.62" },
    { method: "CoTTA-SelfTrain", "M1": "-3.06", "M2": "-17.67", "M3": "-30.70", "M4": "-1.74", "M5": "-15.06", "M6": "-45.56", "M7": "-14.34" }
  ],
  f1: [
    { method: "None", "M1": "0.00", "M2": "0.00", "M3": "0.00", "M4": "0.00", "M5": "0.00", "M6": "0.00", "M7": "0.00" },
    { method: "Normal TTA", "M1": "5.17", "M2": "9.51", "M3": "2.68", "M4": "23.50", "M5": "4.43", "M6": "9.88", "M7": "3.55" },
    { method: "TENT TTA", "M1": "7.46", "M2": "11.29", "M3": "3.96", "M4": "24.06", "M5": "3.20", "M6": "-14.65", "M7": "4.37" },
    { method: "CoTTA", "M1": "8.41", "M2": "11.71", "M3": "4.97", "M4": "26.84", "M5": "6.09", "M6": "-2.29", "M7": "5.28" },
    { method: "CoTTA-Poly", "M1": "9.01", "M2": "11.33", "M3": "4.97", "M4": "25.97", "M5": "6.24", "M6": "-7.73", "M7": "5.59" },
    { method: "CoTTA-KL", "M1": "8.36", "M2": "11.68", "M3": "5.00", "M4": "26.91", "M5": "6.10", "M6": "-2.39", "M7": "5.29" },
    { method: "CoTTA-Cosine", "M1": "7.53", "M2": "11.25", "M3": "4.18", "M4": "26.14", "M5": "5.32", "M6": "-5.50", "M7": "4.47" },
    { method: "CoTTA-SelfTrain", "M1": "-3.05", "M2": "-15.20", "M3": "-29.08", "M4": "-1.48", "M5": "-12.24", "M6": "-49.95", "M7": "-12.74" }
  ]
};

function ResultsChart() {
  // State for the selected metric.
  const [selectedMetric, setSelectedMetric] = useState("accuracy");

  // Get the data for the selected metric.
  const metricData = resultsData[selectedMetric];

  // Compute max values per column
  const maxValues = useMemo(() => {
    const keys = Object.keys(metricData[0]).filter((key) => key !== "method");
    const maxMap = {};

    keys.forEach((key) => {
      maxMap[key] = Math.max(...metricData.map((row) => parseFloat(row[key])));
    });

    return maxMap;
  }, [metricData]);

  return (
    <div className="my-6 p-6 bg-gray-900 rounded-xl shadow-lg text-white">
      {/* Dropdown Menu */}
      <div className="mb-4">
        <label htmlFor="metricSelect" className="text-lg font-semibold">Select Metric:</label>
        <select
          id="metricSelect"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="ml-2 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-400"
        >
          <option value="accuracy">Increase in Accuracy</option>
          <option value="precision">Increase in Precision</option>
          <option value="recall">Increase in Recall</option>
          <option value="f1">Increase in F1 Score</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg">
          {/* Table Head */}
          <thead>
            <tr className="bg-gray-800 text-blue-400">
              <th className="border border-gray-700 px-4 py-2">Method</th>
              {Object.keys(maxValues).map((key) => (
                <th key={key} className="border border-gray-700 px-4 py-2">{key}</th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {metricData.map((row, idx) => {
              const isGroup1 = idx < 4;
              const isMaxValue = (key) => parseFloat(row[key]) === maxValues[key];

              return (
                <>
                  <tr
                    key={idx}
                    className={`odd:bg-gray-700 even:bg-gray-800 hover:bg-gray-600 transition-all ${
                      idx === 3 ? "border-b-4 border-white" : ""
                    }`}
                  >
                    <td className="border border-gray-700 px-4 py-2 font-semibold text-blue-400">{row.method}</td>
                    {Object.keys(maxValues).map((key) => (
                      <td
                        key={key}
                        className={`border border-gray-700 px-4 py-2 ${
                          isMaxValue(key) ? "bg-blue-500 text-white font-bold" : ""
                        }`}
                      >
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsChart;