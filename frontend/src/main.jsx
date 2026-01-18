import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'

console.log("%c♻️ SMART WASTE MANAGEMENT AI - FRONTEND STARTING", "color: #22c55e; font-weight: bold; font-size: 1.2rem;");
console.log("📍 API URL:", import.meta.env.VITE_API_URL || "Not set");
console.log("📍 API Base URL:", import.meta.env.VITE_API_BASE_URL || "Not set");
console.log("📍 Mode:", import.meta.env.MODE);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
