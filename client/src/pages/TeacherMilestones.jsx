import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CheckSquare, Check, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const TeacherMilestones = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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
      console.error('Error loading projects for milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneStatus = async (projectId, milestoneId, status) => {
    setMsg('');
    setError('');

    try {
      const res = await api.put(`/teacher/projects/${projectId}/milestones/${milestoneId}`, {
        status,
        teacherFeedback: `Milestone marked as ${status} by supervisor`,
      });
      setMsg(res.data.message);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update milestone status');
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Student Milestone Submissions</h1>
        <p className="text-xs text-slate-500 mt-1">Review deliverable submissions and update milestone completion statuses.</p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {projects.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No projects available
          </div>
        ) : (
          projects.map((proj) => (
            <div key={proj._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">{proj.title}</h3>
                <p className="text-xs text-slate-500">Student: {proj.student?.name}</p>
              </div>

              <div className="space-y-3">
                {proj.milestones && proj.milestones.length > 0 ? (
                  proj.milestones.map((m) => (
                    <div key={m._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{m.title}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${m.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.status === 'submitted'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                        {m.submissionUrl && (
                          <a
                            href={m.submissionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 font-semibold hover:underline mt-1 block"
                          >
                            View Deliverable Submission &rarr;
                          </a>
                        )}
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {m.status === 'approved' ? (
                          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-lg flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Approved ✓
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleMilestoneStatus(proj._id, m._id, 'rejected')}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 font-semibold text-xs rounded-lg hover:bg-rose-100 flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleMilestoneStatus(proj._id, m._id, 'approved')}
                              className="px-3.5 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center">No milestones created yet</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
