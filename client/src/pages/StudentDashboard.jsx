import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  FileText,
  UserCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Link as LinkIcon,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Milestone submission modal state
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, deadlinesRes] = await Promise.all([
        api.get('/student/fetch-dashboard-stats'),
        api.get('/deadlines'),
      ]);
      setStats(statsRes.data.data);
      setDeadlines(deadlinesRes.data.data.deadlines || []);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmissionModal = (milestone) => {
    setActiveMilestone(milestone);
    setSubmissionUrl(milestone.submissionUrl || '');
    setMsg('');
    setError('');
  };

  const handleSubmitMilestone = async (e) => {
    e.preventDefault();
    if (!activeMilestone || !submissionUrl.trim()) return;

    setSubmitting(true);
    setMsg('');
    setError('');

    try {
      const res = await api.post(`/student/milestones/${activeMilestone._id}/submit`, {
        submissionUrl: submissionUrl.trim(),
      });
      setMsg(res.data.message || 'Milestone deliverable submitted successfully!');
      setActiveMilestone(null);
      setSubmissionUrl('');
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit milestone work');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const project = stats?.project;
  const supervisor = stats?.user?.supervisor;

  // Calculate milestone progress
  const milestones = project?.milestones || [];
  const completedCount = milestones.filter((m) => m.status === 'approved').length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950 rounded-2xl p-6 text-white shadow-lg shadow-indigo-900/10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Student FYP Portal
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Welcome back, {user.name}!</h1>
            <p className="text-xs text-indigo-200 mt-1">Track your final year project proposal, supervisor guidance, and milestone deliverables.</p>
          </div>

          <Link
            to="/student/proposal"
            className="px-4 py-2.5 bg-white text-indigo-900 font-semibold text-xs rounded-xl hover:bg-indigo-50 transition-all text-center shrink-0 shadow-sm"
          >
            {project ? 'Manage Proposal' : 'Create Proposal Draft'}
          </Link>
        </div>
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

      {/* Visual Milestone Progress Visualizer Card */}
      {project && milestones.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Overall Project Completion Progress</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {completedCount} of {totalCount} milestones approved
                </p>
              </div>
            </div>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Academic Deadlines Widget */}
      {deadlines.length > 0 && (
        <div className="bg-amber-50/60 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">Upcoming Institutional Academic Deadlines</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {deadlines.map((d) => (
              <div key={d._id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{d.name}</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                  Due: {new Date(d.dueDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Proposal Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Proposal Status</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          {project ? (
            <div>
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                  project.status === 'approved'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : project.status === 'rejected'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {project.status}
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 line-clamp-1">{project.title}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-400">No proposal created yet</p>
              <Link to="/student/proposal" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-2 block">
                Start Proposal &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Assigned Supervisor */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project Supervisor</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          {supervisor ? (
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{supervisor.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{supervisor.email}</p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">{supervisor.department}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-400">No supervisor assigned</p>
              <Link to="/student/supervisors" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-2 block">
                Request Supervisor &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project Documents</span>
            <div className="p-2 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl">
              <UploadCloud className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{project?.files?.length || 0} Files</p>
          <Link to="/student/documents" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-2 block">
            View / Upload Documents &rarr;
          </Link>
        </div>
      </div>

      {/* Project Milestones Tracker & Submission */}
      {project && milestones.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Milestone Deliverable Roadmap</h3>
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m._id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        m.status === 'approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : m.status === 'submitted'
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.description}</p>
                  {m.submissionUrl && (
                    <a
                      href={m.submissionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" /> Submitted Link: {m.submissionUrl}
                    </a>
                  )}
                  {m.teacherFeedback && (
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/50 p-2 rounded-lg mt-2">
                      <strong>Teacher Feedback:</strong> {m.teacherFeedback}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'N/A'}
                  </span>

                  {m.status !== 'approved' && (
                    <button
                      onClick={() => handleOpenSubmissionModal(m)}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3 h-3" /> {m.submissionUrl ? 'Update Link' : 'Submit Work'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestone Deliverable Submission Modal */}
      {activeMilestone && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Submit Milestone Deliverable</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Milestone: <strong>{activeMilestone.title}</strong></p>

            <form onSubmit={handleSubmitMilestone} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Deliverable Link (GitHub repo, Google Drive PDF, Figma design, or live demo)
                </label>
                <input
                  type="url"
                  required
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://github.com/username/project-repo"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveMilestone(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
