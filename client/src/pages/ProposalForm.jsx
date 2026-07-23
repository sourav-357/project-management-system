import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  FileText, Send, AlertCircle, CheckCircle2, History, Award, Sparkles, Lock, Clock, PlusCircle
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
    setMessage('');
    setError('');
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
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading proposal workspace...</p>
      </div>
    );
  }

  const latestRejected = projectsHistory.length > 0 && projectsHistory[0].status === 'rejected';
  const latestCompleted = projectsHistory.length > 0 && projectsHistory[0].status === 'completed';

  return (
    <div className="max-w-5xl space-y-6 mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <FileText className="w-3.5 h-3.5" /> Academic Project Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Project Proposal Submission</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Submit your project title and abstract for faculty review. Once completed, projects are archived into history and you can start a new project.
            </p>
          </div>

          {(isCompleted || isRejected || selectedHistoryProject || (!isOngoing && !title)) && (
            <button
              onClick={resetFormForNewProject}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 shrink-0 self-start md:self-auto transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Create New Proposal
            </button>
          )}
        </div>
      </div>

      {isOngoing && !selectedHistoryProject && (
        <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Project Active & Locked:</strong> Your project proposal is currently active (<span className="uppercase font-bold">{status}</span>). Proposals cannot be edited while active.
            </span>
          </div>
        </div>
      )}

      {latestCompleted && !selectedHistoryProject && !title && (
        <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2.5 shadow-sm">
          <Award className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Your previous project has been marked as <strong>Completed</strong>! Supervision has been released and you can submit a brand new proposal below.</span>
        </div>
      )}

      {latestRejected && !selectedHistoryProject && !title && (
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Your previous project proposal was rejected. Fill out the form below to submit a revised proposal.</span>
        </div>
      )}

      {message && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Proposal Form Container */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              {selectedHistoryProject ? 'Historical Proposal Record' : status ? 'Active Project Proposal' : 'New Project Draft'}
            </span>
            {isCompleted && (
              <span className="px-3 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" /> Completed Project
              </span>
            )}
          </div>

          {(selectedHistoryProject || status) && (
            <span
              className={`text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider ${
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
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Project Title</label>
          <input
            type="text"
            value={selectedHistoryProject ? selectedHistoryProject.title : title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditable}
            placeholder="e.g. AI-Driven Academic Collaboration Platform using Microservices Architecture"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">Detailed Project Abstract & Description</label>
          <textarea
            rows={7}
            value={selectedHistoryProject ? selectedHistoryProject.description : description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isEditable}
            placeholder="Describe the problem statement, proposed methodology, tech stack, key deliverables, and project scope..."
            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 leading-relaxed transition-all"
          ></textarea>
        </div>

        {/* Direct Action Button */}
        {isEditable && (
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white font-bold text-xs rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        )}
      </div>

      {/* PROJECT HISTORY DIRECTORY */}
      {projectsHistory.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" /> Proposal History ({projectsHistory.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectsHistory.map((p) => {
              const isSelected = selectedHistoryProject?._id === p._id;
              const isCurrentActive = !selectedHistoryProject && projectId === p._id;

              return (
                <div
                  key={p._id}
                  onClick={() => viewHistoryProject(p)}
                  className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected || isCurrentActive
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{p.title}</h4>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
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

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-semibold text-slate-400">
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
