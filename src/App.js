import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Casting from './components/Casting';
import HPTM from './components/HPTM';
import CML from './components/CML';
import Handling from './components/Handling';

function App() {
  return (
    <Router basename="/scrap">
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/casting/:type" element={<Casting />} />
          <Route path="/hptm" element={<HPTM />} />
          <Route path="/cml" element={<CML />} />
          <Route path="/handling" element={<Handling />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
