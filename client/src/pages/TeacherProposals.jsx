import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FolderKanban, CheckCircle2, AlertCircle, Check, X, CheckSquare, File, Download, CheckCircle, ShieldCheck } from 'lucide-react';

export const TeacherProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchProposals();
  }, [statusFilter]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/projects');
      const allProjects = res.data.data.projects || [];

      if (statusFilter === 'All') {
        setProposals(allProjects);
      } else {
        const filterKey = statusFilter.toLowerCase();
        setProposals(
          allProjects.filter((p) => {
            if (filterKey === 'pending') return p.status === 'submitted' || p.status === 'pending' || p.status === 'under_review';
            if (filterKey === 'approved') return p.status === 'approved' || p.status === 'assigned';
            if (filterKey === 'completed') return p.status === 'completed';
            return p.status === filterKey;
          })
        );
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (projectId, action) => {
    setActionMsg('');
    setActionError('');

    try {
      const res = await api.put(`/teacher/projects/${projectId}/review`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        remarks,
      });
      setActionMsg(res.data.message || `Proposal ${action}d successfully.`);
      setSelectedProposal(null);
      setRemarks('');
      fetchProposals();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to process proposal review.');
    }
  };

  const handleCompleteProject = async (projectId) => {
    if (!window.confirm('Mark this active project as COMPLETED? Supervision will be completed.')) return;
    setActionMsg('');
    setActionError('');

    try {
      const res = await api.put(`/teacher/projects/${projectId}/complete`);
      setActionMsg(res.data.message || 'Project marked as completed successfully.');
      fetchProposals();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to complete project.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Evaluation Desk</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Project Proposals & Deliverables</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Evaluate submitted student proposals, inspect deliverable files, and mark ongoing projects as completed.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          {['All', 'Pending', 'Approved', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
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

      {/* Proposals List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Proposals Directory ({proposals.length})</h3>

        {proposals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No project proposals found matching filter.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {proposals.map((item) => {
              const projectFiles = item.files || [];
              const isOngoing = item.status === 'approved' || item.status === 'assigned' || item.status === 'milestone_in_progress';
              const isPending = item.status === 'submitted' || item.status === 'pending' || item.status === 'under_review';

              return (
                <div key={item._id} className="py-4 space-y-3 text-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'completed' || item.status === 'approved' || item.status === 'assigned'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : item.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isPending ? 'Pending Evaluation' : item.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>
                      <p className="text-[10px] text-slate-500">Student: <b>{item.student?.name}</b> ({item.student?.email})</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <button
                          onClick={() => setSelectedProposal(item)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-sm"
                        >
                          Evaluate Proposal
                        </button>
                      )}

                      {isOngoing && (
                        <button
                          onClick={() => handleCompleteProject(item._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm"
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Mark Completed
                        </button>
                      )}

                      {item.status === 'completed' && (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl font-bold uppercase text-[10px]">
                          Completed Project
                        </span>
                      )}

                      {item.status === 'rejected' && (
                        <span className="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl font-bold uppercase text-[10px]">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student Uploaded Deliverable Files Section */}
                  {projectFiles.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <File className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Uploaded Deliverables ({projectFiles.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {projectFiles.map((file, fIdx) => {
                          const fileUrl = file.url || file.path || file.fileUrl;
                          const fileName = file.filename || file.name || file.originalName || `Deliverable #${fIdx + 1}`;

                          return (
                            <a
                              key={fIdx}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-300 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <Download className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              <span>{fileName}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Evaluate Proposal: {selectedProposal.title}</h3>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p><b>Student:</b> {selectedProposal.student?.name}</p>
              <p className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 leading-relaxed max-h-40 overflow-y-auto">
                {selectedProposal.description}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Faculty Evaluation Remarks</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add constructive feedback or instructions..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview(selectedProposal._id, 'approve')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm"
              >
                Approve Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
