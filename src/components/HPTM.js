import React from 'react';
import ScrapDashboard from './ScrapDashboard';

function HPTM() {
  const sheetUrls = {
    BOTH: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwLxX733uMa-xyLcQVOpfeY4-_kJEF1v11uBWE9o1wnHVOO8rstt_vmqQazFhwFscKAX52fSs5r5wG/pub?output=csv&gid=1642472432",
    RML1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwLxX733uMa-xyLcQVOpfeY4-_kJEF1v11uBWE9o1wnHVOO8rstt_vmqQazFhwFscKAX52fSs5r5wG/pub?output=csv&gid=1633556603",
    RML6: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwLxX733uMa-xyLcQVOpfeY4-_kJEF1v11uBWE9o1wnHVOO8rstt_vmqQazFhwFscKAX52fSs5r5wG/pub?output=csv&gid=508716621"
  };

  const title = 'HPTM Dashboard';

  const config = {
    headerMapping: {
      'Date': 'date',
      'Gross Prod (T)': 'prod',
      'Generation (T)': 'genT',
      'Generation (%)': 'genPct',
      'RML6 Crusher- CML (T)': 'rml6Cml',
      'RML6 Crusher- Non-CML (T)': 'rml6NonCml',
      'Dispatch to Client (T)': 'dispatchClient',
      'Stock (T)': 'stock'
    },
    transferFields: ['rml6Cml', 'rml6NonCml', 'dispatchClient'],
    showUsageChart: true,
    showDistributionChart: true
  };

  return <ScrapDashboard sheetUrls={sheetUrls} title={title} config={config} />;
}

export default HPTM;
