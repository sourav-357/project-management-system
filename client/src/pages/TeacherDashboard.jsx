import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, UserCheck, FolderKanban, CheckSquare, AlertTriangle, UserMinus, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/dashboard-stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load teacher stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDropStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to drop supervision for ${studentName}?`)) return;
    setActionMsg('');
    setActionError('');

    try {
      const res = await api.put(`/teacher/students/${studentId}/drop`);
      setActionMsg(res.data.message || `Dropped supervision for ${studentName}`);
      fetchStats();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to drop student supervision');
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const assignedCount = stats?.assignedCount || 0;
  const maxStudents = stats?.maxStudents || 10;
  const capacityPercent = Math.min(100, Math.round((assignedCount / maxStudents) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Faculty Portal</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Welcome, Prof. {user.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Evaluate proposals, supervise active projects, and manage capacity.</p>
        </div>

        <Link
          to="/teacher/requests"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm"
        >
          <UserCheck className="w-4 h-4" /> View Requests ({stats?.pendingRequestsCount || 0})
        </Link>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Capacity Gauge */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Supervision Capacity Gauge</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {assignedCount} of {maxStudents} student slots filled ({stats?.availableCapacity || 0} remaining)
            </p>
          </div>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{capacityPercent}%</span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full ${capacityPercent >= 100 ? 'bg-rose-500' : 'bg-indigo-600'}`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending Requests</span>
            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.pendingRequestsCount || 0}</p>
          <Link to="/teacher/requests" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            Review Inbox <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending Proposals</span>
            <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.pendingProposalsCount || 0}</p>
          <Link to="/teacher/proposals" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            Evaluate Proposals <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Approved Projects</span>
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats?.approvedProjectsCount || 0}</p>
          <span className="text-xs text-slate-500 dark:text-slate-400">Active Supervised FYPs</span>
        </div>
      </div>

      {/* Supervised Students Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Supervised Students Directory</h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {!stats?.assignedStudents || stats.assignedStudents.length === 0 ? (
            <p className="py-6 text-xs text-slate-500 text-center">No students currently assigned under supervision.</p>
          ) : (
            stats.assignedStudents.map((st) => (
              <div key={st._id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 overflow-hidden shrink-0">
                    {st.avatar ? (
                      <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                    ) : (
                      st.name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-200">{st.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{st.email} &bull; {st.department || 'CS'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDropStudent(st._id, st.name)}
                  className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <UserMinus className="w-3.5 h-3.5" /> Drop
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
