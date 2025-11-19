import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { ThemeContext } from '../App';

// Set Chart.js defaults for dark mode
Chart.defaults.color = '#cbd5e1';
Chart.defaults.borderColor = '#374151';
Chart.defaults.plugins.legend.position = 'top';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgb(17, 24, 39)';
Chart.defaults.plugins.tooltip.titleColor = 'rgb(255, 255, 255)';
Chart.defaults.plugins.tooltip.bodyColor = 'rgb(209, 213, 219)';
Chart.defaults.plugins.tooltip.borderColor = 'rgb(75, 85, 99)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 6;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// --- Date Helper Functions ---
const TODAY = new Date();
const MONTH_MAP = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
  'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

function parseDate(dateStr) {
  try {
    const [day, monthStr, year] = dateStr.split('-');
    const month = MONTH_MAP[monthStr];
    const fullYear = 2000 + parseInt(year);
    return new Date(fullYear, month, parseInt(day));
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return null;
  }
}

async function fetchAndParseData(url, headerMapping) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText, headerMapping);
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
}

function parseCSV(csvText, headerMapping) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');

  const keyIndices = {};
  for (const key in headerMapping) {
    const index = headers.indexOf(key);
    if (index > -1) {
      keyIndices[headerMapping[key]] = index;
    }
  }

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    if (cells.length < headers.length) continue;

    const row = {};
    for (const key in keyIndices) {
      const index = keyIndices[key];
      const value = cells[index];

      if (key === 'date') {
        row[key] = value;
      } else if (key === 'genPct') {
        row[key] = parseFloat(value.replace('%', '')) || 0;
      } else {
        row[key] = parseFloat(value) || 0;
      }
    }
    data.push(row);
  }
  return data;
}

function getData(view, data) {
  return data[view] || [];
}

function filterDataByDateRange(data, range) {
  const today = TODAY;

  return data.filter(row => {
    const rowDate = parseDate(row.date);
    if (!rowDate) return false;

    switch (range) {
      case 'today':
        return rowDate.toDateString() === today.toDateString();
      case 'last7':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return rowDate >= sevenDaysAgo && rowDate <= today;
      case 'last30':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return rowDate >= thirtyDaysAgo && rowDate <= today;
      case 'default':
      default:
        const defaultStartDate = new Date(2025, 9, 26);
        return rowDate >= defaultStartDate && rowDate <= today;
    }
  });
}

function updateKpis(data, setKpis) {
  if (data.length === 0) {
    setKpis({
      totalDispatch: 0,
      totalGen: 0,
      avgPct: 0,
      currentStock: 0
    });
    return;
  }

  const totalDispatch = data.reduce((acc, d) => acc + d.dispatchClient, 0);
  const totalGen = data.reduce((acc, d) => acc + d.genT, 0);
  const totalProd = data.reduce((acc, d) => acc + d.prod, 0);
  const avgGenPct = totalProd > 0 ? (totalGen / totalProd) * 100 : 0;
  const currentStock = data[data.length - 1].stock;

  setKpis({
    totalDispatch,
    totalGen,
    avgPct: avgGenPct,
    currentStock
  });
}

function ScrapDashboard({ sheetUrls, title, config }) {
  const { isDarkMode } = React.useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('BOTH');
  const [currentDateRange, setCurrentDateRange] = useState('default');
  const [currentSort, setCurrentSort] = useState({ column: 'date', direction: 'desc' });
  const [kpis, setKpis] = useState({ totalDispatch: 0, totalGen: 0, avgPct: 0, currentStock: 0 });
  const [filteredData, setFilteredData] = useState([]);
  const [data, setData] = useState({ BOTH: [], RML1: [], RML6: [] });

  useEffect(() => {
    async function init() {
      const [bothData, rml1Data, rml6Data] = await Promise.all([
        fetchAndParseData(sheetUrls.BOTH, config.headerMapping),
        fetchAndParseData(sheetUrls.RML1, config.headerMapping),
        fetchAndParseData(sheetUrls.RML6, config.headerMapping)
      ]);
      setData({ BOTH: bothData, RML1: rml1Data, RML6: rml6Data });
      setLoading(false);
    }
    init();
  }, [sheetUrls, config.headerMapping]);

  useEffect(() => {
    const rawData = getData(currentView, data);
    const filtered = filterDataByDateRange(rawData, currentDateRange);
    setFilteredData(filtered);
    updateKpis(filtered, setKpis);
  }, [currentView, currentDateRange, data]);

  // Update Chart.js theme
  useEffect(() => {
    if (isDarkMode) {
      Chart.defaults.color = '#cbd5e1';
      Chart.defaults.borderColor = '#374151';
      Chart.defaults.plugins.tooltip.backgroundColor = 'rgb(17, 24, 39)';
      Chart.defaults.plugins.tooltip.titleColor = 'rgb(255, 255, 255)';
      Chart.defaults.plugins.tooltip.bodyColor = 'rgb(209, 213, 219)';
      Chart.defaults.plugins.tooltip.borderColor = 'rgb(75, 85, 99)';
    } else {
      Chart.defaults.color = '#334155';
      Chart.defaults.borderColor = '#cbd5e1';
      Chart.defaults.plugins.tooltip.backgroundColor = 'rgb(255, 255, 255)';
      Chart.defaults.plugins.tooltip.titleColor = 'rgb(15, 23, 42)';
      Chart.defaults.plugins.tooltip.bodyColor = 'rgb(51, 65, 85)';
      Chart.defaults.plugins.tooltip.borderColor = 'rgb(203, 213, 225)';
    }
  }, [isDarkMode]);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleDateRangeChange = (e) => {
    setCurrentDateRange(e.target.value);
  };

  const handleSort = (column) => {
    setCurrentSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[currentSort.column];
    let valB = b[currentSort.column];

    if (currentSort.column === 'date') {
      valA = parseDate(valA);
      valB = parseDate(valB);
    }

    if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const genVsDispatchData = {
    labels: filteredData.map(d => d.date),
    datasets: [
      {
        label: 'Scrap Generation (T)',
        data: filteredData.map(d => d.genT),
        borderColor: '#f59e0b',
        borderWidth: 2,
        pointBackgroundColor: '#dc2626',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Dispatch to Client (T)',
        data: filteredData.map(d => d.dispatchClient),
        borderColor: '#22c55e',
        borderWidth: 2,
        pointBackgroundColor: '#22c55e',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        fill: false,
      }
    ]
  };

  const totalUsageData = filteredData.map(d => {
    return config.transferFields.reduce((sum, field) => sum + (d[field] || 0), 0);
  });

  const genVsUsageData = {
    labels: filteredData.map(d => d.date),
    datasets: [
      {
        label: 'Scrap Generation (T)',
        data: filteredData.map(d => d.genT),
        backgroundColor: '#f59e0b',
        borderRadius: 4,
        order: 1
      },
      {
        label: 'Total Scrap Usage (T)',
        data: totalUsageData,
        type: 'line',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        fill: false,
        order: 0
      }
    ]
  };

  const distributionTotals = config.transferFields.map(field => {
    return filteredData.reduce((acc, d) => acc + (d[field] || 0), 0);
  });

  const distributionLabels = config.transferFields.map(field => {
    switch (field) {
      case 'transferIF': return 'Transfer to Induction Furnace';
      case 'transferSMS': return 'Transfer to SMS';
      case 'dispatchClient': return 'Dispatch to Client';
      case 'rml6Cml': return 'RML6 Crusher- CML';
      case 'rml6NonCml': return 'RML6 Crusher- Non-CML';
      default: return field;
    }
  });

  const distributionData = {
    labels: distributionLabels,
    datasets: [{
      label: 'Scrap Usage (T)',
      data: distributionTotals,
      backgroundColor: [
        '#d97706',
        '#6366f1',
        '#22c55e',
        '#f59e0b',
        '#8b5cf6',
      ].slice(0, config.transferFields.length),
      borderColor: '#1f2937',
      borderWidth: 4,
      hoverOffset: 8
    }]
  };

  const gridColor = isDarkMode ? '#374151' : '#e2e8f0';

  const getPlantName = (plant) => {
    switch (plant) {
      case 'BOTH': return 'Both Plants';
      case 'RML1': return 'RML 1';
      case 'RML6': return 'RML 6';
      default: return plant;
    }
  };

  if (loading) {
    return (
      <div id="loading-overlay">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-white">Loading Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen p-4 md:p-8 antialiased">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">{title}</h1>
        </header>

        <main>
          <section className="mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <label htmlFor="date-range" className="text-sm font-medium text-gray-600 dark:text-gray-400">Date Range:</label>
                <select id="date-range" value={currentDateRange} onChange={handleDateRangeChange}
                  className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 block p-2">
                  <option value="default">Default</option>
                  <option value="today">Today</option>
                  <option value="last7">Last 7 Days</option>
                  <option value="last30">Last 30 Days</option>
                </select>
              </div>

              <div id="plant-switcher" className="ml-auto">
                <div
                  className="relative flex items-center bg-gray-200 dark:bg-gray-800 rounded-lg p-1 overflow-hidden"
                  role="tablist"
                  aria-label="Plant switcher"
                  style={{ minWidth: 320 }} // ensures 3 items fit on one line; adjust/remove as needed
                >
                  {/* Indigo sliding indicator (behind buttons) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-indigo-600 rounded-md shadow-lg transition-transform duration-300 ease-in-out z-0"
                    style={{
                      transform: `translateX(${['BOTH', 'RML1', 'RML6'].indexOf(currentView) * 100}%)`,
                      width: 'calc(100% / 3)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Buttons (above the slider) */}
                  <div className="relative z-10 flex w-full">
                    {['BOTH', 'RML1', 'RML6'].map((plant) => {
                      const active = currentView === plant;
                      return (
                        <button
                          key={plant}
                          role="tab"
                          aria-selected={active}
                          onClick={() => handleViewChange(plant)}
                          className="relative z-10 px-3 py-2 text-sm font-medium text-center whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/40"
                          style={{ width: 'calc(100% / 3)' }}
                        >
                          <span className={`${active ? 'text-white' : 'text-black dark:text-white'}`}>
                            {getPlantName(plant)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 border-l-4 border-amber-500">
              <div className="bg-amber-500 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="4">
                  <g>
                    <path d="M23 10V9c0-2.209 1.791-4 4-4h25c2.209 0 4 1.791 4 4v1" strokeLinecap="round"/>
                    <line x1="18" y1="22" x2="18" y2="30" strokeLinecap="round"/>
                    <line x1="29" y1="22" x2="29" y2="30" strokeLinecap="round"/>
                    <line x1="40" y1="22" x2="40" y2="30" strokeLinecap="round"/>
                    <line x1="51" y1="22" x2="51" y2="24" strokeLinecap="round"/>
                    <line x1="62" y1="22" x2="62" y2="30" strokeLinecap="round"/>
                    <path d="M66 30H14c-2.209 0-4-1.791-4-4v-6c0-2.209 1.791-4 4-4h52c2.209 0 4 1.791 4 4v6c0 2.209-1.791 4-4 4z"/>
                    <path d="M18 30v37c0 4.418 3.582 8 8 8h28c4.418 0 8-3.582 8-8V30" strokeLinecap="round"/>
                    <path d="M52.603 57.375l3.148 5.453c.557.966-.139 2.172-1.254 2.172L38.003 65" strokeLinecap="round"/>
                    <polyline points="42.003,61 38.003,65 42.003,69" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M35.608 43.166l3.148-5.453c.557-.966 1.951-.966 2.509 0l8.246 14.284" strokeLinecap="round"/>
                    <polyline points="44.047,50.533 49.511,51.997 50.975,46.533" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M31.8 64.989h-6.297c-1.115 0-1.812-1.207-1.254-2.172l8.247-14.283" strokeLinecap="round"/>
                    <polyline points="33.96,53.997 32.496,48.533 27.032,49.997" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scrap Generated (T)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.totalGen.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 border-l-4 border-red-600">
              <div className="bg-red-600 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Generation %</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.avgPct.toFixed(2)}%</p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 border-l-4 border-green-600">
              <div className="bg-green-600 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 36 36" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M30 12h-4V7a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v18a1 1 0 0 0 1 1h1V8h20v13.49A4.45 4.45 0 0 0 21.25 24h-6.82a4.5 4.5 0 1 0-4.17 2.76A4.38 4.38 0 0 0 14.72 26H21a4.48 4.48 0 0 0 8.91 0H34V16a4 4 0 0 0-4-4zm-19.74 16a2.38 2.38 0 1 1 0-4.75 2.38 2.38 0 1 1 0 4.75zm15.16 0a2.38 2.38 0 1 1 2.5-2.37 2.44 2.44 0 0 1-2.5 2.37zM32 17h-6v-3h4a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Dispatch to Client (T)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.totalDispatch.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 border-l-4 border-indigo-600">
              <div className="bg-indigo-600 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 485 485" fill="none" stroke="currentColor" strokeWidth="20">
                  <path d="M435 315V45H290v90h-50v110h-20V140H55v105H0v195h485V315H435zM70 155h135v20H70v-20zm0 35h135v55H70v-55zm80 70v70h-45v-70h45zm90 165H15V260h75v85h75v-85h75v165zM305 60h115v75H305V60zm50 90v75h-35v-75h35zm-50 275h-65V150h50v90h65v-90h50v165H320v85zm150 0H335v-95h135v95z"/>
                  <rect x="167.5" y="210" width="20" height="15"/>
                  <rect x="137.5" y="210" width="20" height="15"/>
                  <rect x="407.5" y="355" width="40" height="15"/>
                  <rect x="377.5" y="385" width="70" height="15"/>
                  <rect x="377.5" y="100" width="20" height="15"/>
                  <rect x="347.5" y="100" width="20" height="15"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Stock (T)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.currentStock.toLocaleString()}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scrap Generation (T) vs. Dispatch to Client (T)</h3>
              <div className="h-80">
                <Line data={genVsDispatchData} options={{
                  interaction: { mode: 'index', intersect: false },
                  plugins: { tooltip: { mode: 'index' } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: gridColor } },
                    x: { grid: { display: false } }
                  }
                }} />
              </div>
            </div>

            {config.showUsageChart && (
              <div className="lg:col-span-2 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scrap Generation (T) vs. Total Scrap Usage (T)</h3>
                <div className="h-80">
                <Bar data={genVsUsageData} options={{
                    interaction: { mode: 'index', intersect: false },
                    plugins: { tooltip: { mode: 'index' } },
                    scales: {
                      y: { beginAtZero: true, grid: { color: gridColor } },
                      x: { grid: { display: false } }
                    }
                  }} />
                </div>
              </div>
            )}

            {config.showDistributionChart && (
              <div className={`${config.showUsageChart ? 'lg:col-span-1' : 'lg:col-span-3'} bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scrap Usage Distribution</h3>
                <div className="h-80">
                  <Doughnut data={distributionData} options={{
                    plugins: {
                      legend: { position: 'bottom', labels: { padding: 15 } }
                    }
                  }} />
                </div>
              </div>
            )}
          </section>

          <section className="mt-6 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Table</h3>
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-200 dark:bg-gray-700">
                  <tr>
                    {Object.keys(config.headerMapping).map(key => {
                      const field = config.headerMapping[key];
                      const getColumnLabel = (field) => {
                        switch (field) {
                          case 'date': return 'Date';
                          case 'prod': return 'Gross Prod (T)';
                          case 'genT': return 'Generation (T)';
                          case 'genPct': return 'Generation (%)';
                          case 'transferIF': return 'Transfer IF (T)';
                          case 'transferSMS': return 'Transfer SMS (T)';
                          case 'dispatchClient': return 'Dispatch (T)';
                          case 'stock': return 'Stock (T)';
                          case 'rml6Cml': return 'RML6 Crusher- CML (T)';
                          case 'rml6NonCml': return 'RML6 Crusher- Non-CML (T)';
                          default: return field;
                        }
                      };
                      return (
                        <th
                          key={field}
                          scope="col"
                          className={`sortable-th px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider ${currentSort.column === field ? (currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc') : ''}`}
                          onClick={() => handleSort(field)}
                        >
                          <svg className="th-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {getColumnLabel(field)} <span className="sort-icon"></span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-gray-50 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedData.length === 0 ? (
                    <tr><td colSpan={Object.keys(config.headerMapping).length} className="text-center py-4 text-gray-500 dark:text-gray-400">No data found for the selected range.</td></tr>
                  ) : (
                    sortedData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        {Object.keys(config.headerMapping).map(key => {
                          const field = config.headerMapping[key];
                          const value = row[field];
                          const formatValue = (value, field) => {
                            if (value === undefined || value === null) return '0';
                            if (field === 'genPct') return `${value.toFixed(2)}%`;
                            return value.toLocaleString();
                          };
                          return (
                            <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                              {formatValue(value, field)}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default ScrapDashboard;
