import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, UserCheck, UploadCloud, CheckCircle2, AlertCircle, Sparkles,
  Clock, MessageSquare, Video, ChevronRight, ShieldCheck, FolderKanban,
  User, ArrowUpRight, Activity, CheckCircle, Lock, Award, History
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Student Dashboard...</p>
      </div>
    );
  }

  const project = stats?.project;
  const projectsHistory = stats?.projectsHistory || [];
  const supervisor = stats?.user?.supervisor;

  // Lifecycle progress calculation
  const getLifecycleStage = () => {
    if (!project) return 0; // No project = Stage 0 (0% complete)
    if (project.status === 'completed') return 4;
    if (supervisor) return 3; // Step 3: Supervisor Assigned
    if (project.status === 'approved' || project.status === 'assigned' || project.status === 'milestone_in_progress') return 2; // Step 2: Proposal Approved
    return 1; // Step 1: Proposal submitted/pending evaluation
  };

  const currentStage = getLifecycleStage();
  const progressPercent = currentStage === 4 ? 100 : currentStage === 3 ? 75 : currentStage === 2 ? 50 : currentStage === 1 ? 25 : 0;

  const completedCount = projectsHistory.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. HERO WELCOME BANNER WITH GLASSMORPHISM & GRADIENT AURA */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-950 text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-[11px] font-bold border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Academic Workspace &bull; {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {getGreeting()}, {user.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track your project lifecycle, collaborate with your faculty supervisor in real time, and manage academic project documents.
            </p>
          </div>

          {/* Quick Hero Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/student/proposal"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {project ? 'Manage Proposal' : 'Create Proposal'}
            </Link>

            {supervisor && (
              <button
                onClick={() => navigate('/chat')}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 border border-white/20"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Chat Supervisor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. PROJECT GOVERNANCE LIFECYCLE TRACKER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Project Lifecycle Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track progress through proposal evaluation, supervisor assignment, and completion.</p>
          </div>
          <span className="px-3.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-xs rounded-full border border-indigo-200 dark:border-indigo-800">
            {progressPercent}% Completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stages Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {[
            { step: 1, title: '1. Proposal Submitted', desc: project ? `Status: ${project.status}` : 'No active proposal' },
            { step: 2, title: '2. Proposal Approved', desc: project?.status === 'approved' || project?.status === 'assigned' || project?.status === 'milestone_in_progress' ? 'Approved by Faculty' : 'Under Evaluation' },
            { step: 3, title: '3. Supervisor Assigned', desc: supervisor ? `Assigned: ${supervisor.name}` : 'Pending assignment' },
            { step: 4, title: '4. Project Completion', desc: project?.status === 'completed' ? 'Finalized & Completed' : 'In Progress' },
          ].map((s) => {
            const isDone = currentStage >= s.step && currentStage > 0;
            const isCurrent = currentStage === s.step;

            return (
              <div
                key={s.step}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 dark:border-indigo-600 shadow-sm ring-2 ring-indigo-500/10'
                    : isDone
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-3.5 h-3.5 fill-current" /> : s.step}
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{s.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-8">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. THREE MAIN METRIC & ACTION CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: ACTIVE PROJECT PROPOSAL */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                My Active Proposal
              </span>
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                {project?.title || (completedCount > 0 ? 'Ready for New Proposal' : 'No Proposal Submitted Yet')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {project?.description || (completedCount > 0 ? 'Your previous project was completed! Submit a new project proposal.' : 'Write down your project abstract and submit for faculty review.')}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span
              className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                project?.status === 'approved' || project?.status === 'assigned'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : project?.status === 'rejected'
                  ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : project?.status
                  ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {project?.status || 'Not Submitted'}
            </span>

            <Link
              to="/student/proposal"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              {project ? 'Manage Proposal' : 'Create Proposal'} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* CARD 2: SUPERVISOR PROFILE & DIRECT COLLABORATION */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Assigned Supervisor
              </span>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {supervisor ? (
              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md overflow-hidden shrink-0 border border-indigo-400">
                  {supervisor.avatar ? (
                    <img src={supervisor.avatar} alt={supervisor.name} className="w-full h-full object-cover" />
                  ) : (
                    supervisor.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{supervisor.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{supervisor.email}</p>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                    {supervisor.department || 'Faculty Supervisor'}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">No Supervisor Assigned</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Browse available faculty supervisors and request supervision once your proposal is approved.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            {supervisor ? (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={() => navigate('/chat')}
                  className="flex-1 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message
                </button>
                <button
                  onClick={() => navigate('/meetings')}
                  className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all flex items-center gap-1"
                  title="Video Call"
                >
                  <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Call
                </button>
              </div>
            ) : (
              <Link
                to="/student/supervisors"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Choose Supervisor &rarr;
              </Link>
            )}
          </div>
        </div>

        {/* CARD 3: PROJECT DOCUMENTS & REPOSITORY */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Document Repository
              </span>
              <div className="p-2.5 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-2xl border border-violet-100 dark:border-violet-900">
                <UploadCloud className="w-5 h-5" />
              </div>
            </div>

            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {project?.files?.length || 0} <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Uploaded Files</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload SRS documentation, architectural diagrams, research papers, and source code archives.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">PDF, DOCX, ZIP supported</span>
            <Link
              to="/student/documents"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Manage Files <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTION TILES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'My Proposal', icon: FileText, path: '/student/proposal', color: 'from-indigo-600 to-indigo-700', desc: 'Submit Project Proposal' },
          { label: 'Select Supervisor', icon: UserCheck, path: '/student/supervisors', color: 'from-emerald-600 to-emerald-700', desc: 'Faculty Directory' },
          { label: 'Documents Portal', icon: UploadCloud, path: '/student/documents', color: 'from-violet-600 to-violet-700', desc: 'SRS & Architecture' },
          { label: 'Network & Chat', icon: MessageSquare, path: '/chat', color: 'from-sky-600 to-sky-700', desc: 'Direct Collaboration' },
        ].map((tile) => {
          const IconComp = tile.icon;
          return (
            <Link
              key={tile.label}
              to={tile.path}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${tile.color} text-white flex items-center justify-center shadow-md`}>
                <IconComp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  {tile.label} <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{tile.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 5. HISTORICAL PROJECTS RECORD (IF ANY COMPLETED) */}
      {completedCount > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" /> Completed Projects History ({completedCount})
            </h3>
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 uppercase tracking-wider">
              Archived & Read-Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectsHistory.filter(p => p.status === 'completed').map((p) => (
              <div key={p._id} className="p-5 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 space-y-3 shadow-xs">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{p.title}</h4>
                  <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold rounded-full flex items-center gap-1 shrink-0 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold pt-2 border-t border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center">
                  <span>Supervisor: <strong className="text-slate-700 dark:text-slate-300">{p.supervisor ? p.supervisor.name : 'Completed'}</strong></span>
                  <span>{new Date(p.updatedAt || p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
