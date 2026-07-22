import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FolderKanban, CheckCircle2, AlertCircle, MessageSquare, Send, Check, X, ShieldCheck, Mail } from 'lucide-react';

export const TeacherProposals = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [activeProject, setActiveProject] = useState(null);

  // Feedback modal states
  const [feedbackProj, setFeedbackProj] = useState(null);
  const [fbTitle, setFbTitle] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [fbType, setFbType] = useState('general');
  const [fbSubmitting, setFbSubmitting] = useState(false);

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

  const handleReview = async (projectId, status) => {
    setMsg('');
    setError('');

    try {
      const res = await api.put(`/teacher/projects/${projectId}/review`, {
        status,
        remarks: remarks || `Proposal ${status} by supervisor`,
      });
      setMsg(res.data.message);
      setActiveProject(null);
      setRemarks('');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update proposal status');
    }
  };

  const handleOpenFeedbackModal = (proj) => {
    setFeedbackProj(proj);
    setFbTitle('');
    setFbMessage('');
    setFbType('general');
    setMsg('');
    setError('');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackProj || !fbTitle.trim() || !fbMessage.trim()) return;

    setFbSubmitting(true);
    setMsg('');
    setError('');

    try {
      const res = await api.post(`/teacher/projects/${feedbackProj._id}/feedback`, {
        title: fbTitle.trim(),
        message: fbMessage.trim(),
        type: fbType,
      });
      setMsg(res.data.message || 'Structured feedback sent to student');
      setFeedbackProj(null);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setFbSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
          <FolderKanban className="w-3.5 h-3.5" /> Proposal Evaluation Hub
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Project Proposals & Evaluation</h1>
        <p className="text-xs text-slate-300 mt-1">Review student final year project proposals and send structured evaluation feedback.</p>
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

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            No projects available under your supervision or department.
          </div>
        ) : (
          projects.map((proj) => (
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
                    proj.status === 'approved' || proj.status === 'accepted'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : proj.status === 'rejected'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {proj.status}
                </span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {proj.description}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenFeedbackModal(proj)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Send Project Feedback
                </button>

                <button
                  onClick={() => setActiveProject(activeProject === proj._id ? null : proj._id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
                >
                  Evaluate Proposal
                </button>
              </div>

              {activeProject === proj._id && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter review remarks / evaluation feedback for student..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleReview(proj._id, 'rejected')}
                      className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold text-xs rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject Proposal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview(proj._id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Proposal
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Structured Feedback Modal */}
      {feedbackProj && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Send Structured Feedback to Student</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Project: {feedbackProj.title}</p>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback Title</label>
                <input
                  type="text"
                  required
                  value={fbTitle}
                  onChange={(e) => setFbTitle(e.target.value)}
                  placeholder="e.g. Needs Methodology Revision"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback Type</label>
                <select
                  value={fbType}
                  onChange={(e) => setFbType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="general">General Note</option>
                  <option value="positive">Positive / Praise</option>
                  <option value="corrective">Corrective / Required Changes</option>
                  <option value="warning">Warning / Critical Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback Message</label>
                <textarea
                  rows={4}
                  required
                  value={fbMessage}
                  onChange={(e) => setFbMessage(e.target.value)}
                  placeholder="Detailed feedback and guidance for student..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackProj(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fbSubmitting || !fbTitle.trim() || !fbMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {fbSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
