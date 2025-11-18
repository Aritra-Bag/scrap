import React from 'react';
import ScrapDashboard from './ScrapDashboard';

function Handling() {
  const sheetUrls = {
    BOTH: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwLxX733uMa-xyLcQVOpfeY4-_kJEF1v11uBWE9o1wnHVOO8rstt_vmqQazFhwFscKAX52fSs5r5wG/pub?output=csv&gid=1574805040",
    RML1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwLxX733uMa-xyLcQVOpfeY4-_kJEF1v11uBWE9o1wnHVOO8rstt_vmqQazFhwFscKAX52fSs5r5wG/pub?output=csv&gid=1966166421",
    RML6: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwLxX733uMa-xyLcQVOpfeY4-_kJEF1v11uBWE9o1wnHVOO8rstt_vmqQazFhwFscKAX52fSs5r5wG/pub?output=csv&gid=919561379"
  };

  const title = 'Handling Dashboard';

  const config = {
    headerMapping: {
      'Date': 'date',
      'Gross Prod (T)': 'prod',
      'Generation (T)': 'genT',
      'Generation (%)': 'genPct',
      'Dispatch to Client (T)': 'dispatchClient',
      'Stock (T)': 'stock'
    },
    transferFields: ['dispatchClient'],
    showUsageChart: false,
    showDistributionChart: false
  };

  return <ScrapDashboard sheetUrls={sheetUrls} title={title} config={config} />;
}

export default Handling;
