import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DriverPage from './pages/DriverPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import { useEffect, Suspense } from 'react';
import { wasteAPI } from './api';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

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
      <nav className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5 shadow-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center group cursor-pointer" onClick={() => navigate('/')}>
              <div className="p-2.5 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <span className="text-2xl">♻️</span>
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-xl font-black text-white leading-none tracking-tight">
                  SMART WASTE <span className="text-emerald-500">AI</span>
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-0.5">Eco-System Intelligence</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="hidden lg:flex items-center space-x-1 mr-4 pr-4 border-r border-gray-800">
                {navItems.filter(item => !item.roles || item.roles.includes(profile?.role)).map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 flex items-center
                      ${location.pathname === item.path
                        ? 'bg-emerald-600/10 text-emerald-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                  >
                    <span className="mr-2 opacity-80">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="lg:hidden flex items-center space-x-1">
                 {navItems.filter(item => !item.roles || item.roles.includes(profile?.role)).map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`p-2.5 rounded-xl transition-all duration-300
                      ${location.pathname === item.path
                        ? 'bg-emerald-600/20 text-emerald-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                  </Link>
                ))}
              </div>
              
              <div className="flex items-center ml-2 pl-2">
                <div className="hidden sm:flex flex-col items-end mr-4">
                  <span className="text-xs font-bold text-white leading-none">{profile?.full_name || 'Eco User'}</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">{profile?.role || 'Contributor'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-400/20"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
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
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/welcome" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
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
            </Suspense>
          </ErrorBoundary>
        </main>
        
          <footer className="bg-gray-950 border-t border-white/5 mt-auto py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-12 items-center text-center md:text-left">
                <div className="space-y-4">
                  <div className="flex items-center justify-center md:justify-start">
                    <span className="text-2xl mr-3">♻️</span>
                    <span className="text-lg font-black text-white tracking-tight">SMART WASTE <span className="text-emerald-500">AI</span></span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto md:mx-0">
                    Revolutionizing waste management through computer vision and environmental intelligence.
                  </p>
                </div>
                
                <div className="flex justify-center space-x-8">
                  <div className="text-center group cursor-help">
                    <p className="text-2xl mb-1 group-hover:scale-110 transition-transform">🏙️</p>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">SDG 11</p>
                  </div>
                  <div className="text-center group cursor-help">
                    <p className="text-2xl mb-1 group-hover:scale-110 transition-transform">📦</p>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">SDG 12</p>
                  </div>
                  <div className="text-center group cursor-help">
                    <p className="text-2xl mb-1 group-hover:scale-110 transition-transform">🌡️</p>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">SDG 13</p>
                  </div>
                </div>
                
                <div className="text-center md:text-right space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Local Dev Environment</p>
                  <p className="text-[10px] text-emerald-500/50 font-mono italic">v2.1.0-orchid-stable</p>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <p className="text-xs text-gray-600 font-medium">
                  © 2026 Smart Waste Management AI. All rights reserved.
                </p>
                <div className="flex space-x-6">
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Privacy</span>
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Terms</span>
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Support</span>
                </div>
              </div>
            </div>
          </footer>

      </div>
    </Router>
  );
}

export default App;
