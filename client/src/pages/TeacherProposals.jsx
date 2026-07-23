import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FolderKanban, CheckCircle2, AlertCircle, Check, History, Lock } from 'lucide-react';

export const TeacherProposals = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const [filterTab, setFilterTab] = useState('All'); // 'All' | 'Pending' | 'Approved' | 'Completed'

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
    if (!window.confirm(`Mark project "${projectTitle}" as COMPLETED? Once completed, this project is finalized into history, supervision is released, and the student can submit a new project proposal.`)) return;

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
    if (filterTab === 'Pending') return proj.status === 'submitted' || proj.status === 'pending' || proj.status === 'under_review';
    if (filterTab === 'Approved') return proj.status === 'approved' || proj.status === 'assigned' || proj.status === 'milestone_in_progress';
    if (filterTab === 'Completed') return proj.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
          <FolderKanban className="w-3.5 h-3.5" /> Proposal Evaluation & History
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Supervised Project Proposals</h1>
        <p className="text-xs text-slate-300 mt-1">Review student proposals, evaluate submissions, and mark finalized projects as completed.</p>
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

      {/* Proposal History Filter Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit text-xs font-bold">
        {['All', 'Pending', 'Approved', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              filterTab === tab
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {tab} History
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            No proposal records match the selected filter.
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const isCompleted = proj.status === 'completed';
            const isApproved = proj.status === 'approved' || proj.status === 'assigned' || proj.status === 'milestone_in_progress';
            const canApprove = !isCompleted && !isApproved;

            return (
              <div key={proj._id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{proj.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      Student: <span className="font-semibold text-slate-700 dark:text-slate-300">{proj.student?.name}</span> ({proj.student?.email})
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      isApproved
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : isCompleted
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {proj.description}
                </div>

                {/* ACTION BUTTONS BASED ON PROJECT STATUS */}
                {canApprove && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setActiveProject(activeProject === proj._id ? null : proj._id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
                    >
                      Evaluate & Approve Proposal
                    </button>
                  </div>
                )}

                {isApproved && (
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleCompleteProject(proj._id, proj.title)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Project as Completed
                    </button>
                  </div>
                )}

                {isCompleted && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" /> Project Finalized & Completed &bull; Read-Only Record
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Supervision Released</span>
                  </div>
                )}

                {activeProject === proj._id && canApprove && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter review remarks / approval feedback for student..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(proj._id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Proposal
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
