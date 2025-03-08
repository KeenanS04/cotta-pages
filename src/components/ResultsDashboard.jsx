// src/components/ResultsDashboard.jsx

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

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ResultsDashboard() {
  // Raw JSON data from data.json
  const [data, setData] = useState(null);
  // Grouped data structure: { archetype: { lossFunction: [fileObj, ...] } }
  const [groupedData, setGroupedData] = useState({});
  // Noise keys (all keys except the model descriptor key)
  const [noiseKeys, setNoiseKeys] = useState([]);
  // Selected metric to compare
  const [selectedMetric, setSelectedMetric] = useState("accuracy");

  // For group 1 selection (archetype and loss function)
  const [selectedGroup1Archetype, setSelectedGroup1Archetype] = useState("");
  const [selectedGroup1Loss, setSelectedGroup1Loss] = useState("");

  // For group 2 selection (archetype and loss function)
  const [selectedGroup2Archetype, setSelectedGroup2Archetype] = useState("");
  const [selectedGroup2Loss, setSelectedGroup2Loss] = useState("");

  // Fetch JSON data from the public folder when component mounts.
  useEffect(() => {
    fetch('public/data.json')
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
      })
      .catch(err => console.error("Error fetching JSON:", err));
  }, []);

  // When raw data is loaded, group it by archetype and loss function.
  useEffect(() => {
    if (!data) return;
    const fileNames = Object.keys(data);
    const group = {};
    fileNames.forEach(fileName => {
      const fileObj = data[fileName];
      // The first key is assumed to be the archetype key.
      const archetypeKey = Object.keys(fileObj)[0]; // e.g. "cotta", "cotta_selftrain", etc.
      // The value associated with this key is the loss function identifier.
      const lossFunction = fileObj[archetypeKey];
      if (!group[archetypeKey]) {
        group[archetypeKey] = {};
      }
      if (!group[archetypeKey][lossFunction]) {
        group[archetypeKey][lossFunction] = [];
      }
      group[archetypeKey][lossFunction].push(fileObj);
    });
    setGroupedData(group);

    // Determine available archetypes (keys of group)
    const archetypes = Object.keys(group);
    if (archetypes.length > 0) {
      // Set default selections if not already set.
      if (!selectedGroup1Archetype) {
        setSelectedGroup1Archetype(archetypes[0]);
      }
      if (archetypes.length > 1 && !selectedGroup2Archetype) {
        setSelectedGroup2Archetype(archetypes[1]);
      }
    }

    // Also, set noise keys from the first file of the first archetype group.
    if (archetypes.length > 0) {
      const firstArchetype = archetypes[0];
      // Get first loss function group under this archetype.
      const lossFns = Object.keys(group[firstArchetype]);
      if (lossFns.length > 0) {
        // The first key is the model descriptor; remove it from the keys when listing noise types.
        const firstFile = group[firstArchetype][lossFns[0]][0];
        const modelDescriptorKey = Object.keys(firstFile)[0];
        const noises = Object.keys(firstFile).filter(key => key !== modelDescriptorKey);
        setNoiseKeys(noises);
      }
    }
  }, [data]);

  // When an archetype selection changes, update the corresponding loss function selection.
  // We assume that each archetype group has at least one loss function.
  useEffect(() => {
    if (selectedGroup1Archetype && groupedData[selectedGroup1Archetype]) {
      const lossFns = Object.keys(groupedData[selectedGroup1Archetype]);
      if (lossFns.length > 0) {
        setSelectedGroup1Loss(lossFns[0]);
      }
    }
  }, [selectedGroup1Archetype, groupedData]);

  useEffect(() => {
    if (selectedGroup2Archetype && groupedData[selectedGroup2Archetype]) {
      const lossFns = Object.keys(groupedData[selectedGroup2Archetype]);
      if (lossFns.length > 0) {
        setSelectedGroup2Loss(lossFns[0]);
      }
    }
  }, [selectedGroup2Archetype, groupedData]);

  // Helper: Compute average value of the selected metric for a given group (archetype + loss).
  function getAverageMetricForGroup(archetype, loss, metric) {
    const files = groupedData[archetype] && groupedData[archetype][loss] ? groupedData[archetype][loss] : [];
    const averages = {};
    noiseKeys.forEach(noise => {
      let sum = 0;
      let count = 0;
      files.forEach(fileObj => {
        if (fileObj[noise] && fileObj[noise][metric] !== undefined) {
          sum += fileObj[noise][metric];
          count++;
        }
      });
      averages[noise] = count ? sum / count : 0;
    });
    return averages;
  }

  // If data or noiseKeys haven't loaded, show loading.
  if (!data || noiseKeys.length === 0) {
    return <p>Loading data...</p>;
  }

  // Available archetypes for dropdowns.
  const archetypeOptions = Object.keys(groupedData);

  // Compute average metrics for each selected group.
  const averagesGroup1 = getAverageMetricForGroup(selectedGroup1Archetype, selectedGroup1Loss, selectedMetric);
  const averagesGroup2 = getAverageMetricForGroup(selectedGroup2Archetype, selectedGroup2Loss, selectedMetric);

  // Prepare chart data: one label per noise type.
  const barChartData = {
    labels: noiseKeys,
    datasets: [
      {
        label: `${selectedGroup1Archetype} - ${selectedGroup1Loss} (${selectedMetric})`,
        data: noiseKeys.map(noise => averagesGroup1[noise]),
        backgroundColor: 'rgba(75, 192, 192, 0.4)'
      },
      {
        label: `${selectedGroup2Archetype} - ${selectedGroup2Loss} (${selectedMetric})`,
        data: noiseKeys.map(noise => averagesGroup2[noise]),
        backgroundColor: 'rgba(255, 99, 132, 0.4)'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `Comparison of ${selectedMetric}` }
    }
  };

  return (
    <div>
      <h2>Results Dashboard</h2>
      
      {/* Controls Section */}
      <div style={{ marginBottom: '1rem' }}>
        <div>
          <strong>Select Metric:</strong>
          {["accuracy", "precision", "recall", "f1"].map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              style={{
                margin: '0 0.5rem',
                backgroundColor: metric === selectedMetric ? '#ddd' : ''
              }}
            >
              {metric}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <strong>Group 1:</strong>
          <label style={{ margin: '0 0.5rem' }}>
            Archetype:
            <select
              value={selectedGroup1Archetype}
              onChange={e => setSelectedGroup1Archetype(e.target.value)}
              style={{ marginLeft: '0.3rem' }}
            >
              {archetypeOptions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label style={{ margin: '0 0.5rem' }}>
            Loss Function:
            <select
              value={selectedGroup1Loss}
              onChange={e => setSelectedGroup1Loss(e.target.value)}
              style={{ marginLeft: '0.3rem' }}
            >
              {groupedData[selectedGroup1Archetype] && Object.keys(groupedData[selectedGroup1Archetype]).map(loss => (
                <option key={loss} value={loss}>{loss}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <strong>Group 2:</strong>
          <label style={{ margin: '0 0.5rem' }}>
            Archetype:
            <select
              value={selectedGroup2Archetype}
              onChange={e => setSelectedGroup2Archetype(e.target.value)}
              style={{ marginLeft: '0.3rem' }}
            >
              {archetypeOptions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label style={{ margin: '0 0.5rem' }}>
            Loss Function:
            <select
              value={selectedGroup2Loss}
              onChange={e => setSelectedGroup2Loss(e.target.value)}
              style={{ marginLeft: '0.3rem' }}
            >
              {groupedData[selectedGroup2Archetype] && Object.keys(groupedData[selectedGroup2Archetype]).map(loss => (
                <option key={loss} value={loss}>{loss}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Chart Section */}
      <div>
        <h3>Comparison Bar Chart</h3>
        <Bar data={barChartData} options={chartOptions} />
      </div>
      
      {/* Table Section */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Detailed Data Table</h3>
        <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Noise Type</th>
              <th>{selectedGroup1Archetype} - {selectedGroup1Loss} {selectedMetric}</th>
              <th>{selectedGroup2Archetype} - {selectedGroup2Loss} {selectedMetric}</th>
            </tr>
          </thead>
          <tbody>
            {noiseKeys.map((noise, idx) => (
              <tr key={idx}>
                <td>{noise}</td>
                <td>{averagesGroup1[noise].toFixed(3)}</td>
                <td>{averagesGroup2[noise].toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
