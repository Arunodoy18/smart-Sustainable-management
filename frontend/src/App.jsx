import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DriverPage from './pages/DriverPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { useEffect } from 'react';
import { wasteAPI } from './api';

function Navigation() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  if (!user) return null;
  
  const navItems = [
    { path: '/', name: 'Upload', icon: '📸', roles: ['user', 'driver', 'admin'] },
    { path: '/history', name: 'History', icon: '📋', roles: ['user', 'driver', 'admin'] },
    { path: '/analytics', name: 'Analytics', icon: '📊', roles: ['user', 'driver', 'admin'] },
    { path: '/driver', name: 'Driver Portal', icon: '🚛', roles: ['driver', 'admin'] }
  ];
  
  return (
    <nav className="bg-gray-800 shadow-lg border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl mr-2">♻️</span>
            <span className="text-xl font-extrabold text-white hidden md:block">
              Smart Waste <span className="text-green-500">AI</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            {navItems.filter(item => !item.roles || item.roles.includes(profile?.role)).map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all
                  ${location.pathname === item.path
                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/20'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
              >
                <span className="md:mr-2">{item.icon}</span>
                <span className="hidden md:block">{item.name}</span>
              </Link>
            ))}
            
            <button
              onClick={handleLogout}
              className="ml-4 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-red-900/30 rounded-md transition-colors border border-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const { user, profile } = useAuth();

  useEffect(() => {
    let socket;
    if (user) {
      const token = localStorage.getItem('token');
      const wsUrl = wasteAPI.getWsUrl(token);
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'new_pickup' && profile?.role === 'driver') {
          alert('New pickup available at ' + data.data.location?.address);
        } else if (data.event === 'status_update') {
          alert('Your pickup status updated to: ' + data.data.status);
        }
      };

      socket.onerror = (error) => console.error('WebSocket Error:', error);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [user, profile]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
        <Navigation />
        
        <main className="flex-grow max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } />
            <Route path="/driver" element={
              <ProtectedRoute requiredRole="driver">
                <DriverPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        
        <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-gray-400">
              🌍 Smart Waste Management AI | Reducing Contamination with Intelligence
            </p>
            <div className="flex justify-center space-x-6 mt-4">
              <span className="text-xs text-gray-500">SDG 11: Sustainable Cities</span>
              <span className="text-xs text-gray-500">SDG 12: Responsible Production</span>
              <span className="text-xs text-gray-500">SDG 13: Climate Action</span>
            </div>
            <p className="text-xs mt-6 text-gray-600 font-mono uppercase tracking-widest">
              Hackathon 2026 Edition
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
