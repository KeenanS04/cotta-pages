// src/components/NormalizedCards.jsx

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js modules
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function NormalizedCards() {
  // Raw data from public/data.json
  const [data, setData] = useState(null);
  // Selected metric to display in the cards ("accuracy", "precision", "recall", or "f1")
  const [selectedMetric, setSelectedMetric] = useState("accuracy");
  // State for the card modal (holds the adaptation method clicked, or null if none)
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Fetch the JSON data when the component mounts.
  useEffect(() => {
    fetch('/cotta-pages//data.json')
      .then(response => response.json())
      .then(json => setData(json))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  if (!data) {
    return <p>Loading data...</p>;
  }

  // Get file names from the data
  const fileNames = Object.keys(data);

  // Group files by their adaptation method.
  // We assume the first key of each file object is the adaptation method (e.g. "cotta", "cotta_kl", etc.)
  const groups = {};
  fileNames.forEach(fileName => {
    const fileObj = data[fileName];
    const adaptationMethod = Object.keys(fileObj)[0];
    if (!groups[adaptationMethod]) {
      groups[adaptationMethod] = [];
    }
    groups[adaptationMethod].push(fileObj);
  });

  // Compute average of the selected metric for each adaptation method per noise type.
  const groupedAverages = {};
  Object.keys(groups).forEach(method => {
    const files = groups[method];
    const noiseSums = {};
    const noiseCounts = {};
    files.forEach(fileObj => {
      // Loop over each key except the adaptation method key
      Object.keys(fileObj).forEach(key => {
        if (key === method) return;
        const noiseData = fileObj[key];
        if (noiseData && noiseData[selectedMetric] !== undefined) {
          if (!noiseSums[key]) {
            noiseSums[key] = 0;
            noiseCounts[key] = 0;
          }
          noiseSums[key] += noiseData[selectedMetric];
          noiseCounts[key] += 1;
        }
      });
    });
    const averages = {};
    Object.keys(noiseSums).forEach(noise => {
      averages[noise] = noiseSums[noise] / noiseCounts[noise];
    });
    groupedAverages[method] = averages;
  });

  // Build a union of all noise types across methods.
  const noiseTypesSet = new Set();
  Object.values(groupedAverages).forEach(averages => {
    Object.keys(averages).forEach(noise => noiseTypesSet.add(noise));
  });
  const noiseTypes = Array.from(noiseTypesSet).sort();

  // The main view: display a control for metric selection and a card for each adaptation method.
  return (
    <div style={{ padding: "1rem" }}>
      <h2>Normalized Results Dashboard</h2>
      
      {/* Metric selection buttons */}
      <div style={{ marginBottom: "1rem" }}>
        <strong>Select Metric: </strong>
        {["accuracy", "precision", "recall", "f1"].map(metric => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            style={{
              margin: "0 0.5rem",
              padding: "0.3rem 0.6rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: metric === selectedMetric ? "#ddd" : ""
            }}
          >
            {metric}
          </button>
        ))}
      </div>

      {/* Cards Layout */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {Object.keys(groupedAverages).map(method => (
          <div 
            key={method}
            onClick={() => setSelectedMethod(method)}
            style={{
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "6px",
              flex: "1 0 300px",
              boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <h3 style={{ marginTop: 0 }}>{method}</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.25rem" }}>Noise Type</th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.25rem" }}>{selectedMetric}</th>
                </tr>
              </thead>
              <tbody>
                {noiseTypes.map(noise => (
                  <tr key={noise}>
                    <td style={{ padding: "0.25rem" }}>{noise}</td>
                    <td style={{ padding: "0.25rem" }}>
                      {groupedAverages[method][noise] !== undefined ? groupedAverages[method][noise].toFixed(3) : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Modal for detailed view */}
      {selectedMethod && (
        <Modal onClose={() => setSelectedMethod(null)}>
          <DetailedView 
            method={selectedMethod} 
            averages={groupedAverages[selectedMethod]} 
            noiseTypes={noiseTypes}
            metric={selectedMetric}
          />
        </Modal>
      )}
    </div>
  );
}

// Modal component: simple overlay with a close button.
function Modal({ children, onClose }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "1rem",
        borderRadius: "8px",
        maxWidth: "90%",
        maxHeight: "90%",
        overflowY: "auto",
        position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute",
          top: "0.5rem",
          right: "0.5rem",
          fontSize: "1rem",
          border: "none",
          background: "none",
          cursor: "pointer"
        }}>
          Close
        </button>
        {children}
      </div>
    </div>
  );
}

// DetailedView component: renders a bar chart of the detailed averages for the selected method.
function DetailedView({ method, averages, noiseTypes, metric }) {
  // Prepare chart data: xLabels are noise types, y data is the average for that noise.
  const dataForChart = {
    labels: noiseTypes,
    datasets: [
      {
        label: `${method} ${metric}`,
        data: noiseTypes.map(noise => averages[noise] !== undefined ? averages[noise] : 0),
        backgroundColor: "rgba(54, 162, 235, 0.8)"
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `Detailed View for ${method} (${metric})` }
    },
    scales: {
      x: { title: { display: true, text: "Noise Type" } },
      y: { title: { display: true, text: metric } }
    }
  };

  return (
    <div>
      <h2>Detailed View: {method}</h2>
      <p>This chart shows the average {metric} for each noise type for {method}.</p>
      <Bar data={dataForChart} options={chartOptions} />
    </div>
  );
}
