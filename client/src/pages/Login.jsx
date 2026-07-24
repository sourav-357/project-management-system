import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, LogIn, AlertCircle, ArrowLeft, Clock, UserPlus } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('student@university.edu');
  const [password, setPassword] = useState('student123456');
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

  const isPendingError = error.toLowerCase().includes('pending admin approval') || error.toLowerCase().includes('pending approval');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
      <header className="max-w-5xl mx-auto w-full flex justify-between items-center">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <Link to="/register" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-indigo-400 rounded-xl transition-all">
          <UserPlus className="w-3.5 h-3.5" /> Register Account
        </Link>
      </header>

      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl mx-auto my-auto space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Sign In to Your Account</h2>
          <p className="text-xs text-slate-400">Academic Project Management System</p>
        </div>

        {error && (
          <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
            isPendingError
              ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {isPendingError ? (
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="block font-bold">{isPendingError ? 'Approval Pending' : 'Authentication Error'}</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Role</label>
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
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.edu"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-indigo-400 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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

        <div className="pt-2 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:underline font-bold">
            Register Account Here
          </Link>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500">
        Academic Project System &bull; Secure Login Portal
      </footer>
    </div>
  );
};
