import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { BookOpen, ShieldCheck, Cpu, GitPullRequest, Award, ArrowRight, LayoutDashboard, CheckCircle2, MessageSquare, Video, ShieldAlert, Sparkles } from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'Student') return '/student/dashboard';
    if (user.role === 'Teacher') return '/teacher/dashboard';
    return '/admin/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between transition-colors selection:bg-indigo-500 selection:text-white">
      <div>
        {/* Top Professional Header */}
        <header className="px-6 sm:px-10 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white font-black shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
                Academic Workflow Platform
              </span>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Enterprise Project Management & Governance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Dark Mode Toggle */}
            <ThemeToggle />

            {user ? (
              <Link
                to={getDashboardPath()}
                className="text-xs font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-2 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="text-xs font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 hidden sm:inline-flex"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Enterprise-Grade Academic Project Governance & Governance
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none max-w-4xl mx-auto">
            Streamline Final Year Projects with Academic Rigor & Governance
          </h1>

          <p className="mt-6 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            A unified management portal connecting students, faculty supervisors, and department administrators. Seamlessly handle proposal submissions, supervisor allocations, real-time messaging, WebRTC video calls, and milestone tracking.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs sm:text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
              >
                Access Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs sm:text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
              >
                Sign In to Portal <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900">
                <GitPullRequest className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Supervision Allocation Control</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Enforces strict faculty capacity limits with concurrency safeguards, structured application requests, and transparent status tracking.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4 border border-violet-100 dark:border-violet-900">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Real-Time Messaging & WebRTC Calls</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Integrated peer & supervisor chat with instant Socket.io delivery, automatic call log history stream, and HD video calls.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Milestone & Document Management</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                End-to-end proposal review workflow, document uploads, milestone evaluation, and administrative oversight.
              </p>
            </div>
          </div>
        </main>
      </div>

      <footer className="px-6 sm:px-10 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
        Academic Project Workflow & Governance System &bull; Enterprise Portal
      </footer>
    </div>
  );
};
