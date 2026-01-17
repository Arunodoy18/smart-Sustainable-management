import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, googleAuthAPI } from '../api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
          setProfile(userData);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { access_token } = await authAPI.login(email, password);
      localStorage.setItem('token', access_token);
      const userData = await authAPI.getMe();
      setUser(userData);
      setProfile(userData);
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (googleToken, role = 'user') => {
    try {
      const { access_token } = await googleAuthAPI.login(googleToken, role);
      localStorage.setItem('token', access_token);
      const userData = await authAPI.getMe();
      setUser(userData);
      setProfile(userData);
      return userData;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const user = await authAPI.signup(userData);
      await login(userData.email, userData.password);
      return user;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    login,
    loginWithGoogle,
    signup,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
