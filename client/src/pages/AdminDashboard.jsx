import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, FolderKanban, CheckCircle2, PieChart, 
  ShieldCheck, AlertCircle, ArrowUpRight 
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/admin/dashboard-stats');
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading System Governance Panel...</p>
      </div>
    );
  }

  const metrics = stats?.metrics;
  const totalProjects = metrics?.totalProjects || 1;
  const approvedProjects = metrics?.approvedProjects || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" /> System Control Panel
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">System Governance</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Global administration of platform users, supervision allocations, and project workflows.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Students</span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{metrics?.totalStudents || 0}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">Enrolled students</span>
          </div>
          <Link to="/admin/users?role=Student" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2">
            Manage students <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Faculty Supervisors</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{metrics?.totalTeachers || 0}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">Active faculty members</span>
          </div>
          <Link to="/admin/users?role=Teacher" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2">
            Manage faculty <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Proposals</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{metrics?.totalProjects || 0}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">Submitted project proposals</span>
          </div>
          <Link to="/admin/projects" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2">
            View proposals <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Approved Projects</span>
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{approvedProjects}</p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">Approved & in-progress</span>
          </div>
          <span className="text-xs font-bold text-slate-400 pt-2 block">System Verified</span>
        </div>
      </div>

      {/* Visual System Distribution Overview */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Project Proposal Approval Ratio</h3>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">System Approval Conversion</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>Overall Approval Rate</span>
            <span>{Math.round((approvedProjects / (totalProjects || 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.round((approvedProjects / (totalProjects || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
