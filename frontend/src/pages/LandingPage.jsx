import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const PARTICLE_COUNT = 50;
const WASTE_ICONS = ['🍃', '♻️', '🌍', '🌱', '💚', '🗑️', '📦', '🥤', '📰', '🔋'];

function WasteParticle({ style, icon }) {
  return (
    <div
      className="absolute text-2xl opacity-60 animate-float pointer-events-none"
      style={style}
    >
      {icon}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const particlesRef = useRef([]);

  useEffect(() => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      icon: WASTE_ICONS[Math.floor(Math.random() * WASTE_ICONS.length)],
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${8 + Math.random() * 12}s`,
        fontSize: `${1 + Math.random() * 1.5}rem`,
      },
    }));
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 relative overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-30px) rotate(5deg);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-60px) rotate(-5deg);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-30px) rotate(3deg);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.6), 0 0 80px rgba(16, 185, 129, 0.3);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>

      {particlesRef.current.map((particle) => (
        <WasteParticle key={particle.id} style={particle.style} icon={particle.icon} />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8 animate-bounce-slow">
            <div className="relative inline-block">
              <div className="w-40 h-40 mx-auto bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-emerald-500/20">
                <div className="relative">
                  <span className="text-7xl">🗑️</span>
                  <div className="absolute -top-4 -right-4 text-4xl animate-bounce">
                    ✨
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <svg width="120" height="60" viewBox="0 0 120 60" className="opacity-50">
                  <path
                    d="M60 0 C60 0 30 10 30 30 C30 50 60 60 60 60"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="0;10"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </path>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="absolute top-1/2 -left-16 transform -translate-y-1/2 text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>
                👤
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
            Smart Waste <span className="text-emerald-400">AI</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            Revolutionizing waste management with artificial intelligence
          </p>

          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Upload photos of your waste, get instant AI-powered classification,
            and help build a sustainable future. Join thousands making smarter
            disposal decisions every day.
          </p>

          <button
            onClick={handleGetStarted}
            className="group relative inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 animate-pulse-glow"
          >
            <span className="relative z-10 flex items-center">
              Get Started
              <svg
                className="ml-3 w-6 h-6 transform group-hover:translate-x-2 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl mb-2">📸</div>
              <p className="text-sm text-gray-400">Snap a photo</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-sm text-gray-400">AI classifies</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">♻️</div>
              <p className="text-sm text-gray-400">Recycle right</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-8 text-gray-500 text-sm">
          <span className="flex items-center">
            <span className="mr-2">🏙️</span> SDG 11
          </span>
          <span className="flex items-center">
            <span className="mr-2">📦</span> SDG 12
          </span>
          <span className="flex items-center">
            <span className="mr-2">🌡️</span> SDG 13
          </span>
        </div>
      </div>
    </div>
  );
}
