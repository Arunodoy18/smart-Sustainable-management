'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import { 
  Camera, 
  History, 
  BarChart3, 
  User, 
  Truck, 
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: <Home size={20} />, roles: ['user', 'driver', 'admin'] },
  { href: '/capture', label: 'Capture', icon: <Camera size={20} />, roles: ['user'] },
  { href: '/history', label: 'History', icon: <History size={20} />, roles: ['user'] },
  { href: '/driver', label: 'Pickups', icon: <Truck size={20} />, roles: ['driver'] },
  { href: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} />, roles: ['admin', 'user'] },
  { href: '/profile', label: 'Profile', icon: <User size={20} />, roles: ['user', 'driver', 'admin'] },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const filteredItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-background-secondary border-r border-surface-hover flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-surface-hover">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-eco-500 flex items-center justify-center">
              <span className="text-xl">♻️</span>
            </div>
            <div>
              <h1 className="font-semibold text-white">Smart Waste</h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-eco-500/20 text-eco-400'
                    : 'text-gray-400 hover:text-white hover:bg-surface'
                )}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-surface-hover">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-eco-500/20 flex items-center justify-center">
                <span className="text-eco-400 font-medium">
                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-surface-hover z-40 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {filteredItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] transition-colors',
                  isActive ? 'text-eco-400' : 'text-gray-500'
                )}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-background-secondary border-b border-surface-hover z-40 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl">♻️</span>
            <span className="font-semibold text-white">Smart Waste</span>
          </Link>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm pt-16">
          <div className="p-4 space-y-2">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center space-x-3 px-4 py-4 rounded-xl',
                  pathname === item.href
                    ? 'bg-eco-500/20 text-eco-400'
                    : 'text-gray-300'
                )}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 px-4 py-4 rounded-xl text-red-400 w-full"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
