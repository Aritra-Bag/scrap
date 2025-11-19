import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Casting from './components/Casting';
import HPTM from './components/HPTM';
import CML from './components/CML';
import Handling from './components/Handling';

// Create theme context
export const ThemeContext = createContext();

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <Router basename="/scrap">
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
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
    </ThemeContext.Provider>
  );
}

export default App;
