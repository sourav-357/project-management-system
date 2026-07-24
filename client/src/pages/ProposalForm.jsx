import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Send, CheckCircle2, AlertCircle, Clock, History, Lock, XCircle, File, Download, UserCheck, ShieldCheck
} from 'lucide-react';

export const ProposalForm = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeProject, setActiveProject] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, []);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/project');
      const { project, projectsHistory } = res.data.data;
      setActiveProject(project);
      setHistory(projectsHistory || []);
      if (project) {
        setTitle(project.title || '');
        setDescription(project.description || '');
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.post('/student/project-proposal', {
        title,
        description,
      });
      setMessage(res.data.message || 'Proposal submitted successfully!');
      setTitle('');
      setDescription('');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Active proposal lock: If project exists and is NOT completed and NOT rejected
  const hasActiveUnresolvedProject = activeProject && activeProject.status !== 'completed' && activeProject.status !== 'rejected';

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      {/* Simple Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Student Desk</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Project Proposals</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit new proposals, track evaluation status, supervisor assignments, and deliverable files.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Proposal Lock Notice OR Form */}
      {hasActiveUnresolvedProject ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Proposal Submission Locked</p>
            <p className="mt-0.5">
              You currently have an active proposal titled <b>"{activeProject.title}"</b> (Status: <span className="uppercase font-bold">{activeProject.status}</span>). You cannot submit a new proposal until your active project is completed or rejected by faculty.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Submit New Proposal
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI-Powered Autonomous Drone Navigation System"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Description & Objectives</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe problem statement, research objectives, methodology, and expected outcomes..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Submit Proposal'}</span>
          </button>
        </form>
      )}

      {/* Submitted Proposals Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Submitted Proposals ({history.length})
        </h3>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No project proposals submitted yet.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {history.map((item) => {
              const files = item.files || [];

              return (
                <div key={item._id} className="py-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'completed' || item.status === 'approved' || item.status === 'assigned'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : item.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.status === 'submitted' || item.status === 'pending' ? 'Pending Review' : item.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-400">{item.description}</p>

                  {/* Supervisor Meta */}
                  {item.supervisor && (
                    <div className="flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Supervisor: <b>{item.supervisor.name}</b> ({item.supervisor.email})</span>
                    </div>
                  )}

                  {/* Deliverable Files */}
                  {files.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1">
                        <File className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Uploaded Files ({files.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {files.map((file, fIdx) => {
                          const fileUrl = file.url || file.path || file.fileUrl;
                          const fileName = file.filename || file.name || file.originalName || `File #${fIdx + 1}`;

                          return (
                            <a
                              key={fIdx}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[180px]">{fileName}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Faculty Feedback */}
                  {item.feedback && item.feedback.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                      <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Feedback:
                      </p>
                      {item.feedback.map((f, fIdx) => (
                        <p key={fIdx} className="text-slate-600 dark:text-slate-400">
                          &bull; {f.message} <span className="text-[9px] text-slate-500">({new Date(f.createdAt || Date.now()).toLocaleDateString()})</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
