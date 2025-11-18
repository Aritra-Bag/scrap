import React from 'react';
import { useParams } from 'react-router-dom';
import ScrapDashboard from './ScrapDashboard';

function Casting() {
  const { type } = useParams();

  const getSheetUrls = (type) => {
    const baseUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSwLxX733uMa-xyLcQVOpfeY4-_kJEF1v11uBWE9o1wnHVOO8rstt_vmqQazFhwFscKAX52fSs5r5wG/pub?output=csv";

    switch (type) {
      case 'as-cast':
        return {
          BOTH: `${baseUrl}&gid=1268917494`,
          RML1: `${baseUrl}&gid=420273334`,
          RML6: `${baseUrl}&gid=1631982494`
        };
      case 'runner-scrap':
        return {
          BOTH: `${baseUrl}&gid=2009208040`,
          RML1: `${baseUrl}&gid=1348258362`,
          RML6: `${baseUrl}&gid=2045435997`
        };
      case 'slag':
        return {
          BOTH: `${baseUrl}&gid=1134057696`,
          RML1: `${baseUrl}&gid=1344889227`,
          RML6: `${baseUrl}&gid=2017990699`
        };
      case 'high-metal-bolder':
        return {
          BOTH: `${baseUrl}&gid=994191442`,
          RML1: `${baseUrl}&gid=110075041`,
          RML6: `${baseUrl}&gid=1040215886`
        };
      case 'high-metal-dust':
        return {
          BOTH: `${baseUrl}&gid=1923724227`,
          RML1: `${baseUrl}&gid=637057484`,
          RML6: `${baseUrl}&gid=1304643086`
        };
      case 'low-metal-slag':
        return {
          BOTH: `${baseUrl}&gid=156130401`,
          RML1: `${baseUrl}&gid=231606922`,
          RML6: `${baseUrl}&gid=808964787`
        };
      case 'refractory-slag':
        return {
          BOTH: `${baseUrl}&gid=1987386932`,
          RML1: `${baseUrl}&gid=1837481353`,
          RML6: `${baseUrl}&gid=1726494704`
        };
      default:
        return {
          BOTH: `${baseUrl}&gid=1268917494`,
          RML1: `${baseUrl}&gid=420273334`,
          RML6: `${baseUrl}&gid=1631982494`
        };
    }
  };

  const getTitle = (type) => {
    switch (type) {
      case 'as-cast':
        return 'As Cast Scrap Dashboard';
      case 'runner-scrap':
        return 'Runner Scrap Dashboard';
      case 'slag':
        return 'Slag Dashboard';
      case 'high-metal-bolder':
        return 'High Metal Bolder Dashboard';
      case 'high-metal-dust':
        return 'High Metal Dust Dashboard';
      case 'low-metal-slag':
        return 'Low Metal Slag Dashboard';
      case 'refractory-slag':
        return 'Refractory Slag Dashboard';
      default:
        return 'Casting Dashboard';
    }
  };

  const sheetUrls = getSheetUrls(type);
  const title = getTitle(type);
  const config = {
    headerMapping: {
      'Date': 'date',
      'Gross Prod (T)': 'prod',
      'Generation (T)': 'genT',
      'Generation (%)': 'genPct',
      'Transfer to Induction Furnace (T)': 'transferIF',
      'Transfer to SMS (T)': 'transferSMS',
      'Dispatch to Client (T)': 'dispatchClient',
      'Stock (T)': 'stock'
    },
    transferFields: ['transferIF', 'transferSMS', 'dispatchClient'],
    showUsageChart: true,
    showDistributionChart: true
  };

  return <ScrapDashboard sheetUrls={sheetUrls} title={title} config={config} />;
}

export default Casting;
