/**
 * AnimatedBackground Component
 * Lightweight CSS-based animated background for authentication pages
 * Theme: Sustainability, recycling, civic-tech
 * Performance: Uses CSS transforms and respects reduced-motion preferences
 */

'use client';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Subtle gradient waves */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900" />
      
      {/* Floating recycle particles - Calm and minimal */}
      <div className="floating-particles">
        {/* Large ambient circles - representing communities */}
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        
        {/* Subtle recycle icons */}
        <div className="recycle-icon icon-1">♻</div>
        <div className="recycle-icon icon-2">♻</div>
        <div className="recycle-icon icon-3">♻</div>
      </div>

      {/* Gradient overlays - sustainability colors */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/5 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl animate-float-slower" />
      
      <style jsx>{`
        /* Calm floating animation - respects prefers-reduced-motion */
        @keyframes float-gentle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          33% {
            transform: translate(30px, -40px) scale(1.05);
            opacity: 0.5;
          }
          66% {
            transform: translate(-30px, 20px) scale(0.95);
            opacity: 0.35;
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(20px, -20px);
          }
        }

        @keyframes float-slower {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-20px, 20px);
          }
        }

        @keyframes rotate-gentle {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .floating-particles {
          position: absolute;
          inset: 0;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(
            circle at center,
            rgba(16, 185, 129, 0.08) 0%,
            rgba(16, 185, 129, 0) 70%
          );
        }

        .particle-1 {
          width: 400px;
          height: 400px;
          top: 10%;
          left: 15%;
          animation: float-gentle 25s ease-in-out infinite;
        }

        .particle-2 {
          width: 350px;
          height: 350px;
          bottom: 15%;
          right: 20%;
          animation: float-gentle 30s ease-in-out infinite 5s;
        }

        .particle-3 {
          width: 300px;
          height: 300px;
          top: 50%;
          left: 50%;
          animation: float-gentle 35s ease-in-out infinite 10s;
        }

        .recycle-icon {
          position: absolute;
          font-size: 1.5rem;
          color: rgba(16, 185, 129, 0.15);
          animation: float-gentle 40s ease-in-out infinite;
        }

        .icon-1 {
          top: 20%;
          left: 70%;
          animation-delay: 0s;
        }

        .icon-2 {
          bottom: 30%;
          left: 25%;
          animation-delay: 15s;
        }

        .icon-3 {
          top: 60%;
          right: 30%;
          animation-delay: 25s;
        }

        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 25s ease-in-out infinite;
        }

        /* Respect user motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .particle,
          .recycle-icon,
          .animate-float-slow,
          .animate-float-slower {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
