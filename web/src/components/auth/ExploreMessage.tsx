/**
 * ExploreMessage Component
 * Interactive educational panel explaining the importance of smart waste management
 * Opens on "Explore" button click - no navigation, stays on auth page
 * Design: Calm, informative, civic-focused
 */

'use client';

import { X } from 'lucide-react';

interface ExploreMessageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExploreMessage({ isOpen, onClose }: ExploreMessageProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Message Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-emerald-600/20 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-slide-up">
          {/* Header */}
          <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 p-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-light text-gray-100">
                Why <span className="font-semibold text-emerald-400">Smart</span> Waste Management?
              </h2>
              <p className="text-gray-400 text-sm mt-1">Understanding our collective responsibility</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-100 transition-colors p-2 hover:bg-neutral-800 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Section 1 */}
            <div className="group hover:bg-neutral-800/30 p-5 rounded-xl transition-all duration-300 border border-transparent hover:border-emerald-600/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600/10 flex items-center justify-center text-2xl border border-emerald-600/20">
                  🌍
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-100 mb-2">The Problem We Face</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Every year, cities generate millions of tons of waste. When improperly sorted, 
                    recyclable materials end up in landfills, and contamination ruins entire batches 
                    of recycling. This isn&apos;t just an environmental issue—it&apos;s a resource loss that 
                    affects our communities and future generations.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="group hover:bg-neutral-800/30 p-5 rounded-xl transition-all duration-300 border border-transparent hover:border-teal-600/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-600/10 flex items-center justify-center text-2xl border border-teal-600/20">
                  ♻️
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-100 mb-2">Smart Segregation</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Proper segregation at the source is the foundation of effective waste management. 
                    By using AI-powered classification, we help citizens identify waste types accurately. 
                    This reduces contamination rates from 30% to under 5%, making recycling programs 
                    economically viable and environmentally effective.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="group hover:bg-neutral-800/30 p-5 rounded-xl transition-all duration-300 border border-transparent hover:border-emerald-600/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600/10 flex items-center justify-center text-2xl border border-emerald-600/20">
                  🤝
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-100 mb-2">Citizens + Technology = Impact</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Technology alone isn&apos;t the answer. Smart waste management works when citizens, 
                    collectors, and systems work together. This platform connects all stakeholders—giving 
                    real-time feedback, tracking progress, and building habits that create lasting change.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="group hover:bg-neutral-800/30 p-5 rounded-xl transition-all duration-300 border border-transparent hover:border-emerald-600/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-600/10 flex items-center justify-center text-2xl border border-emerald-600/20">
                  📊
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-100 mb-2">Data-Driven Decisions</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Every submission, every collection, and every classification generates data. 
                    Municipal planners use these insights to optimize routes, predict waste volumes, 
                    and allocate resources efficiently. The result? Lower costs, reduced emissions, 
                    and cleaner cities.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border border-emerald-600/20 rounded-xl p-6 mt-8">
              <h3 className="text-lg font-medium text-gray-100 mb-2">Join the Movement</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Every properly sorted item matters. Every citizen who participates makes a difference. 
                This is civic technology built by the community, for the community.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
