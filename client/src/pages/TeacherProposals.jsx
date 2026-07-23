import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  FolderKanban, CheckCircle2, AlertCircle, Check, History, Lock, 
  Search, ShieldCheck, UserCheck, FileText, Sparkles, Clock
} from 'lucide-react';

export const TeacherProposals = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const [filterTab, setFilterTab] = useState('All'); // 'All' | 'Pending' | 'Approved' | 'Completed'
  const [searchQuery, setSearchQuery] = useState('');

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/projects');
      setProjects(res.data.data.projects || []);
    } catch (err) {
      console.error('Error fetching supervised projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (projectId) => {
    setMsg('');
    setError('');

    try {
      const res = await api.put(`/teacher/projects/${projectId}/review`, {
        status: 'approved',
        remarks: remarks || 'Proposal approved by faculty supervisor',
      });
      setMsg(res.data.message);
      setActiveProject(null);
      setRemarks('');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve proposal');
    }
  };

  const handleCompleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Mark project "${projectTitle}" as COMPLETED?\n\nOnce completed:\n- This project is finalized into history as a read-only record.\n- Supervision is released so your student capacity is freed up.\n- The student can submit a new project proposal.`)) return;

    setMsg('');
    setError('');

    try {
      const res = await api.put(`/teacher/projects/${projectId}/complete`);
      setMsg(res.data.message || 'Project marked as completed successfully. Supervision released.');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete project');
    }
  };

  const filteredProjects = projects.filter((proj) => {
    const matchesSearch = 
      proj.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.student?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterTab === 'Pending') return proj.status === 'submitted' || proj.status === 'pending' || proj.status === 'under_review';
    if (filterTab === 'Approved') return proj.status === 'approved' || proj.status === 'assigned' || proj.status === 'milestone_in_progress';
    if (filterTab === 'Completed') return proj.status === 'completed';
    return true;
  });

  const pendingCount = projects.filter(p => p.status === 'submitted' || p.status === 'pending' || p.status === 'under_review').length;
  const approvedCount = projects.filter(p => p.status === 'approved' || p.status === 'assigned' || p.status === 'milestone_in_progress').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
          <Sparkles className="w-5 h-5 text-indigo-500 absolute animate-pulse" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading project proposals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <FolderKanban className="w-3.5 h-3.5" /> Proposal Evaluation & History
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Supervised Proposals</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Evaluate student project submissions, approve proposals, and finalize completed projects to release supervision capacity.
            </p>
          </div>

          {/* Metrics Pill Grid */}
          <div className="grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center shrink-0">
            <div className="px-3 py-1">
              <div className="text-lg font-bold text-amber-400">{pendingCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pending</div>
            </div>
            <div className="px-3 py-1 border-x border-white/10">
              <div className="text-lg font-bold text-emerald-400">{approvedCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Approved</div>
            </div>
            <div className="px-3 py-1">
              <div className="text-lg font-bold text-indigo-400">{completedCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Toolbar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Proposal History Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0">
          {['All', 'Pending', 'Approved', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                filterTab === tab
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab} ({tab === 'All' ? projects.length : tab === 'Pending' ? pendingCount : tab === 'Approved' ? approvedCount : completedCount})
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search proposals by student or title..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
          />
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
            No proposal records match the selected filter or search query.
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const isCompleted = proj.status === 'completed';
            const isApproved = proj.status === 'approved' || proj.status === 'assigned' || proj.status === 'milestone_in_progress';
            const canApprove = !isCompleted && !isApproved;

            return (
              <div 
                key={proj._id} 
                className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border ${
                  isCompleted 
                    ? 'border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-white via-slate-50/30 to-indigo-50/10 dark:from-slate-900 dark:to-indigo-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                } shadow-sm transition-all duration-200 space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {proj.student?.name ? proj.student.name.substring(0, 2).toUpperCase() : 'ST'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">{proj.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{proj.student?.name}</span> &bull; {proj.student?.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider self-start sm:self-auto ${
                      isApproved
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : isCompleted
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {isCompleted ? <Lock className="w-3 h-3" /> : isApproved ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {proj.status}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {proj.description}
                </div>

                {/* ACTION BUTTONS BASED ON PROJECT STATUS */}
                {canApprove && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setActiveProject(activeProject === proj._id ? null : proj._id)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs rounded-2xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Evaluate & Approve Proposal
                    </button>
                  </div>
                )}

                {isApproved && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleCompleteProject(proj._id, proj.title)}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Project as Completed
                    </button>
                  </div>
                )}

                {isCompleted && (
                  <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Project Finalized & Completed &bull; Locked Read-Only Record</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full">Supervision Released</span>
                  </div>
                )}

                {activeProject === proj._id && canApprove && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in">
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter evaluation remarks / feedback for student..."
                      className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                    ></textarea>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(proj._id)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-2xl transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Approve Proposal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
