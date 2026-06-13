import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  BookOpen, Home, Layers, Archive, MessageSquare, BarChart2,
  ListChecks, Pencil, ClipboardList, Menu, X, LogIn, LogOut, User, ChevronDown
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'সংবাদ', icon: Home },
  { to: '/syllabus', label: 'সিলেবাস', icon: ListChecks },
  { to: '/archive', label: 'আর্কাইভ', icon: Archive },
  { to: '/flashcards', label: 'ফ্ল্যাশকার্ড', icon: Layers },
  { to: '/practice', label: 'অনুশীলন', icon: Pencil },
  { to: '/mock-tests', label: 'মডেল টেস্ট', icon: ClipboardList },
  { to: '/tutor', label: 'AI টিউটর', icon: MessageSquare },
  { to: '/dashboard', label: 'ড্যাশবোর্ড', icon: BarChart2 },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors font-bengali ${
    isActive
      ? 'bg-white/20 text-white'
      : 'text-white/75 hover:text-white hover:bg-white/10'
  }`;

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('লগআউট সফল হয়েছে।');
    navigate('/');
    setUserMenuOpen(false);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ব্যবহারকারী';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e3a5f] shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none font-bengali block">শব্দকোষ নিউজ</span>
              <span className="text-white/50 text-xs leading-none">BCS প্রস্তুতি</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Auth */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-white text-sm font-bengali">
                  <div className="w-7 h-7 rounded-full bg-[#2d6a4f] flex items-center justify-center text-xs font-bold uppercase">
                    {displayName[0]}
                  </div>
                  <span className="hidden sm:block max-w-[100px] truncate">{displayName}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 font-bengali truncate">{displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-bengali">
                        <BarChart2 className="w-4 h-4 text-gray-400" /> ড্যাশবোর্ড
                      </Link>
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bengali">
                        <LogOut className="w-4 h-4" /> লগআউট
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/80 hover:text-white font-bengali transition">
                  <LogIn className="w-4 h-4" /> লগইন
                </Link>
                <Link to="/signup"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2d6a4f] hover:bg-[#245a42] text-white text-sm font-semibold rounded-xl transition font-bengali">
                  <User className="w-4 h-4" /> রেজিস্ট্রেশন
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#163050] border-t border-white/10">
          <nav className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-1">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors font-bengali ${
                    isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
                end={item.to === '/'}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
