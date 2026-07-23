import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, role);
      const userRole = res.data.user.role;
      if (userRole === 'Student') navigate('/student/dashboard');
      else if (userRole === 'Teacher') navigate('/teacher/dashboard');
      else navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-6 transition-colors selection:bg-indigo-500 selection:text-white relative">
      {/* Top Header with Back to Home & Dark Mode Toggle */}
      <header className="flex justify-between items-center max-w-5xl mx-auto w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl mx-auto my-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Sign In to Your Account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Academic Project Workflow Management Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Select Role</label>
            <div className="grid grid-cols-3 gap-2">
              {['Student', 'Teacher', 'Admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    if (r === 'Admin') {
                      setEmail('admin@university.edu');
                      setPassword('admin123456');
                    } else if (r === 'Teacher') {
                      setEmail('teacher@university.edu');
                      setPassword('teacher123456');
                    } else {
                      setEmail('student@university.edu');
                      setPassword('student123456');
                    }
                  }}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    role === r
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.edu"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 active:scale-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <strong>Need an account?</strong> Student & Teacher accounts are provisioned directly by the System Administrator.
          </p>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        Academic Workflow System &bull; Secure Authentication Portal
      </footer>
    </div>
  );
};
