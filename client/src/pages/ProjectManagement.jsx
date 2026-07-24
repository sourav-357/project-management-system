import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FolderKanban, Search, CheckCircle2, AlertCircle, UserCheck, File, Download, Check, X } from 'lucide-react';

export const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Assign Supervisor Modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  // Admin Review Evaluation Modal
  const [reviewProject, setReviewProject] = useState(null);
  const [overrideStatus, setOverrideStatus] = useState('approved');
  const [remarks, setRemarks] = useState('');

  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjectsData();
  }, [statusFilter]);

  const fetchProjectsData = async () => {
    try {
      setLoading(true);
      const [projRes, teachRes] = await Promise.all([
        api.get('/admin/projects', {
          params: { status: statusFilter === 'All' ? undefined : statusFilter.toLowerCase() },
        }),
        api.get('/admin/getAllUsers', { params: { role: 'Teacher' } }),
      ]);
      setProjects(projRes.data.data.projects || []);
      setTeachers(teachRes.data.data.users || []);
    } catch (err) {
      console.error('Error fetching project board data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSupervisor = async (e) => {
    e.preventDefault();
    if (!selectedProject || !selectedTeacherId) return;

    setActionMsg('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await api.post('/admin/assign-supervisor', {
        projectId: selectedProject._id,
        supervisorId: selectedTeacherId,
      });
      setActionMsg(res.data.message || 'Supervisor assigned successfully.');
      setSelectedProject(null);
      setSelectedTeacherId('');
      fetchProjectsData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to assign supervisor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewAction = async (project, targetStatus) => {
    setReviewProject(project);
    setOverrideStatus(targetStatus);
    setRemarks('');
  };

  const submitReviewOverride = async (e) => {
    e.preventDefault();
    if (!reviewProject) return;

    setActionMsg('');
    setActionError('');
    setSubmitting(true);

    try {
      const res = await api.put(`/admin/projects/${reviewProject._id}/review`, {
        status: overrideStatus,
        remarks,
      });
      setActionMsg(res.data.message || `Project proposal ${overrideStatus} successfully.`);
      setReviewProject(null);
      setRemarks('');
      fetchProjectsData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update proposal status.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.student?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Platform Governance</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Global Projects & Proposals Board</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Approve or reject proposals, assign supervisors, and inspect deliverables.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
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

      {/* Projects Board */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold self-start inline-flex">
          {['All', 'Pending', 'Approved', 'Assigned', 'Completed', 'Rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No project proposals found matching filter.</div>
          ) : (
            filteredProjects.map((item) => {
              const files = item.files || [];

              // Status Toggle Button Logic:
              // - Initial (submitted/pending): Show BOTH Approve and Reject
              // - Approved / Assigned: Show ONLY Reject
              // - Rejected: Show ONLY Approve
              // - Completed: Locked (No buttons)
              const showApproveBtn = item.status === 'submitted' || item.status === 'pending' || item.status === 'rejected';
              const showRejectBtn = item.status === 'submitted' || item.status === 'pending' || item.status === 'approved' || item.status === 'assigned';

              return (
                <div key={item._id} className="py-4 space-y-3 text-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'completed' || item.status === 'approved' || item.status === 'assigned'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : item.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>
                      <div className="flex gap-4 text-[10px] text-slate-500 pt-1">
                        <span>Student: <strong className="text-slate-700 dark:text-slate-300">{item.student?.name}</strong> ({item.student?.email})</span>
                        <span>Supervisor: <strong className="text-indigo-600 dark:text-indigo-400">{item.supervisor ? item.supervisor.name : 'Unassigned'}</strong></span>
                      </div>
                    </div>

                    {/* Admin Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {item.status !== 'completed' && (
                        <>
                          {showApproveBtn && (
                            <button
                              onClick={() => handleReviewAction(item, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          {showRejectBtn && (
                            <button
                              onClick={() => handleReviewAction(item, 'rejected')}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          )}

                          {(!item.supervisor || item.status === 'approved') && (
                            <button
                              onClick={() => setSelectedProject(item)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Assign Supervisor
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project Deliverable Files */}
                  {files.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <File className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Deliverables & Project Documents ({files.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {files.map((file, fIdx) => {
                          const fileUrl = file.fileUrl || file.url || file.path;
                          const fileName = file.originalName || file.filename || file.name || `Document #${fIdx + 1}`;

                          return (
                            <a
                              key={file._id || fIdx}
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                              title={`Download ${fileName}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{fileName}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Admin Assign Supervisor Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Assign Supervisor to: {selectedProject.title}</h3>

            <form onSubmit={handleAssignSupervisor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Select Faculty Member</label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Supervisor --</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.assignedStudents?.length || 0} / {t.maxStudents || 5} Capacity)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedTeacherId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Approve / Reject Proposal Modal */}
      {reviewProject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {overrideStatus === 'approved' ? 'Approve Proposal' : 'Reject Proposal'}: {reviewProject.title}
            </h3>

            <form onSubmit={submitReviewOverride} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Evaluation Remarks / Feedback</label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={`Add feedback for the student regarding this ${overrideStatus} proposal...`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setReviewProject(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-white rounded-lg font-semibold disabled:opacity-50 ${
                    overrideStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submitting ? 'Processing...' : overrideStatus === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
