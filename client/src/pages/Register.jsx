import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldAlert, ArrowLeft } from 'lucide-react';

export const Register = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-xl text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shadow-sm mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Registration Restricted</h2>
          <p className="text-xs text-slate-500 mt-1">Institutional Account Policy Notice</p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2 text-left mb-6">
          <p className="font-semibold text-slate-800">Public self-registration is disabled for this platform.</p>
          <p>
            Student and Teacher accounts can only be provisioned by the <strong>System Administrator</strong>.
          </p>
          <p>
            If you need an account created or need your password reset, please contact your university administrator or department coordinator.
          </p>
        </div>

        <Link
          to="/login"
          className="w-full py-3 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Login
        </Link>
      </div>
    </div>
  );
};

