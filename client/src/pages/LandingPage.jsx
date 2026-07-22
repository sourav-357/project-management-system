import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ShieldCheck, Cpu, GitPullRequest, Award, ArrowRight, LayoutDashboard } from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'Student') return '/student/dashboard';
    if (user.role === 'Teacher') return '/teacher/dashboard';
    return '/admin/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between transition-colors">
      <div>
        {/* Top Navbar */}
        <header className="px-8 py-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-950">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100">Academic Workflow Platform</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="text-xs font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950 hover:shadow-lg flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 px-4 py-2 transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="text-xs font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950 hover:shadow-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-6xl mx-auto px-8 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-8">
            <ShieldCheck className="w-4 h-4" /> Production-Grade Role-Based Governance
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight max-w-4xl mx-auto">
            Streamline Final Year Projects with Rigorous Workflow Governance
          </h1>

          <p className="mt-6 text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An end-to-end platform for students to draft proposals and request supervisors; teachers to review deliverables and approve milestones; and administrators to oversee project progress.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950 hover:shadow-xl hover:-translate-y-0.5"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-950 hover:shadow-xl hover:-translate-y-0.5"
                >
                  Sign In to Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <GitPullRequest className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Concurrency-Safe Supervisor Requests</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Supervision limits are protected against race conditions using atomic MongoDB conditions, ensuring supervisors never exceed capacity.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Refresh Token Rotation & Security</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Short-lived JWT Access Tokens in memory paired with HttpOnly refresh cookies and active session revocation per device.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Milestone Governance & Progress</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Track proposal draft status, review feedback timeline, milestone approvals, and administrative project progress.
              </p>
            </div>
          </div>
        </main>
      </div>

      <footer className="px-8 py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        Academic Project Workflow Management Platform &bull; Built with React, Express, MongoDB & Tailwind CSS
      </footer>
    </div>
  );
};
