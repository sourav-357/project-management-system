import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  FileText, Send, AlertCircle, CheckCircle2, History, Award, Sparkles, Lock
} from 'lucide-react';

export const ProposalForm = () => {
  const [projectId, setProjectId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const [projectsHistory, setProjectsHistory] = useState([]);
  const [selectedHistoryProject, setSelectedHistoryProject] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setFetching(true);
      const res = await api.get('/student/project');
      const activeProj = res.data.data.project;
      const historyList = res.data.data.projectsHistory || [];

      setProjectsHistory(historyList);

      if (activeProj) {
        setProjectId(activeProj._id);
        setTitle(activeProj.title || '');
        setDescription(activeProj.description || '');
        setStatus(activeProj.status || '');
      } else {
        // No active non-finalized project -> Reset form for fresh proposal submission
        resetFormForNewProject();
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
    } finally {
      setFetching(false);
    }
  };

  const resetFormForNewProject = () => {
    setProjectId(null);
    setTitle('');
    setDescription('');
    setStatus('');
    setSelectedHistoryProject(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');

    if (!title.trim() || !description.trim()) {
      setError('Please write down the project title and detailed description.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/student/project-proposal', {
        projectId,
        title: title.trim(),
        description: description.trim(),
      });
      setMessage(res.data.message || 'Project proposal submitted successfully');
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const viewHistoryProject = (proj) => {
    setSelectedHistoryProject(proj);
  };

  const isCompleted = status === 'completed';
  const isRejected = status === 'rejected';
  const isOngoing = status === 'submitted' || status === 'pending' || status === 'approved' || status === 'assigned' || status === 'milestone_in_progress' || status === 'under_review';
  const isEditable = !selectedHistoryProject && !isCompleted && !isRejected && !isOngoing;

  if (fetching) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const latestRejected = projectsHistory.length > 0 && projectsHistory[0].status === 'rejected';

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Project Proposal Submission</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Submit project proposal details and track proposal history.</p>
        </div>

        {(isCompleted || isRejected || selectedHistoryProject) && (!isOngoing || selectedHistoryProject) && (
          <button
            onClick={resetFormForNewProject}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4" /> Start New Proposal
          </button>
        )}
      </div>

      {isOngoing && !selectedHistoryProject && (
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Project Proposal Locked:</strong> Your project proposal is currently active ({status}). You cannot edit this proposal or create a new project proposal while an ongoing project exists.
            </span>
          </div>
        </div>
      )}

      {latestRejected && !selectedHistoryProject && !title && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Your previous project proposal was rejected. Please write down and submit a new proposal below.</span>
        </div>
      )}

      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Proposal Form Container */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {selectedHistoryProject ? 'Historical Record (Read-Only)' : status ? 'Active Proposal Status (Read-Only)' : 'New Proposal Form'}
            </span>
            {isCompleted && (
              <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" /> Previous Project Completed
              </span>
            )}
          </div>

          {(selectedHistoryProject || status) && (
            <span
              className={`text-xs font-bold px-3 py-1 rounded-lg uppercase ${
                (selectedHistoryProject ? selectedHistoryProject.status : status) === 'approved' || (selectedHistoryProject ? selectedHistoryProject.status : status) === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : (selectedHistoryProject ? selectedHistoryProject.status : status) === 'rejected'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {selectedHistoryProject ? selectedHistoryProject.status : status}
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Project Title</label>
          <input
            type="text"
            value={selectedHistoryProject ? selectedHistoryProject.title : title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditable}
            placeholder="e.g. AI-Powered Academic Workflow Platform using Distributed Microservices"
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Detailed Project Abstract & Description</label>
          <textarea
            rows={6}
            value={selectedHistoryProject ? selectedHistoryProject.description : description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isEditable}
            placeholder="Write down the problem statement, technical stack, architecture, expected deliverables, and methodology..."
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 leading-relaxed"
          ></textarea>
        </div>

        {/* Direct Action Button */}
        {isEditable && (
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950 flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        )}
      </div>

      {/* PROJECT HISTORY DIRECTORY */}
      {projectsHistory.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> My Proposals History
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectsHistory.map((p) => {
              const isSelected = selectedHistoryProject?._id === p._id;
              const isCurrentActive = !selectedHistoryProject && projectId === p._id;

              return (
                <div
                  key={p._id}
                  onClick={() => viewHistoryProject(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected || isCurrentActive
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/60 border-indigo-500 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{p.title}</h4>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase shrink-0 ${
                        p.status === 'completed' || p.status === 'approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : p.status === 'rejected'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{p.description}</p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                    <span>Supervisor: {p.supervisor ? p.supervisor.name : 'Unassigned'}</span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
