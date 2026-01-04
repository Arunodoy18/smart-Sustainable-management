import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DriverPage from './pages/DriverPage';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', name: 'Upload Waste', icon: '📸' },
    { path: '/history', name: 'History', icon: '📋' },
    { path: '/analytics', name: 'Analytics', icon: '📊' },
    { path: '/driver', name: 'Driver', icon: '🚛' }
  ];
  
  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl">♻️</span>
            <span className="ml-3 text-xl font-bold text-green-600">
              Smart Waste Management AI
            </span>
          </div>
          <div className="flex space-x-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${location.pathname === item.path
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/driver" element={<DriverPage />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-gray-600">
            <p className="text-sm">
              🌍 Smart Waste Management AI System | Confidence-Aware Recommendations | SDG-Aligned
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Hackathon 2026 | Reducing recycling contamination through AI intelligence
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
