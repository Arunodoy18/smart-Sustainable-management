import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DriverPage from './pages/DriverPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

function Navigation() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  
  const navItems = [
    { path: '/', name: 'Capture', icon: '📸' },
    { path: '/history', name: 'History', icon: '📋' },
    { path: '/analytics', name: 'Analytics', icon: '📊' },
  ];

  if (profile?.role === 'driver' || profile?.role === 'admin') {
    navItems.push({ path: '/driver', name: 'Driver Portal', icon: '🚛' });
  }
  
  return (
    <nav className="bg-gray-800 border-b border-gray-700 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl">♻️</span>
            <span className="ml-3 text-xl font-bold text-white hidden sm:block">
              Smart Waste AI
            </span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all
                  ${location.pathname === item.path
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                  }`}
              >
                <span className="mr-1 sm:mr-2">{item.icon}</span>
                <span className="hidden xs:block">{item.name}</span>
              </Link>
            ))}
            <button
              onClick={signOut}
              className="px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:bg-gray-700 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            <Route path="*" element={
              <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                  <Navigation />
                  <main className="flex-grow max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 lg:px-8">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/history" element={<HistoryPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/driver" element={
                        <ProtectedRoute requiredRole="driver">
                          <DriverPage />
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </main>
                  <footer className="bg-gray-800 border-t border-gray-700 py-6 text-center text-gray-400">
                    <p className="text-sm">🌍 Smart Waste Management AI System | Hackathon 2026</p>
                  </footer>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
