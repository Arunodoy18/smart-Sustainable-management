/**
 * AuthHero Component
 * Displays the main headline for authentication pages
 * "MANAGEMENT OF WASTE, IN A SMART WAY"
 * Design: Professional, civic-tech, sustainability-focused
 */

'use client';

export default function AuthHero() {
  return (
    <div className="text-center mb-10 space-y-4">
      {/* Logo Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 mb-4 backdrop-blur-sm">
        <span className="text-5xl">♻️</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-4xl md:text-5xl font-light text-gray-100 tracking-tight leading-tight">
        MANAGEMENT OF WASTE,
        <br />
        IN A{' '}
        <span className="font-bold text-emerald-400">
          SMART
        </span>{' '}
        WAY
      </h1>

      {/* Subtitle */}
      <p className="text-gray-400 text-lg font-light max-w-md mx-auto">
        Civic technology for sustainable communities
      </p>

      <style jsx>{`
        @media (prefers-reduced-motion: no-preference) {
          h1 {
            animation: fade-in 0.8s ease-out;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
