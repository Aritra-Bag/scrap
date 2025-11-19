import React, { useState, useEffect, useRef, useContext } from 'react';
import Chart from 'chart.js/auto';
import { ThemeContext } from '../App';

function Home() {
  // Move hook inside the component
  const { isDarkMode } = useContext(ThemeContext);

  // State management
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScrap, setSelectedScrap] = useState('Casting');
  const [currentPlant, setCurrentPlant] = useState('both');
  const [currentDateRange, setCurrentDateRange] = useState('default');
  const [currentHeaders, setCurrentHeaders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'DateObj', direction: 'desc' });
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Ref for chart instance
  const chartRef = useRef(null);
  const [mainChart, setMainChart] = useState(null);

  // Table sorting state
  const [tableSortConfig, setTableSortConfig] = useState({ key: 'DateObj', direction: 'desc' });
  const [tableData, setTableData] = useState([]);

  // Constants
  const allPossibleScrapKeys = [
    'Casting', 'As Cast', 'Runner Scrap', 'Slag',
    'High metal Bolder', 'High Metal Dust', 'Low Metal Slag',
    'Refractory Slag', 'HPTM', 'CML', 'Handling'
  ];
  const allCastingComponents = [
    'As Cast', 'Runner Scrap', 'Slag', 'High metal Bolder',
    'High Metal Dust', 'Low Metal Slag', 'Refractory Slag'
  ];
  const googleSheetBaseUrl = "https://docs.google.com/spreadsheets/d/1aNc3YIhSbHXgmTMnWOVv3cufWR6es4lPeAnTT0zRHq4/export?format=csv&gid=";
  const plantGIDs = {
    "rml6": "796931092",
    "rml1": "1531920560",
    "both": "478811665"
  };
  const monthMap = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  // Utility functions
  const parseDate = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10) + 2000;

    const month = monthMap[monthStr];
    if (month === undefined || isNaN(day) || isNaN(year)) {
      return null;
    }

    return new Date(year, month, day);
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return { data: [], headers: [] };

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const entry = {};
      headers.forEach((header, index) => {
        if (header.toLowerCase() === 'date') {
          entry[header] = values[index];
        } else {
          entry[header] = parseFloat(values[index]) || 0;
        }
      });
      data.push(entry);
    }
    return { data, headers };
  };

  const processData = (parsedData) => {
    return parsedData.map(row => {
      const castingTotal = allCastingComponents.reduce((sum, key) => {
        return sum + (row.hasOwnProperty(key) ? row[key] : 0);
      }, 0);

      const dateObj = parseDate(row['Date']);

      return {
        ...row,
        'Casting': castingTotal,
        'DateObj': dateObj
      };
    });
  };

  const formatNum = (num) => {
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    const fixedNum = num.toFixed(1);
    if (fixedNum.endsWith('.0')) {
      return fixedNum.substring(0, fixedNum.length - 2);
    }
    return fixedNum;
  };

  const getTrend = (start, end) => {
    const change = end - start;
    if (change > 0) {
      return {
        color: 'green',
        sign: '▲',
        css: 'trend-up',
        bgCss: 'bg-trend-up',
        borderCss: 'border-trend-up',
        gradientCss: 'chart-gradient-up'
      };
    }
    if (change < 0) {
      return {
        color: 'red',
        sign: '▼',
        css: 'trend-down',
        bgCss: 'bg-trend-down',
        borderCss: 'border-trend-down',
        gradientCss: 'chart-gradient-down'
      };
    }
    return {
      color: 'blue',
      sign: '▬',
      css: 'trend-neutral',
      bgCss: 'bg-trend-neutral',
      borderCss: 'border-trend-neutral',
      gradientCss: 'chart-gradient-neutral'
    };
  };

  const getPercentChange = (start, end) => {
    if (start === 0) {
      return (end > 0) ? 100.0 : 0.0;
    }
    return ((end - start) / start) * 100;
  };

  // Data fetching
  const fetchAndParseData = async (gid) => {
    const url = `${googleSheetBaseUrl}${gid}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from Google Sheet. Status: ${response.status}`);
    }
    const csvText = await response.text();
    return csvText;
  };

  const loadDashboardData = async (plantValue) => {
    setLoading(true);
    const gid = plantGIDs[plantValue];

    try {
      const csvText = await fetchAndParseData(gid);
      const { data: parsed, headers: dataHeaders } = parseCSV(csvText);

      if (parsed.length === 0) {
        throw new Error("No data found in Google Sheet.");
      }

      const processedData = processData(parsed);
      setAllData(processedData);

      const scrapKeys = allPossibleScrapKeys.filter(key =>
        key === 'Casting' || dataHeaders.includes(key)
      );

      const headers = ['Date', ...scrapKeys];
      setCurrentHeaders(headers);

      if (!scrapKeys.includes(selectedScrap)) {
        setSelectedScrap('Casting');
      }

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  useEffect(() => {
    if (!allData.length) return;

    let filtered = [...allData];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (currentDateRange) {
      case 'today':
        const todayTime = today.getTime();
        filtered = allData.filter(row => {
          if (!row.DateObj) return false;
          const rowDate = new Date(row.DateObj);
          rowDate.setHours(0, 0, 0, 0);
          return rowDate.getTime() === todayTime;
        });
        break;
      case 'last7':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const endTime = new Date(today);
        endTime.setHours(23, 59, 59, 999);

        filtered = allData.filter(row => {
          return row.DateObj && row.DateObj >= sevenDaysAgo && row.DateObj <= endTime;
        });
        break;
      case 'last30':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const endTime30 = new Date(today);
        endTime30.setHours(23, 59, 59, 999);

        filtered = allData.filter(row => {
          return row.DateObj && row.DateObj >= thirtyDaysAgo && row.DateObj <= endTime30;
        });
        break;
      case 'default':
        const startDate = new Date();
        startDate.setDate(1);
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(26);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        filtered = allData.filter(row => {
          return row.DateObj && row.DateObj >= startDate && row.DateObj <= endDate;
        });
        break;
      default:
        break;
    }

    setFilteredData(filtered);
    setTableData(filtered);
  }, [allData, currentDateRange]);

  // Update date/time
  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      }));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update chart
  useEffect(() => {
    if (chartRef.current && filteredData.length > 0) {
      updateMainChart(selectedScrap, filteredData);
    }
  }, [selectedScrap, filteredData]);

  // Update table sorting
  useEffect(() => {
    if (!filteredData.length) {
      setTableData([]);
      return;
    }

    const sorted = [...filteredData].sort((a, b) => {
      let aVal = a[tableSortConfig.key];
      let bVal = b[tableSortConfig.key];

      if (tableSortConfig.key === 'DateObj') {
        aVal = a.DateObj ? a.DateObj.getTime() : Infinity;
        bVal = b.DateObj ? b.DateObj.getTime() : Infinity;
      } else if (tableSortConfig.key === 'Date') {
        aVal = a.DateObj ? a.DateObj.getTime() : (new Date(a.Date)).getTime();
        bVal = b.DateObj ? b.DateObj.getTime() : (new Date(b.Date)).getTime();
      }

      if (typeof aVal === 'number' && typeof bVal === 'number' && !isNaN(aVal) && !isNaN(bVal)) {
        if (aVal < bVal) return tableSortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return tableSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();

      if (aVal < bVal) return tableSortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return tableSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setTableData(sorted);
  }, [filteredData, tableSortConfig]);

  // Handlers
  const handlePlantChange = (plantValue) => {
    setCurrentPlant(plantValue);
    loadDashboardData(plantValue);
  };

  const handleScrapSelect = (scrapKey) => {
    setSelectedScrap(scrapKey);
  };

  const updateMainChart = (scrapKey, data) => {
    const gridColor = isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(156, 163, 175, 0.3)';
    const ctx = chartRef.current.getContext('2d');

    if (!data || data.length === 0) {
      if (mainChart) {
        mainChart.destroy();
        setMainChart(null);
      }
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.font = '16px Inter';
      ctx.fillText('No data to display for this range.', ctx.canvas.width / 2, ctx.canvas.height / 2);
      return;
    }

    const labels = data.map(row => row['Date']);
    const chartData = data.map(row => row[scrapKey]);
    const trend = getTrend(chartData[0], chartData[chartData.length - 1]);

    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    if (trend.color === 'green') {
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.5)');
    } else if (trend.color === 'red') {
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
    } else {
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    }
    gradient.addColorStop(1, 'rgba(30, 41, 59, 0)');

    if (mainChart) {
      mainChart.destroy();
    }

    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${scrapKey} Stock (T)`,
          data: chartData,
          borderColor: trend.color === 'green' ? '#22c55e' : (trend.color === 'red' ? '#ef4444' : '#3b82f6'),
          backgroundColor: gradient,
          fill: true,
          tension: 0.1,
          pointRadius: 2,
          pointBackgroundColor: trend.color === 'green' ? '#22c55e' : (trend.color === 'red' ? '#ef4444' : '#3b82f6'),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            callbacks: {
              title: function (tooltipItems) {
                return 'Date: ' + tooltipItems[0].label;
              },
              label: function (context) {
                return `Stock: ${formatNum(context.raw)} T`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
            grid: { color: gridColor }
          },
          y: {
            ticks: {
              color: '#94a3b8',
              callback: function (value) {
                return formatNum(value) + ' T';
              }
            },
            grid: { color: gridColor },
            beginAtZero: true
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });

    setMainChart(newChart);
  };

  const updateKpiCards = (data) => {
    if (!data || data.length === 0) {
      return {
        casting: '0',
        hptm: '0',
        cml: 'N/A',
        handling: '0',
        cmlHidden: true
      };
    }

    const latestData = data[data.length - 1];
    return {
      casting: latestData.hasOwnProperty('Casting') ? formatNum(latestData['Casting']) : '0',
      hptm: latestData.hasOwnProperty('HPTM') ? formatNum(latestData['HPTM']) : '0',
      handling: latestData.hasOwnProperty('Handling') ? formatNum(latestData['Handling']) : '0',
      cml: latestData.hasOwnProperty('CML') ? formatNum(latestData['CML']) : 'N/A',
      cmlHidden: !latestData.hasOwnProperty('CML')
    };
  };

  const updateChartSummary = (scrapKey, data) => {
    if (!data || data.length === 0) {
      return {
        current: '-',
        change: '-',
        percentChange: '-'
      };
    }

    const firstData = data[0][scrapKey];
    const lastData = data[data.length - 1][scrapKey];

    const change = lastData - firstData;
    const percentChange = getPercentChange(firstData, lastData);
    const trend = getTrend(firstData, lastData);

    return {
      current: formatNum(lastData),
      change: `${trend.sign} ${formatNum(Math.abs(change))}`,
      percentChange: `(${formatNum(Math.abs(percentChange))}%)`,
      css: trend.css
    };
  };

  const generateScrapList = () => {
    if (!filteredData.length) return [];

    const firstData = filteredData[0];
    const lastData = filteredData[filteredData.length - 1];

    const currentScrapKeys = allPossibleScrapKeys.filter(key =>
      key === 'Casting' || currentHeaders.includes(key)
    );

    return currentScrapKeys.map(key => {
      if (!lastData.hasOwnProperty(key) || !firstData.hasOwnProperty(key)) {
        return null;
      }

      const currentQty = lastData[key];
      const previousQty = firstData[key];

      const percentChange = getPercentChange(previousQty, currentQty);
      const trend = getTrend(previousQty, currentQty);

      return {
        key,
        currentQty,
        percentChange,
        trend,
        isActive: key === selectedScrap
      };
    }).filter(Boolean);
  };

  // Theme effect
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

    if (mainChart) {
      mainChart.update();
    }
  }, [isDarkMode, mainChart]);

  // Initial load
  useEffect(() => {
    loadDashboardData(currentPlant);
  }, []);

  const kpis = updateKpiCards(filteredData);
  const chartSummary = updateChartSummary(selectedScrap, filteredData);
  const scrapList = generateScrapList();

  const getPlantName = (plant) => {
    switch (plant) {
      case 'both': return 'Both Plants';
      case 'rml1': return 'RML 1';
      case 'rml6': return 'RML 6';
      default: return 'Unknown Plant';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen p-4 md:p-8 antialiased">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Loading Data...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">Scrap Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{currentDateTime || 'Loading date...'}</p>
      </header>

      {/* Controls */}
      <section className="mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <label htmlFor="date-range" className="text-sm font-medium text-gray-600 dark:text-gray-400">Date Range:</label>
            <select
              id="date-range"
              value={currentDateRange}
              onChange={(e) => setCurrentDateRange(e.target.value)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 block p-2"
            >
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
              style={{ minWidth: 320 }}
            >
              {/* Sliding indicator (indigo) */}
              <div
                className="absolute top-0 left-0 h-full bg-indigo-600 rounded-md shadow-lg transition-transform duration-300 ease-in-out z-0"
                style={{
                  transform: `translateX(${['both', 'rml1', 'rml6'].indexOf(currentPlant) * 100}%)`,
                  width: 'calc(100% / 3)',
                }}
                aria-hidden="true"
              />

              {/* Buttons: single-line, equal width */}
              <div className="relative z-10 flex flex-nowrap items-center w-full">
                {['both', 'rml1', 'rml6'].map((plant) => {
                  const active = currentPlant === plant;
                  return (
                    <button
                      key={plant}
                      role="tab"
                      aria-selected={active}
                      onClick={() => handlePlantChange(plant)}
                      className={`relative z-10 px-3 py-2 text-sm font-medium text-center whitespace-nowrap transition-colors duration-200 focus:outline-none`}
                      style={{ width: 'calc(100% / 3)' }}
                    >
                      {/* Text color rules:
                          - if active: always white
                          - else: black in light mode, white in dark mode */}
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

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Casting */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 border-l-4 border-amber-500">
          <div className="bg-amber-500 p-3 rounded-full">
            <svg className="w-6 h-6 text-white" viewBox="0 0 307.206 307.206" xmlns="http://www.w3.org/2000/svg" fill="currentColor" role="img" aria-label="stock icon">
              <g>
                <g>
                  <g id="XMLID_8_">
                    <g>
                      <path fill="#505967" d="M254.001,226.547c6.19,0,11.193,4.971,11.193,11.129c0,6.126-5.003,11.129-11.193,11.129 c-6.158,0-11.161-5.003-11.161-11.129C242.84,231.518,247.843,226.547,254.001,226.547z" />
                      <path fill="#505967" d="M153.202,226.547c6.158,0,11.193,4.971,11.193,11.129c0,6.126-5.035,11.129-11.193,11.129 s-11.193-5.003-11.193-11.129C142.009,231.518,147.045,226.547,153.202,226.547z" />
                      <path fill="#505967" d="M53.205,226.547c6.158,0,11.161,4.971,11.161,11.129c0,6.126-5.003,11.129-11.161,11.129 c-6.19,0-11.193-5.003-11.193-11.129C42.013,231.518,47.016,226.547,53.205,226.547z" />
                      <path fill="#505967" d="M103.492,141.559c6.158,0,11.193,4.971,11.193,11.129c0,6.126-5.035,11.129-11.193,11.129 S92.3,158.814,92.3,152.688C92.3,146.53,97.335,141.559,103.492,141.559z" />
                      <path fill="#505967" d="M203.521,141.559c6.158,0,11.193,4.971,11.193,11.129c0,6.126-5.035,11.129-11.193,11.129 c-6.158,0-11.193-5.003-11.193-11.129C192.329,146.53,197.364,141.559,203.521,141.559z" />
                      <path fill="#2D213F" d="M167.121,152.688c0,19.98,16.324,36.24,36.4,36.24s36.4-16.26,36.4-36.24 s-16.324-36.24-36.4-36.24S167.121,132.708,167.121,152.688z M217.6,237.676c0,19.98,16.324,36.208,36.4,36.208 c20.108,0,36.432-16.228,36.432-36.208s-16.324-36.24-36.432-36.24C233.924,201.436,217.6,217.696,217.6,237.676z  M103.492,188.928c20.076,0,36.4-16.26,36.4-36.24s-16.324-36.24-36.4-36.24s-36.4,16.26-36.4,36.24 S83.416,188.928,103.492,188.928z M116.802,237.676c0,19.98,16.324,36.208,36.4,36.208s36.4-16.228,36.4-36.208 s-16.324-36.24-36.4-36.24S116.802,217.696,116.802,237.676z M118.502,69.528c0,19.98,16.324,36.24,36.4,36.24 c20.108,0,36.432-16.26,36.432-36.24s-16.324-36.24-36.432-36.24C134.826,33.288,118.502,49.548,118.502,69.528z  M16.773,237.676c0,19.98,16.356,36.208,36.432,36.208s36.4-16.228,36.4-36.208s-16.324-36.24-36.4-36.24 S16.773,217.696,16.773,237.676z M254.001,184.727c29.345,0,53.205,23.732,53.205,52.949c0,29.184-23.861,52.917-53.205,52.917 c-23.412,0-43.296-15.17-50.383-36.112c-7.088,20.942-26.972,36.112-50.415,36.112c-23.027,0-42.622-14.656-49.998-35.053 c-7.408,20.397-27.004,35.053-49.998,35.053C23.861,290.593,0,266.86,0,237.676c0-29.217,23.861-52.949,53.205-52.949 c2.918,0,5.805,0.289,8.595,0.77c-7.184-9.044-11.513-20.429-11.513-32.808c0-29.184,23.861-52.949,53.205-52.949 c2.854,0,5.612,0.289,8.338,0.706c-6.35-8.691-10.102-19.371-10.102-30.916c0-29.184,23.861-52.917,53.173-52.917 c29.345,0,53.205,23.732,53.205,52.917c0,11.353-3.624,21.84-9.75,30.467c1.7-0.16,3.432-0.257,5.163-0.257 c29.345,0,53.205,23.764,53.205,52.949c0,12.411-4.362,23.797-11.545,32.84C248.068,185.047,250.986,184.727,254.001,184.727z  M212.373,204.835c-2.886,0.481-5.837,0.802-8.852,0.802c-2.951,0-5.805-0.321-8.627-0.77 c3.784,4.746,6.735,10.134,8.723,16.003C205.606,215.002,208.588,209.582,212.373,204.835z M160.097,122.221 c-1.7,0.16-3.432,0.257-5.195,0.257c-2.822,0-5.58-0.289-8.306-0.706c2.886,3.977,5.195,8.338,6.895,13.053 C155.126,130.303,157.339,126.069,160.097,122.221z M153.202,184.727c2.951,0,5.837,0.289,8.627,0.77 c-3.528-4.458-6.35-9.493-8.338-14.945c-1.956,5.388-4.746,10.391-8.242,14.817 C147.846,184.983,150.508,184.727,153.202,184.727z M111.446,204.963c-2.598,0.385-5.228,0.673-7.954,0.673 c-2.951,0-5.805-0.321-8.627-0.77c3.56,4.458,6.35,9.461,8.338,14.913C105.16,214.392,107.95,209.389,111.446,204.963z" />
                      <path fill="#2D213F" d="M226.035,237.676c0-15.362,12.572-27.837,27.966-27.837c15.426,0,27.998,12.476,27.998,27.837 c0,15.33-12.572,27.837-27.998,27.837C238.607,265.513,226.035,253.006,226.035,237.676z M265.193,237.676 c0-6.158-5.003-11.129-11.193-11.129c-6.158,0-11.161,4.971-11.161,11.129c0,6.126,5.003,11.129,11.161,11.129 C260.19,248.804,265.193,243.801,265.193,237.676z" />
                      <path fill="#D6AA83" d="M226.035,237.676c0,15.33,12.572,27.837,27.966,27.837c15.426,0,27.998-12.508,27.998-27.837 c0-15.362-12.572-27.837-27.998-27.837C238.607,209.838,226.035,222.314,226.035,237.676z M217.6,237.676 c0-19.98,16.324-36.24,36.4-36.24c20.108,0,36.432,16.26,36.432,36.24S274.108,273.884,254,273.884 C233.924,273.884,217.6,257.656,217.6,237.676z" />
                      <path fill="#2D213F" d="M203.521,124.851c15.426,0,27.966,12.476,27.966,27.837c0,15.33-12.54,27.837-27.966,27.837 s-27.966-12.508-27.966-27.837C175.556,137.326,188.095,124.851,203.521,124.851z M214.714,152.688 c0-6.158-5.035-11.129-11.193-11.129c-6.158,0-11.193,4.971-11.193,11.129c0,6.126,5.035,11.129,11.193,11.129 S214.714,158.814,214.714,152.688z" />
                      <path fill="#D6AA83" d="M231.487,152.688c0-15.362-12.54-27.837-27.966-27.837s-27.966,12.476-27.966,27.837 c0,15.33,12.54,27.837,27.966,27.837S231.487,168.018,231.487,152.688z M203.521,116.448c20.076,0,36.4,16.26,36.4,36.24 c0,19.98-16.324,36.24-36.4,36.24s-36.4-16.26-36.4-36.24S183.445,116.448,203.521,116.448z" />
                      <path fill="#2D213F" d="M154.902,80.657c6.19,0,11.193-4.971,11.193-11.129c0-6.126-5.003-11.129-11.193-11.129 c-6.158,0-11.161,5.003-11.161,11.129C143.741,75.686,148.744,80.657,154.902,80.657z M126.936,69.528 c0-15.33,12.572-27.837,27.966-27.837c15.426,0,27.998,12.508,27.998,27.837c0,15.362-12.572,27.837-27.998,27.837 C139.508,97.366,126.936,84.89,126.936,69.528z" />
                      <path fill="#505967" d="M154.902,80.657c-6.158,0-11.161-4.971-11.161-11.129c0-6.126,5.003-11.129,11.161-11.129 c6.19,0,11.193,5.003,11.193,11.129C166.095,75.686,161.092,80.657,154.902,80.657z" />
                      <path fill="#2D213F" d="M181.168,237.676c0,15.33-12.54,27.837-27.966,27.837s-27.966-12.508-27.966-27.837 c0-15.362,12.54-27.837,27.966-27.837S181.168,222.314,181.168,237.676z M164.395,237.676c0-6.158-5.035-11.129-11.193-11.129 s-11.193,4.971-11.193,11.129c0,6.126,5.035,11.129,11.193,11.129C159.36,248.804,164.395,243.801,164.395,237.676z" />
                      <path fill="#D6AA83" d="M126.936,69.528c0,15.362,12.572,27.837,27.966,27.837c15.426,0,27.998-12.476,27.998-27.837 c0-15.33-12.572-27.837-27.998-27.837C139.508,41.691,126.936,54.199,126.936,69.528z M154.902,105.768 c-20.076,0-36.4-16.26-36.4-36.24s16.324-36.24,36.4-36.24c20.108,0,36.432,16.26,36.432,36.24S175.01,105.768,154.902,105.768z " />
                      <path fill="#D6AA83" d="M153.202,209.838c-15.426,0-27.966,12.476-27.966,27.837c0,15.33,12.54,27.837,27.966,27.837 s27.966-12.508,27.966-27.837C181.168,222.314,168.628,209.838,153.202,209.838z M116.802,237.676 c0-19.98,16.324-36.24,36.4-36.24s36.4,16.26,36.4,36.24s-16.324,36.208-36.4,36.208S116.802,257.656,116.802,237.676z" />
                      <path fill="#2D213F" d="M103.492,124.851c15.426,0,27.966,12.476,27.966,27.837c0,15.33-12.54,27.837-27.966,27.837 s-27.966-12.508-27.966-27.837C75.527,137.326,88.066,124.851,103.492,124.851z M114.685,152.688 c0-6.158-5.035-11.129-11.193-11.129S92.3,146.53,92.3,152.688c0,6.126,5.035,11.129,11.193,11.129 C109.65,163.817,114.685,158.814,114.685,152.688z" />
                      <path fill="#D6AA83" d="M103.492,124.851c-15.426,0-27.966,12.476-27.966,27.837c0,15.33,12.54,27.837,27.966,27.837 s27.966-12.508,27.966-27.837C131.458,137.326,118.919,124.851,103.492,124.851z M67.092,152.688 c0-19.98,16.324-36.24,36.4-36.24s36.4,16.26,36.4,36.24s-16.324,36.24-36.4,36.24S67.092,172.668,67.092,152.688z" />
                      <path fill="#2D213F" d="M25.208,237.676c0-15.362,12.572-27.837,27.998-27.837s27.966,12.476,27.966,27.837 c0,15.33-12.54,27.837-27.966,27.837S25.208,253.006,25.208,237.676z M64.366,237.676c0-6.158-5.003-11.129-11.161-11.129 c-6.19,0-11.193,4.971-11.193,11.129c0,6.126,5.003,11.129,11.193,11.129C59.363,248.804,64.366,243.801,64.366,237.676z" />
                      <path fill="#D6AA83" d="M16.773,237.676c0-19.98,16.356-36.24,36.432-36.24s36.4,16.26,36.4,36.24 s-16.324,36.208-36.4,36.208S16.773,257.656,16.773,237.676z M53.205,209.838c-15.426,0-27.998,12.476-27.998,27.837 c0,15.33,12.572,27.837,27.998,27.837s27.966-12.508,27.966-27.837C81.171,222.314,68.632,209.838,53.205,209.838z" />
                    </g>
                  </g>
                </g>
              </g>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Casting (T)</p>
            <p id="kpi-casting" className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.casting}</p>
          </div>
        </div>

        {/* HPTM */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 border-l-4 border-red-600">
          <div className="bg-red-600 p-3 rounded-full">
            <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" role="img" aria-label="gauge icon">
              <path d="M256,0C114.51,0,0,114.497,0,256c0,141.491,114.497,256,256,256c141.49,0,256-114.497,256-256C512,114.509,397.503,0,256,0zM256,478.609c-122.746,0-222.609-99.862-222.609-222.609S133.254,33.391,256,33.391S478.609,133.254,478.609,256S378.746,478.609,256,478.609z" />
              <path d="M256,66.783C151.29,66.783,66.783,151.738,66.783,256c0,48.619,18.872,97.248,55.421,133.797c6.52,6.52,17.091,6.52,23.611,0l23.611-23.611c6.52-6.519,6.52-17.09,0-23.611c-6.519-6.52-17.09-6.52-23.611,0l-11.177,11.177c-19.241-23.851-30.408-52.1-33.501-81.056h15.734c9.22,0,16.696-7.475,16.696-16.696c0-9.22-7.475-16.696-16.696-16.696h-15.725c3.094-28.955,14.261-57.198,33.5-81.05l11.17,11.169c6.52,6.52,17.091,6.52,23.611,0c6.519-6.519,6.519-17.091,0-23.611l-11.175-11.175c23.276-18.804,51.227-30.356,81.054-33.5v15.732c0,9.22,7.475,16.696,16.696,16.696c9.22,0,16.696-7.475,16.696-16.696v-15.731c29.827,3.144,57.777,14.698,81.054,33.5l-72.032,72.032c-7.699-4.03-16.444-6.323-25.719-6.323c-30.687,0-55.652,24.966-55.652,55.652c0,30.687,24.966,55.652,55.652,55.652c30.687,0,55.652-24.966,55.652-55.652c0-9.275-2.293-18.02-6.323-25.718l72.026-72.026c19.239,23.85,30.406,52.094,33.5,81.05H395.13c-9.22,0-16.696,7.475-16.696,16.696c0,9.22,7.475,16.696,16.696,16.696h15.734c-3.093,28.956-14.26,57.206-33.501,81.056l-11.177-11.177c-6.519-6.519-17.091-6.519-23.611,0c-6.52,6.52-6.52,17.091,0,23.611l23.611,23.611c6.52,6.52,17.091,6.52,23.611,0c36.482-36.483,55.421-85.084,55.421-133.798C445.217,151.681,360.676,66.783,256,66.783zM256,278.261c-12.275,0-22.261-9.986-22.261-22.261c0-12.275,9.986-22.261,22.261-22.261c12.275,0,22.261,9.986,22.261,22.261C278.261,268.275,268.275,278.261,256,278.261z" />
              <path d="M272.696,345.043h-33.391c-27.618,0-50.087,22.469-50.087,50.087s22.469,50.087,50.087,50.087h33.391c27.618,0,50.087-22.469,50.087-50.087S300.314,345.043,272.696,345.043zM272.696,411.826h-33.391c-9.206,0-16.696-7.49-16.696-16.696s7.49-16.696,16.696-16.696h33.391c9.206,0,16.696,7.49,16.696,16.696S281.902,411.826,272.696,411.826z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">HPTM (T)</p>
            <p id="kpi-hptm" className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.hptm}</p>
          </div>
        </div>

        {/* CML */}
        <div
          id="kpi-cml-card"
          className={`bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 border-l-4 border-green-600 transition-opacity ${kpis.cmlHidden ? 'opacity-50' : ''}`}
        >
          <div className="bg-green-600 p-3 rounded-full">
            {/* use viewBox 512x512 to match the path coordinates; fill uses currentColor so Tailwind text-white works */}
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 512 512"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              role="img"
              aria-label="gauge star"
            >
              <path d="M256 19C125 19 19 125 19 256s106 237 237 237 237-106 237-237S387 19 256 19zm31.2 24.62c32 8.05 45.4 16.11 62.4 33.82-14.2 10.15-32.7 13.37-52.5 14.63 27.8 6.96 52.9 20.83 73.3 39.63 8.3 3.4 15.9 5.1 21.4 2.9-16-9.8-21.9-32.5-17.9-46.12 20.6 23.02 30.2 38.12 54.3 39.32 16.9 28.3 20.7 43.5 20.2 68.1-17.3-2.9-32.7-13.7-47.6-26.9 14.3 23.6 22.9 51.1 24.1 80.4 3.4 8.1 7.5 14.6 12.9 16.8-4.3-18.3 7.5-38.5 20-45.3-1.8 30.8-5.7 48.3 10.5 66.2-8 32-16.1 45.4-33.8 62.4-10.1-14.2-13.3-32.6-14.6-52.3-7 27.9-21 53.1-40 73.6-3.2 8.1-4.8 15.5-2.6 20.9 9.9-16 32.5-21.9 46.1-17.9-23 20.5-38.1 30.1-39.3 54.3-28.3 16.9-43.5 20.7-68.1 20.2 2.9-17.1 13.6-32.4 26.6-47.3-23.6 14.3-51.1 22.8-80.4 23.9-7.9 3.3-14.2 7.5-16.4 12.7 18.3-4.3 38.5 7.6 45.3 20-30.8-1.7-48.3-5.6-66.2 10.6-32-8-45.4-16.1-62.4-33.8 14.1-10.1 32.3-13.3 51.9-14.6-27.8-7-52.9-21-73.3-40-8-3.2-15.5-4.8-20.8-2.7 16 9.9 21.9 32.6 17.9 46.2-20.6-23-30.2-38.1-54.31-39.3-16.97-28.3-20.72-43.5-20.22-68 17.15 2.8 32.4 13.5 47.23 26.5-14.17-23.6-22.7-51-23.77-80.2-3.39-8-7.53-14.4-12.81-16.6 4.3 18.3-7.6 38.5-20 45.3 1.7-30.8 5.6-48.3-10.6-66.2 8-32 16.1-45.4 33.8-62.4 10.16 14.1 13.35 32.5 14.61 52.2a168.64 168.64 0 0 1 39.77-73.2c3.4-8.2 5-15.8 2.8-21.2-9.9 16-32.6 21.8-46.13 17.9 23.03-20.6 38.13-30.2 39.33-54.32 26.5-15.91 41.5-20.2 63.5-20.26 1.5-.01 3 .01 4.5.04-2.8 17.31-13.7 32.65-26.9 47.64 23.7-14.31 51.1-22.93 80.4-24.06 8.2-3.41 14.7-7.6 16.9-12.96-18.3 4.31-38.5-7.53-45.3-19.99 30.8 1.71 48.3 5.62 66.2-10.57zm12.9 14.02c-5.5 0-10 4.48-10 10s4.5 10 10 10 10-4.48 10-10-4.5-10-10-10zm-146.1 24c-2.6 0-5.1.98-7.1 2.92-3.9 3.89-3.9 10.25 0 14.14 3.9 3.9 10.3 3.9 14.2 0 3.8-3.89 3.8-10.25 0-14.14-2-1.94-4.5-2.92-7.1-2.92zM420.3 144c-2.5 0-5.1 1-7.1 2.9-3.9 3.9-3.8 10.2 0 14.1 3.9 3.9 10.3 3.9 14.2 0 3.9-3.9 3.9-10.3 0-14.1-1.9-1.9-4.5-2.9-7.1-2.9zM67.72 201.9c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zM444.3 290c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zM91.74 347.9c-2.56 0-5.13 1-7.07 2.9-3.89 3.9-3.89 10.3 0 14.2 3.89 3.9 10.25 3.9 14.14 0 3.89-3.9 3.89-10.3 0-14.2-1.94-1.9-4.51-2.9-7.07-2.9zm266.16 62.3c-2.5 0-5 .9-7 2.9-3.9 3.9-3.9 10.3 0 14.2 3.9 3.9 10.2 3.9 14.1 0 3.9-3.9 3.9-10.3 0-14.2-2-2-4.5-2.9-7.1-2.9zm-145.9 24c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CML (T)</p>
            <p id="kpi-cml" className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.cml}</p>
          </div>
        </div>

        {/* Handling */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-xl flex items-center space-x-4 border-l-4 border-indigo-600">
          <div className="bg-indigo-600 p-3 rounded-full">
            <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" role="img" aria-label="forklift icon">
              <path d="M68.267 426.667c-9.429 0-17.067 7.637-17.067 17.067 0 9.421 7.637 17.067 17.067 17.067s17.067-7.646 17.067-17.067c0-9.429-7.637-17.067-17.067-17.067z" />
              <path d="M486.4 460.8h-85.333V25.6c0-14.114-11.486-25.6-25.6-25.6s-25.6 11.486-25.6 25.6v281.6h-26.095C321.314 128.068 307.507 0 238.933 0H68.267c-4.71 0-8.533 3.814-8.533 8.533v34.133c0 4.719 3.823 8.533 8.533 8.533h9.054L51.183 218.069c-5.043-2.935-10.812-4.736-17.05-4.736C15.309 213.333 0 228.642 0 247.467c0 11.648 5.879 21.922 14.805 28.083-8.999 11.637-14.805 23.14-14.805 36.077v33.382v102.4C0 481.374 30.626 512 68.267 512c25.199 0 47.206-13.764 59.025-34.133h69.837C201.097 497.314 218.334 512 238.933 512s37.837-14.686 41.805-34.133h8.798c19.149 0 34.731-15.582 34.731-34.731v-16.469h25.6v76.8c0 4.719 3.823 8.533 8.533 8.533h128c14.114 0 25.6-11.486 25.6-25.6s-11.486-25.6-25.6-25.6zM76.8 34.133V17.067h162.133c62.054 0 68.096 179.968 68.258 366.933h-17.058c-0.009-15.019-0.034-29.269-0.094-42.923-0.009-0.247 0.026-0.486 0-0.734-0.469-102.477-3.217-167.791-18.492-218.846-19.541-65.314-32.085-87.364-49.681-87.364h-100.19H87.296H76.8zM244.966 207.3c-3.337-3.337-8.73-3.337-12.066 0l-34.133 34.133c-3.337 3.337-3.337 8.73 0 12.066 1.664 1.664 3.849 2.5 6.033 2.5 2.185 0 4.369-0.836 6.033-2.5l8.96-8.96 47.522 88.26H204.8v-19.183c0-17.647-14.362-32.017-32.017-32.017h-6.596c-6.938 0-12.587-5.641-12.587-12.587v-32.196c0-17.647-14.362-32.017-32.017-32.017h-10.974l18.628-153.6h92.629c3.26 0 13.022 7.322 33.331 75.204 12.851 42.94 16.478 99.908 17.485 180.378l-40.294-74.837 12.578-12.578c3.337-3.337 3.337-8.73 0-12.066zM65.451 260.975c0.043-0.102 0.102-0.188 0.145-0.29 0.776-1.835 1.331-3.746 1.775-5.692 0.102-0.461 0.188-0.922 0.273-1.391 0.367-2.014 0.623-4.053 0.623-6.135 0-2.159-0.222-4.301-0.648-6.417-0.41-2.125-1.033-4.156-1.809-6.118L94.592 51.2h17.459L93.414 204.809c-0.606 0.034-1.135 0.273-1.698 0.427-0.435 0.111-0.896 0.145-1.306 0.324-0.589 0.265-1.058 0.674-1.57 1.058-0.35 0.265-0.759 0.452-1.075 0.777-0.469 0.486-0.785 1.092-1.135 1.681-0.196 0.341-0.486 0.623-0.64 0.99-0.418 1.007-0.657 2.108-0.657 3.268v51.2H63.684c0.674-2.406 1.246-3.6 1.767-4.812zM17.067 307.951c0-14.532 11.819-26.351 26.351-26.351H51.2h34.133v51.2H17.067V307.951zM17.067 349.867h76.8h102.4H272.7c0.188 10.931 0.316 22.289 0.35 34.133H101.24c-4.403-2.44-9.105-4.378-14.037-5.803-0.051-0.017-0.102-0.043-0.154-0.06v0.017c-0.333-0.094-0.674-0.171-1.007-0.256v-0.026c-0.375-0.102-0.777-0.179-1.161-0.273-1.877-0.469-3.772-0.862-5.692-1.178-0.256-0.043-0.469-0.085-0.734-0.128l-1.604-0.239h-0.094c-2.79-0.35-5.615-0.589-8.491-0.589s-5.7 0.239-8.482 0.589h-0.111l-2.014 0.299c-0.102 0.017-0.205 0.051-0.307 0.068-2.278 0.367-4.523 0.845-6.724 1.442-0.179 0.043-0.316 0.051-0.495 0.102-0.077 0.026-0.521 0.145-0.657 0.171-0.043 0.017-0.094 0.043-0.137 0.06-3.072 0.888-6.059 1.98-8.934 3.277-0.222 0.102-0.427 0.213-0.64 0.307-2.671 1.237-5.239 2.628-7.714 4.181-0.205 0.136-0.427 0.256-0.64 0.393-2.62 1.698-5.12 3.55-7.484 5.572-0.043 0.043-0.085 0.085-0.137 0.128-2.321 1.997-4.489 4.164-6.519 6.451-0.068 0.068-0.145 0.128-0.205 0.205V349.867zM307.2 418.133v25.003c0 9.737-7.927 17.664-17.664 17.664h-8.798v-0.026c-0.034-0.154-0.102-0.29-0.137-0.444-0.529-2.458-1.28-4.83-2.21-7.108-0.333-0.811-0.777-1.553-1.161-2.338-0.759-1.562-1.536-3.106-2.475-4.557-0.546-0.845-1.161-1.613-1.766-2.415-0.947-1.28-1.937-2.509-3.021-3.669-0.717-0.759-1.459-1.468-2.227-2.227z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Handling (T)</p>
            <p id="kpi-handling" className="text-3xl font-bold text-gray-900 dark:text-white">{kpis.handling}</p>
          </div>
        </div>
      </section>

      {/* Main Dashboard Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Scrap List */}
        <div className="w-full lg:w-1/3 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-300 dark:border-gray-700">
            <h2 id="scrap-list-title" className="text-lg font-semibold text-gray-900 dark:text-white">Scrap Details ({getPlantName(currentPlant)})</h2>
          </div>
          <div className="flex text-xs text-gray-600 dark:text-gray-400 font-medium px-4 py-2 bg-gray-200 dark:bg-gray-900">
            <div className="w-3/6">Scrap Name</div>
            <div className="w-2/6 text-right">Current Stock (T)</div>
            <div className="w-1/6 text-right">% Change</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {scrapList.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No data for this range.</div>
            ) : (
              scrapList.map(item => (
                <div
                  key={item.key}
                  className={`flex justify-between items-center p-4 cursor-pointer border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${item.isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  onClick={() => handleScrapSelect(item.key)}
                >
                  <div className="w-3/6 flex items-center gap-3">
                    <span className={`font-semibold text-sm ${item.isActive ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-gray-200'}`}>{item.key}</span>
                  </div>
                  <div className="w-2/6 text-right">
                    <div className={`font-bold text-sm ${item.isActive ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-gray-200'}`}>{formatNum(item.currentQty)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Unit (T)</div>
                  </div>
                  <div className={`w-1/6 text-right ${item.trend.css}`}>
                    <div className="font-medium text-sm">{item.trend.sign} {formatNum(Math.abs(item.percentChange))}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Chart and Details */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {/* Chart Container */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{selectedScrap} Stock Trend (T)</h2>
            <div className="h-[40vh] md:h-[50vh] relative">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>

          {/* Chart Summary Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg shadow-lg">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Current Stock (T)</h3>
              <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{chartSummary.current}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-lg shadow-lg">
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">Change (vs. First Point)</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-3xl font-bold ${chartSummary.css}`}>{chartSummary.change}</span>
                <span className={`text-lg font-medium ${chartSummary.css}`}>{chartSummary.percentChange}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Data Table */}
      <section className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Full Data ({getPlantName(currentPlant)})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200 dark:bg-gray-700">
              <tr>
                {currentHeaders.map((header, index) => (
                  <th
                    key={header}
                    className="sortable-th text-left text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider p-3"
                    onClick={() => {
                      const newDirection = tableSortConfig.key === header && tableSortConfig.direction === 'desc' ? 'asc' : 'desc';
                      setTableSortConfig({ key: header, direction: newDirection });
                    }}
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      paddingRight: '1.5rem'
                    }}
                  >
                    {header}
                    <span className="sort-icon" style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.8em',
                      opacity: tableSortConfig.key === header ? 1 : 0.4
                    }}>
                      {tableSortConfig.key === header && tableSortConfig.direction === 'asc' ? '▲' : tableSortConfig.key === header && tableSortConfig.direction === 'desc' ? '▼' : ''}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-gray-100 dark:bg-gray-800">
              {tableData.map((row, index) => (
                <tr key={index} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 border-t border-gray-300 dark:border-gray-700">
                  {currentHeaders.map(header => (
                    <td key={header} className="p-3 text-sm text-gray-900 dark:text-white">
                      {header === 'Date' ? row['Date'] || '-' :
                        row.hasOwnProperty(header) ? formatNum(row[header]) : 'N/A'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Home;
