import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FolderKanban, Check, X, UserCheck, AlertCircle, CheckCircle2, MessageSquare, UserPlus, Search, Download, Filter } from 'lucide-react';

export const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Review Override modal state
  const [reviewModalProj, setReviewModalProj] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Assign Supervisor modal state
  const [assignModalProj, setAssignModalProj] = useState(null);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, usersRes] = await Promise.all([
        api.get('/admin/projects'),
        api.get('/admin/getAllUsers?role=Teacher'),
      ]);
      setProjects(projRes.data.data.projects || []);
      setTeachers(usersRes.data.data.users || []);
    } catch (err) {
      console.error('Error fetching admin projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (proj, status) => {
    setReviewModalProj(proj);
    setReviewStatus(status);
    setReviewRemarks(`Proposal ${status} by System Administrator`);
  };

  const submitReviewOverride = async (e) => {
    e.preventDefault();
    if (!reviewModalProj) return;

    setMsg('');
    setError('');

    try {
      const res = await api.put(`/admin/projects/${reviewModalProj._id}/review`, {
        status: reviewStatus,
        remarks: reviewRemarks,
      });
      setMsg(res.data.message);
      setReviewModalProj(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update proposal status');
    }
  };

  const handleOpenAssignModal = (proj) => {
    setAssignModalProj(proj);
    setSelectedSupervisorId(proj.supervisor?._id || '');
  };

  const submitSupervisorAssignment = async (e) => {
    e.preventDefault();
    if (!assignModalProj || !selectedSupervisorId) return;

    setMsg('');
    setError('');

    try {
      const res = await api.post('/admin/assign-supervisor', {
        projectId: assignModalProj._id,
        supervisorId: selectedSupervisorId,
      });
      setMsg(res.data.message || 'Supervisor assigned successfully');
      setAssignModalProj(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign supervisor');
    }
  };

  // CSV Export Engine
  const exportProjectsToCSV = () => {
    if (projects.length === 0) return;
    const headers = ['Project Title,Student,Supervisor,Status,Created At'];
    const rows = filteredProjects.map((p) =>
      `"${p.title}","${p.student?.name || 'Unknown'}","${p.supervisor?.name || 'Unassigned'}","${p.status}","${new Date(p.createdAt).toLocaleDateString()}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `projects_governance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Filtered Projects List
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supervisor?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Platform Projects Governance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Global oversight of student proposals, supervisor assignments, and administrative override controls.</p>
        </div>

        <button
          onClick={exportProjectsToCSV}
          className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          title="Export CSV Report"
        >
          <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Export CSV
        </button>
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

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, student, supervisor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" /> Status:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            No projects match search criteria
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <div key={proj._id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{proj.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Student: <strong>{proj.student?.name}</strong> ({proj.student?.email})
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    Supervisor: {proj.supervisor ? proj.supervisor.name : <span className="text-amber-600 font-normal">Unassigned</span>}
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-lg uppercase ${
                    proj.status === 'approved'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : proj.status === 'rejected'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {proj.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300">{proj.description}</div>

              {/* Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenAssignModal(proj)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  {proj.supervisor ? 'Reassign Supervisor' : 'Assign Supervisor'}
                </button>

                {['submitted', 'pending', 'under_review', 'draft'].includes(proj.status) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenReviewModal(proj, 'rejected')}
                      className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-xs rounded-xl hover:bg-rose-100 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject Override
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(proj, 'approved')}
                      className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Override
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Override Modal */}
      {reviewModalProj && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Admin Proposal Review ({reviewStatus.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Project: {reviewModalProj.title}</p>

            <form onSubmit={submitReviewOverride} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Feedback & Override Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Provide explicit review feedback for student..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalProj(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-xl ${
                    reviewStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {reviewStatus}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Supervisor Modal */}
      {assignModalProj && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Assign Project Supervisor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Project: {assignModalProj.title}</p>

            <form onSubmit={submitSupervisorAssignment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Select Supervisor (Teacher)</label>
                <select
                  required
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.department || 'No Dept'}) - {t.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalProj(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
                  Assign Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
