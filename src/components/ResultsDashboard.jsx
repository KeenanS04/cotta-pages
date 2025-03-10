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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ResultsDashboard() {
  const [data, setData] = useState(null);
  const [groupedData, setGroupedData] = useState({});
  const [noiseKeys, setNoiseKeys] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("accuracy");

  const [selectedGroup1Architecture, setSelectedGroup1Architecture] = useState("");
  const [selectedGroup1Loss, setSelectedGroup1Loss] = useState("");

  const [selectedGroup2Architecture, setSelectedGroup2Architecture] = useState("");
  const [selectedGroup2Loss, setSelectedGroup2Loss] = useState("");

  useEffect(() => {
    fetch('/cotta-pages//data.json')
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
      })
      .catch(err => console.error("Error fetching JSON:", err));
  }, []);

  useEffect(() => {
    if (!data) return;
  
    const group = {};
  
    Object.entries(data).forEach(([fileName, fileObj]) => {
      // Extract architecture key dynamically (it is NOT a noise corruption type)
      const architectureKey = Object.keys(fileObj).find(key => key.startsWith("cotta") || key.startsWith("norm") || key.startsWith("source"));
      
      if (!architectureKey) return; // Skip if no valid architecture key found
  
      const lossFunction = fileObj[architectureKey]; // Get the corresponding loss function name
  
      if (!group[architectureKey]) {
        group[architectureKey] = {};
      }
      if (!group[architectureKey][lossFunction]) {
        group[architectureKey][lossFunction] = [];
      }
  
      group[architectureKey][lossFunction].push(fileObj);
    });
  
    setGroupedData(group);
  
    // Populate the architecture dropdown with valid options
    const architectures = Object.keys(group);
    if (architectures.length > 0) {
      if (!selectedGroup1Architecture) {
        setSelectedGroup1Architecture(architectures[0]);
      }
      if (architectures.length > 1 && !selectedGroup2Architecture) {
        setSelectedGroup2Architecture(architectures[1]);
      }
    }
  
    // Extract noise corruption keys from the first architecture + loss function pair
    if (architectures.length > 0) {
      const firstArchitecture = architectures[0];
      const lossFns = Object.keys(group[firstArchitecture]);
      if (lossFns.length > 0) {
        const firstFile = group[firstArchitecture][lossFns[0]][0];
        const noises = Object.keys(firstFile).filter(key => !["cotta", "cotta_selftrain", "cotta_poly", "norm", "source", "cotta_kl", "cotta_cosine"].includes(key));
        setNoiseKeys(noises);
      }
    }
  }, [data]);

  useEffect(() => {
    if (selectedGroup1Architecture && groupedData[selectedGroup1Architecture]) {
      const lossFns = Object.keys(groupedData[selectedGroup1Architecture]);
      if (lossFns.length > 0) {
        setSelectedGroup1Loss(lossFns[0]);
      }
    }
  }, [selectedGroup1Architecture, groupedData]);
  
  useEffect(() => {
    if (selectedGroup2Architecture && groupedData[selectedGroup2Architecture]) {
      const lossFns = Object.keys(groupedData[selectedGroup2Architecture]);
      if (lossFns.length > 0) {
        setSelectedGroup2Loss(lossFns[0]);
      }
    }
  }, [selectedGroup2Architecture, groupedData]);

  function getAverageMetricForGroup(architecture, loss, metric) {
    const files = groupedData[architecture] && groupedData[architecture][loss] ? groupedData[architecture][loss] : [];
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

  if (!data || noiseKeys.length === 0) {
    return <p>Loading data...</p>;
  }

  const architectureOptions = Object.keys(groupedData);

  const averagesGroup1 = getAverageMetricForGroup(selectedGroup1Architecture, selectedGroup1Loss, selectedMetric);
  const averagesGroup2 = getAverageMetricForGroup(selectedGroup2Architecture, selectedGroup2Loss, selectedMetric);

  const architectureMapping = {
    "Kireev2021Effectiveness_Gauss50percent": "M1",
    "Kireev2021Effectiveness_RLAT": "M2",
    "Kireev2021Effectiveness_RLATAugMix": "M3",
    "Standard": "M4",
    "Hendrycks2020AugMix_ResNeXt": "M5",
    "Addepalli2022Efficient_WRN_34_10": "M6",
    "Hendrycks2020AugMix_WRN": "M7"
  };

  const barChartData = {
    labels: noiseKeys,
    datasets: [
      {
        label: `${selectedGroup1Architecture} - ${selectedGroup1Loss} (${selectedMetric})`,
        data: noiseKeys.map(noise => averagesGroup1[noise]),
        backgroundColor: 'rgba(75, 192, 192, 0.4)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: `${selectedGroup2Architecture} - ${selectedGroup2Loss} (${selectedMetric})`,
        data: noiseKeys.map(noise => averagesGroup2[noise]),
        backgroundColor: 'rgba(255, 99, 132, 0.4)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: 'white' } },
      title: { display: true, text: `Comparison of ${selectedMetric}`, color: 'white' }
    },
    scales: {
      x: { ticks: { color: 'white' }, title: { display: true, text: 'Noise Type', color: 'white' } },
      y: { ticks: { color: 'white' }, title: { display: true, text: selectedMetric, color: 'white' } }
    }
  };

  return (
    <div className="my-6 p-6 bg-gray-900 rounded-xl shadow-lg text-white">
      <h2 className="text-2xl font-bold mb-4">Results Dashboard</h2>
      
      <div className="mb-4">
        <div>
          <strong>Select Metric:</strong>
          {["accuracy", "precision", "recall", "f1"].map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`ml-2 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-400 ${
                metric === selectedMetric ? "bg-blue-500" : ""
              }`}
            >
              {metric}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <strong>Group 1:</strong>
          <label className="ml-2">
          Loss Function:
          <select
            value={selectedGroup1Architecture}
            onChange={e => setSelectedGroup1Architecture(e.target.value)}
            className="ml-2 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-400"
          >
            {architectureOptions.map(a => (
              <option key={a} value={a}>{architectureMapping[a] || a}</option>
            ))}
          </select>
          </label>
          <label className="ml-2">
            Architecture:
            <select
              value={selectedGroup1Loss}
              onChange={e => setSelectedGroup1Loss(e.target.value)}
              className="ml-2 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-400"
            >
              {groupedData[selectedGroup1Architecture] &&
                Object.keys(groupedData[selectedGroup1Architecture]).map(loss => (
                  <option key={loss} value={loss}>{architectureMapping[loss] || loss}</option>
                ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <strong>Group 2:</strong>
          <label className="ml-2">
            Loss Function:
            <select
              value={selectedGroup2Architecture}
              onChange={e => setSelectedGroup2Architecture(e.target.value)}
              className="ml-2 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-400"
            >
              {architectureOptions.map(a => (
                <option key={a} value={a}>{architectureMapping[a] || a}</option>
              ))}
            </select>
          </label>
          <label className="ml-2">
            Architecture:
            <select
              value={selectedGroup2Loss}
              onChange={e => setSelectedGroup2Loss(e.target.value)}
              className="ml-2 px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:ring-2 focus:ring-blue-400"
            >
              {groupedData[selectedGroup2Architecture] &&
                Object.keys(groupedData[selectedGroup2Architecture]).map(loss => (
                  <option key={loss} value={loss}>{architectureMapping[loss] || loss}</option>
                ))}
            </select>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Comparison Bar Chart</h3>
        <Bar data={barChartData} options={chartOptions} />
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Detailed Data Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg">
            <thead>
              <tr className="bg-gray-800 text-blue-400">
                <th className="border border-gray-700 px-4 py-2">Noise Type</th>
                <th className="border border-gray-700 px-4 py-2">{architectureMapping[selectedGroup1Architecture]} - {selectedGroup1Loss} {selectedMetric}</th>
                <th className="border border-gray-700 px-4 py-2">{architectureMapping[selectedGroup2Architecture]} - {selectedGroup2Loss} {selectedMetric}</th>
              </tr>
            </thead>
            <tbody>
              {noiseKeys.map((noise, idx) => (
                <tr key={idx} className="odd:bg-gray-700 even:bg-gray-800 hover:bg-gray-600 transition-all">
                  <td className="border border-gray-700 px-4 py-2">{noise}</td>
                  <td className="border border-gray-700 px-4 py-2">{averagesGroup1[noise].toFixed(3)}</td>
                  <td className="border border-gray-700 px-4 py-2">{averagesGroup2[noise].toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
