import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, User, Sun, Moon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { NotificationDrawer } from './NotificationDrawer';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dark/Light Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'Student') return '/student/dashboard';
    if (user.role === 'Teacher') return '/teacher/dashboard';
    return '/admin/dashboard';
  };

  const getProfilePath = () => {
    if (!user) return '/login';
    if (user.role === 'Student') return '/student/profile';
    if (user.role === 'Teacher') return '/teacher/profile';
    return '/admin/profile';
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
      <div className="px-6 py-3 flex items-center justify-between">
        <Link to={user ? getDashboardPath() : "/"} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-900/30">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
              Academic Workflow Platform
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">FYP Project Governance & Tracking</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Dark/Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell Component */}
              <NotificationDrawer />

              {/* Profile badge with Settings Link */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to={getProfilePath()}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                  title="Account & Security Settings"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      {user.name} <User className="w-3 h-3 text-slate-400" />
                    </p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
