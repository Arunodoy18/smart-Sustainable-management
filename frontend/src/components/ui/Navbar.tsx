'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  Home, 
  Scan, 
  BarChart3, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Recycle
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/classify', label: 'Classify', icon: Scan },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const publicNavItems = [
  { href: '/', label: 'Home' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLandingPage = pathname === '/';
  const showFullNav = isAuthenticated && !isLandingPage;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-gray-950/80 backdrop-blur-xl border-b border-white/10 shadow-lg' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20"
              >
                <Recycle className="w-5 h-5 text-emerald-400" />
              </motion.div>
              <span className="text-xl font-bold text-white">
                Smart<span className="text-emerald-400">Waste</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {!isAuthenticated && (
                <>
                  {publicNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href}>
                        <span className={`text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-emerald-400'
                            : 'text-gray-400 hover:text-white'
                        }`}>
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </>
              )}
              
              {showFullNav && navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right Side - Auth */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-white leading-none">{user?.full_name || 'User'}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{user?.role}</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={logout}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                  </motion.button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-4">
                  <Link href="/auth?mode=login">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white border border-white/20 hover:border-white/40 rounded-full transition-all duration-200"
                    >
                      Login
                    </motion.button>
                  </Link>
                  <Link href="/auth?mode=signup">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-full transition-all duration-200 shadow-md shadow-emerald-500/20"
                    >
                      Sign Up
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 pt-20 bg-black/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col p-6 gap-2">
              {showFullNav && navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}

              {!isAuthenticated && (
                <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-white/10">
                  <Link href="/auth?mode=login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full py-3 text-center text-gray-300 hover:text-white transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/auth?mode=signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full btn-primary">Get Started</button>
                  </Link>
                </div>
              )}

              {isAuthenticated && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-4 mt-6 rounded-xl text-red-400 hover:bg-red-500/10 border-t border-white/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
