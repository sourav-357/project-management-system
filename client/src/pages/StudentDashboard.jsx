import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, UserCheck, UploadCloud, CheckCircle2, MessageSquare,
  Activity, ArrowUpRight, Award, CheckCircle, ChevronRight
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/student/fetch-dashboard-stats');
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const project = stats?.project;
  const projectsHistory = stats?.projectsHistory || [];
  const supervisor = stats?.user?.supervisor;

  const getLifecycleStage = () => {
    if (!project) return 0;
    if (project.status === 'completed') return 4;
    if (supervisor) return 3;
    if (project.status === 'approved' || project.status === 'assigned') return 2;
    return 1;
  };

  const currentStage = getLifecycleStage();
  const progressPercent = currentStage === 4 ? 100 : currentStage === 3 ? 75 : currentStage === 2 ? 50 : currentStage === 1 ? 25 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Student Dashboard</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Welcome, {user.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track your FYP proposal, faculty supervision, and deliverables.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/student/proposal"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            {project ? 'Manage Proposal' : 'Create Proposal'}
          </Link>
          {supervisor && (
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Chat Supervisor
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Progress */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Project Lifecycle Progress
          </h3>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-600/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {progressPercent}% Complete
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {[
            { step: 1, title: '1. Proposal Submitted', desc: project ? `Status: ${project.status}` : 'No proposal' },
            { step: 2, title: '2. Faculty Approved', desc: project?.status === 'approved' || project?.status === 'assigned' ? 'Approved' : 'Under Review' },
            { step: 3, title: '3. Supervisor Assigned', desc: supervisor ? supervisor.name : 'Pending' },
            { step: 4, title: '4. Project Completed', desc: project?.status === 'completed' ? 'Completed' : 'In Progress' },
          ].map((s) => {
            const isDone = currentStage >= s.step && currentStage > 0;
            return (
              <div key={s.step} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    {isDone ? '✓' : s.step}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{s.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposal Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Proposal</span>
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
              {project?.title || 'No active proposal'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {project?.description || 'Submit your FYP proposal to begin the approval process.'}
            </p>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              {project?.status || 'Not Started'}
            </span>
            <Link to="/student/proposal" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              View <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Supervisor Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Faculty Supervisor</span>
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            {supervisor ? (
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{supervisor.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{supervisor.email}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">No supervisor assigned yet.</p>
            )}
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <Link to="/student/supervisors" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              {supervisor ? 'View Directory' : 'Select Supervisor'} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Deliverables Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deliverables</span>
              <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{project?.files?.length || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded project documents & deliverables.</p>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <Link to="/student/documents" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              Documents <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
