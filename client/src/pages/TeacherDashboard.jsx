import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, UserCheck, FolderKanban, CheckSquare, Sparkles, TrendingUp, 
  AlertTriangle, UserMinus, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck 
} from 'lucide-react';

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
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Faculty Dashboard...</p>
      </div>
    );
  }

  const assignedCount = stats?.assignedCount || 0;
  const maxStudents = stats?.maxStudents || 10;
  const capacityPercent = Math.min(100, Math.round((assignedCount / maxStudents) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Faculty Supervisor Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, Prof. {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Evaluate student proposals, supervise ongoing projects, and manage supervision capacity.
            </p>
          </div>

          <Link
            to="/teacher/requests"
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-center shrink-0 self-start md:self-auto flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" /> View Requests ({stats?.pendingRequestsCount || 0})
          </Link>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{actionMsg}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{actionError}</span>
        </div>
      )}

      {/* Visual Supervisee Capacity Gauge Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Supervision Capacity Gauge</h3>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {assignedCount} of {maxStudents} student slots filled ({stats?.availableCapacity || 0} slots remaining)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {capacityPercent >= 100 && (
              <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Capacity Full
              </span>
            )}
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{capacityPercent}%</span>
          </div>
        </div>

        {/* Meter Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 shadow-sm ${
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Requests</span>
              <UserCheck className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats?.pendingRequestsCount || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {stats?.pendingSupervisorRequestsCount || 0} Supervision &bull; {stats?.pendingConnectionRequestsCount || 0} Peer Connections
            </p>
          </div>
          <Link to="/teacher/requests" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2">
            Review requests <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Proposals</span>
              <FolderKanban className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats?.pendingProposalsCount || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Student proposals awaiting faculty review
            </p>
          </div>
          <Link to="/teacher/proposals" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2">
            Evaluate proposals <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Approved Projects</span>
              <CheckSquare className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{stats?.approvedProjectsCount || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Active supervised projects in progress
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-2">
            Active Supervision
          </span>
        </div>
      </div>

      {/* Supervised Students List */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Current Supervisees Directory</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {!stats?.assignedStudents || stats.assignedStudents.length === 0 ? (
            <p className="py-8 text-xs text-slate-400 text-center font-medium">No students currently assigned under supervision</p>
          ) : (
            stats.assignedStudents.map((st) => (
              <div key={st._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{st.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{st.email} &bull; {st.department || 'Department'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleDropStudent(st._id, st.name)}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-2xl hover:bg-rose-100 transition-all flex items-center gap-1.5 border border-rose-200 dark:border-rose-800/60 active:scale-95"
                  >
                    <UserMinus className="w-4 h-4" /> Drop Supervision
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
