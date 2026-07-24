import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors shrink-0">
      <div className="px-6 h-full flex items-center justify-between">
        <Link to={user ? getDashboardPath() : "/"} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              Academic Project Management System
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Project Governance & Collaboration</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to={getProfilePath()}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                  title="Account & Security Settings"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-xs overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      {user.name}
                    </p>
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {user.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white px-3 py-1.5 rounded-lg transition-colors"
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
