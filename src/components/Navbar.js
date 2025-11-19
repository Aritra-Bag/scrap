import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeContext } from '../App';

function Navbar() {
  const [isCastingOpen, setIsCastingOpen] = useState(false);
  const location = useLocation();
  const { toggleTheme, isDarkMode } = useContext(ThemeContext);

  const handleCastingMouseEnter = () => {
    setIsCastingOpen(true);
  };

  const handleCastingMouseLeave = () => {
    setIsCastingOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-gray-900 dark:text-white text-xl font-bold">Scrap Dashboard</h1>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/') ? 'border-indigo-500 text-gray-900 dark:text-gray-100' : 'border-transparent text-gray-500 hover:border-indigo-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                Home
              </Link>
              <div
                className="relative flex items-center"
                onMouseEnter={handleCastingMouseEnter}
                onMouseLeave={handleCastingMouseLeave}
              >
                <button
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith('/casting') ? 'border-indigo-500 text-gray-900 dark:text-gray-100' : 'border-transparent text-gray-500 hover:border-indigo-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  Casting
                  <svg className="ml-2 h-5 w-5 text-gray-500 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {isCastingOpen && (
                  <div className="absolute z-10 top-full left-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg">
                    <div className="py-1">
                      <Link
                        to="/casting/as-cast"
                        className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${isActive('/casting/as-cast') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : ''}`}
                      >
                        As Cast
                      </Link>
                      <Link
                        to="/casting/runner-scrap"
                        className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${isActive('/casting/runner-scrap') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : ''}`}
                      >
                        Runner Scrap
                      </Link>
                      <Link
                        to="/casting/slag"
                        className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${isActive('/casting/slag') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : ''}`}
                      >
                        Slag
                      </Link>
                      <Link
                        to="/casting/high-metal-bolder"
                        className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${isActive('/casting/high-metal-bolder') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : ''}`}
                      >
                        High Metal Bolder
                      </Link>
                      <Link
                        to="/casting/high-metal-dust"
                        className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${isActive('/casting/high-metal-dust') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : ''}`}
                      >
                        High Metal Dust
                      </Link>
                      <Link
                        to="/casting/low-metal-slag"
                        className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${isActive('/casting/low-metal-slag') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : ''}`}
                      >
                        Low Metal Slag
                      </Link>
                      <Link
                        to="/casting/refractory-slag"
                        className={`block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 ${isActive('/casting/refractory-slag') ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : ''}`}
                      >
                        Refractory Slag
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Link
                to="/hptm"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/hptm') ? 'border-indigo-500 text-gray-900 dark:text-gray-100' : 'border-transparent text-gray-500 hover:border-indigo-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                HPTM
              </Link>
              <Link
                to="/cml"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/cml') ? 'border-indigo-500 text-gray-900 dark:text-gray-100' : 'border-transparent text-gray-500 hover:border-indigo-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                CML
              </Link>
              <Link
                to="/handling"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/handling') ? 'border-indigo-500 text-gray-900 dark:text-gray-100' : 'border-transparent text-gray-500 hover:border-indigo-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                }`}
              >
                Handling
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              aria-label={`Toggle to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
