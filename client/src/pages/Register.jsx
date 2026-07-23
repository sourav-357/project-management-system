import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const Register = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-6 transition-colors selection:bg-indigo-500 selection:text-white">
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Return to Sign In
        </Link>
        <ThemeToggle />
      </header>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl text-center mx-auto my-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black shadow-sm mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Registration Restricted</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Institutional Account Provisioning Policy</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-300 space-y-2 text-left mb-6 font-medium leading-relaxed">
          <p className="font-bold text-slate-800 dark:text-slate-100">Public self-registration is disabled on this platform.</p>
          <p>
            Student and Teacher accounts can only be provisioned by the <strong>System Administrator</strong> to ensure academic integrity.
          </p>
          <p>
            If you require access or an account creation, please contact your academic department administrator.
          </p>
        </div>

        <Link
          to="/login"
          className="w-full py-3 bg-indigo-600 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Sign In
        </Link>
      </div>

      <footer className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        Academic Project Management System &bull; Restricted Portal
      </footer>
    </div>
  );
};
