import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ShieldCheck, GitPullRequest, MessageSquare, ArrowRight, LayoutDashboard, FileText, Users } from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'Student') return '/student/dashboard';
    if (user.role === 'Teacher') return '/teacher/dashboard';
    return '/admin/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      <div>
        {/* Top Header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 tracking-tight">
                Academic Project System
              </span>
              <p className="text-[10px] text-slate-400">Enterprise FYP Governance Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="text-xs font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-all"
              >
                Sign In to Account
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Hero */}
        <main className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-indigo-400 text-[11px] font-bold rounded-full uppercase tracking-wider">
            Academic Project Governance Platform
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight mt-6 max-w-3xl mx-auto">
            University Final Year Project Management & Governance
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A centralized platform for students, faculty supervisors, and administrators. Manage proposal evaluations, faculty capacity quotas, project file repositories, direct messaging, and WebRTC calls.
          </p>

          <div className="mt-8 flex justify-center">
            {user ? (
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shadow-md"
              >
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shadow-md"
              >
                Sign In to Portal <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Feature Highlights Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Proposal State Machine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured workflow covering draft submission, faculty review, approvals, resubmissions, and completion.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Faculty Quota Controls</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atomic database checks ensure faculty supervision capacity limits are strictly enforced under high concurrency.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Real-Time Communication</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                App-wide online status, instant chat messaging, unread badges, and P2P WebRTC audio and video calling.
              </p>
            </div>
          </div>
        </main>
      </div>

      <footer className="px-6 py-4 border-t border-slate-800 bg-slate-900 text-center text-xs text-slate-500">
        Academic Project Management System &bull; University Governance
      </footer>
    </div>
  );
};
