import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const [isCastingOpen, setIsCastingOpen] = useState(false);
  const location = useLocation();

  const handleCastingMouseEnter = () => {
    setIsCastingOpen(true);
  };

  const handleCastingMouseLeave = () => {
    setIsCastingOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-800 bg-opacity-90 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-white text-xl font-bold">Scrap Dashboard</h1>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/') ? 'border-indigo-500 text-gray-100' : 'border-transparent text-gray-300 hover:border-indigo-400 hover:text-white'
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
                    location.pathname.startsWith('/casting') ? 'border-indigo-500 text-gray-100' : 'border-transparent text-gray-300 hover:border-indigo-400 hover:text-white'
                  }`}
                >
                  Casting
                  <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {isCastingOpen && (
                  <div className="absolute z-10 top-full left-0 w-48 bg-gray-800 border-t border-gray-600 shadow-lg">
                    <div className="py-1">
                      <Link
                        to="/casting/as-cast"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${isActive('/casting/as-cast') ? 'bg-gray-700 text-white' : ''}`}
                      >
                        As Cast
                      </Link>
                      <Link
                        to="/casting/runner-scrap"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${isActive('/casting/runner-scrap') ? 'bg-gray-700 text-white' : ''}`}
                      >
                        Runner Scrap
                      </Link>
                      <Link
                        to="/casting/slag"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${isActive('/casting/slag') ? 'bg-gray-700 text-white' : ''}`}
                      >
                        Slag
                      </Link>
                      <Link
                        to="/casting/high-metal-bolder"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${isActive('/casting/high-metal-bolder') ? 'bg-gray-700 text-white' : ''}`}
                      >
                        High Metal Bolder
                      </Link>
                      <Link
                        to="/casting/high-metal-dust"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${isActive('/casting/high-metal-dust') ? 'bg-gray-700 text-white' : ''}`}
                      >
                        High Metal Dust
                      </Link>
                      <Link
                        to="/casting/low-metal-slag"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${isActive('/casting/low-metal-slag') ? 'bg-gray-700 text-white' : ''}`}
                      >
                        Low Metal Slag
                      </Link>
                      <Link
                        to="/casting/refractory-slag"
                        className={`block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 ${isActive('/casting/refractory-slag') ? 'bg-gray-700 text-white' : ''}`}
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
                  isActive('/hptm') ? 'border-indigo-500 text-gray-100' : 'border-transparent text-gray-300 hover:border-indigo-400 hover:text-white'
                }`}
              >
                HPTM
              </Link>
              <Link
                to="/cml"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/cml') ? 'border-indigo-500 text-gray-100' : 'border-transparent text-gray-300 hover:border-indigo-400 hover:text-white'
                }`}
              >
                CML
              </Link>
              <Link
                to="/handling"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/handling') ? 'border-indigo-500 text-gray-100' : 'border-transparent text-gray-300 hover:border-indigo-400 hover:text-white'
                }`}
              >
                Handling
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
