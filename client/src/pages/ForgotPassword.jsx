import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/password/forgot', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-6 transition-colors selection:bg-indigo-500 selection:text-white">
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
        <ThemeToggle />
      </header>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl mx-auto my-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Reset Your Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Enter your registered academic email address</p>
        </div>

        {message && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.edu"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>

      <footer className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        Academic Workflow System &bull; Password Security Recovery
      </footer>
    </div>
  );
};
