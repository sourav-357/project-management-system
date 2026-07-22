import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, UserCheck, FolderKanban, CheckSquare, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const assignedCount = stats?.assignedCount || 0;
  const maxStudents = stats?.maxStudents || 10;
  const capacityPercent = Math.min(100, Math.round((assignedCount / maxStudents) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 dark:from-slate-950 dark:via-indigo-950 dark:to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Faculty Supervisor Portal
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Welcome, Prof. {user.name}</h1>
            <p className="text-xs text-indigo-200 mt-1">Manage student supervision requests, review proposals, and evaluate milestones.</p>
          </div>
          <Link
            to="/teacher/requests"
            className="px-4 py-2.5 bg-white text-slate-900 font-semibold text-xs rounded-xl hover:bg-slate-100 transition-all text-center shrink-0 shadow-sm"
          >
            View Incoming Requests ({stats?.pendingRequestsCount || 0})
          </Link>
        </div>
      </div>

      {/* Visual Supervisee Capacity Gauge Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Supervision Capacity Gauge</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {assignedCount} of {maxStudents} student slots assigned ({stats?.availableCapacity || 0} available)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {capacityPercent >= 100 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> At Max Capacity
              </span>
            )}
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{capacityPercent}%</span>
          </div>
        </div>

        {/* Meter Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              capacityPercent >= 100
                ? 'bg-rose-500'
                : capacityPercent >= 80
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-indigo-600 to-emerald-500'
            }`}
            style={{ width: `${capacityPercent}%` }}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Requests</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats?.pendingRequestsCount || 0}</p>
          <Link to="/teacher/requests" className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 block">
            Review requests &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Proposals</span>
            <FolderKanban className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats?.pendingProposalsCount || 0}</p>
          <Link to="/teacher/proposals" className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 block">
            Review proposals &rarr;
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Approved Projects</span>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{stats?.approvedProjectsCount || 0}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">Active supervisions</span>
        </div>
      </div>

      {/* Supervised Students List */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Current Supervisees Directory</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {!stats?.assignedStudents || stats.assignedStudents.length === 0 ? (
            <p className="py-6 text-xs text-slate-400 dark:text-slate-500 text-center">No students currently assigned under supervision</p>
          ) : (
            stats.assignedStudents.map((st) => (
              <div key={st._id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-700 text-white font-bold flex items-center justify-center text-xs">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{st.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{st.email} &bull; {st.department}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{st.project?.title || 'Proposal Pending'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
