import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, FolderKanban, CheckCircle2, Sparkles, PieChart, Calendar, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deadline modal
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlineName, setDeadlineName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submittingDeadline, setSubmittingDeadline] = useState(false);

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, deadlinesRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/deadlines'),
      ]);
      setStats(statsRes.data.data);
      setDeadlines(deadlinesRes.data.data.deadlines || []);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeadline = async (e) => {
    e.preventDefault();
    if (!deadlineName.trim() || !dueDate) return;

    setSubmittingDeadline(true);
    setMsg('');
    setError('');

    try {
      const res = await api.post('/deadlines', {
        name: deadlineName.trim(),
        dueDate,
      });
      setMsg(res.data.message || 'Academic deadline published');
      setShowDeadlineModal(false);
      setDeadlineName('');
      setDueDate('');
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create deadline');
    } finally {
      setSubmittingDeadline(false);
    }
  };

  const handleDeleteDeadline = async (id) => {
    if (!window.confirm('Delete this academic deadline?')) return;
    try {
      await api.delete(`/deadlines/${id}`);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete deadline');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const metrics = stats?.metrics;
  const totalProjects = metrics?.totalProjects || 1;
  const approvedProjects = metrics?.approvedProjects || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> System Administrator Governance Panel
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">System Control Dashboard</h1>
            <p className="text-xs text-slate-300 mt-1">Manage platform users, supervision allocations, project workflows, and academic deadlines.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeadlineModal(true)}
              className="px-3.5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Broadcast Deadline
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{metrics?.totalStudents || 0}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">Registered students</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Faculty Supervisors</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{metrics?.totalTeachers || 0}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">Active faculty</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Proposals</span>
            <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{metrics?.totalProjects || 0}</p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">Project proposals</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Approved Pipeline</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{approvedProjects}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">Approved proposals</span>
        </div>
      </div>

      {/* Grid: Academic Deadlines & Proposal Ratio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Deadlines Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Academic Deadlines</h3>
            </div>
            <button
              onClick={() => setShowDeadlineModal(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              + Add
            </button>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {deadlines.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No active deadlines created</p>
            ) : (
              deadlines.map((d) => (
                <div key={d._id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{d.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Due: {new Date(d.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDeadline(d._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Delete deadline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Visual System Distribution Overview */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Project Proposal Approval Ratio</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Ratio of approved projects in the system</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Approval Rate</span>
              <span>{Math.round((approvedProjects / (totalProjects || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((approvedProjects / (totalProjects || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Academic Deadline Modal */}
      {showDeadlineModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Broadcast Academic Deadline</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Set a mandatory institutional deadline for all students and supervisors.</p>

            <form onSubmit={handleCreateDeadline} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Deadline Title / Event Name</label>
                <input
                  type="text"
                  required
                  value={deadlineName}
                  onChange={(e) => setDeadlineName(e.target.value)}
                  placeholder="e.g. Final Year Project Deliverable Phase 1 Submission"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeadlineModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDeadline}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {submittingDeadline ? 'Publishing...' : 'Publish Deadline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
