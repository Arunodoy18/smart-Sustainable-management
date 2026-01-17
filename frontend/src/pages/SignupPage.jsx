import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signup({
        email,
        password,
        full_name: fullName,
        role: role,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center px-4 animate-in fade-in duration-1000">
      <div className="max-w-md w-full card-premium p-10">
        <div>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-emerald-500/20 rounded-2xl shadow-inner">
              <span className="text-4xl">🌱</span>
            </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
            Join Smart Waste AI
          </h2>
          <p className="mt-3 text-center text-sm text-gray-400">
            Create your account to start recycling better
          </p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleSignup}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input
                type="text"
                required
                className="input-premium"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input
                type="email"
                required
                className="input-premium"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                className="input-premium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">I am a:</label>
              <select
                className="input-premium appearance-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user" className="bg-gray-800">Citizen (User)</option>
                <option value="driver" className="bg-gray-800">Collection Staff (Driver)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-900/20 border border-rose-800/50 rounded-xl animate-shake">
              <p className="text-rose-400 text-xs text-center font-medium">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-base tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Sign up'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-8 border-t border-gray-700/50 text-center">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-emerald-500 hover:text-emerald-400 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
