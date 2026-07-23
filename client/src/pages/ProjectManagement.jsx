import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  FolderKanban, Check, X, UserCheck, AlertCircle, CheckCircle2, 
  UserPlus, Search, Download, Filter, Lock, Sparkles, ShieldCheck 
} from 'lucide-react';

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
    if (proj.status === 'completed') return;
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
    if (proj.status === 'completed') return;
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
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading project records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <FolderKanban className="w-3.5 h-3.5" /> Governance & Project Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Project Management</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Global governance of student project proposals, faculty supervisor allocations, and historical completion records.
            </p>
          </div>

          <button
            onClick={exportProjectsToCSV}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-2xl border border-white/20 flex items-center gap-2 transition-all shrink-0 self-start md:self-auto backdrop-blur-md"
          >
            <Download className="w-4 h-4 text-indigo-300" /> Export CSV Report
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, student name, or supervisor..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Filter className="w-4 h-4" /> Filter Status:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
            No projects match search criteria.
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const isCompleted = proj.status === 'completed';

            return (
              <div 
                key={proj._id} 
                className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border ${
                  isCompleted
                    ? 'border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-white via-slate-50/20 to-indigo-50/10 dark:from-slate-900 dark:to-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                } shadow-sm transition-all duration-200 space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{proj.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Student: <strong className="text-slate-700 dark:text-slate-300">{proj.student?.name}</strong> ({proj.student?.email})</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                        <UserCheck className="w-3.5 h-3.5" /> Supervisor: {proj.supervisor ? proj.supervisor.name : <span className="text-amber-600 font-normal">Unassigned</span>}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider self-start sm:self-auto ${
                      proj.status === 'approved' || proj.status === 'assigned'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : proj.status === 'completed'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : proj.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {isCompleted && <Lock className="w-3 h-3" />}
                    {proj.status}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {proj.description}
                </div>

                {isCompleted ? (
                  <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>Completed Project Archive &bull; Immutable Read-Only Record</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-full">Finalized</span>
                  </div>
                ) : (
                  /* Actions Bar */
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenAssignModal(proj)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-2xl flex items-center gap-2 transition-all active:scale-95"
                    >
                      <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {proj.supervisor ? 'Reassign Supervisor' : 'Assign Supervisor'}
                    </button>

                    {['submitted', 'pending', 'under_review', 'draft'].includes(proj.status) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenReviewModal(proj, 'rejected')}
                          className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold text-xs rounded-2xl hover:bg-rose-100 flex items-center gap-1.5 transition-all"
                        >
                          <X className="w-4 h-4" /> Reject Override
                        </button>
                        <button
                          onClick={() => handleOpenReviewModal(proj, 'approved')}
                          className="px-4 py-2 bg-emerald-600 text-white font-semibold text-xs rounded-2xl hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-4 h-4" /> Approve Override
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Override Modal */}
      {reviewModalProj && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Admin Proposal Override ({reviewStatus.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Project: {reviewModalProj.title}</p>

            <form onSubmit={submitReviewOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Feedback & Override Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Provide explicit review feedback for student..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalProj(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-2xl shadow-md transition-all ${
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Assign Project Supervisor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Project: {assignModalProj.title}</p>

            <form onSubmit={submitSupervisorAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select Faculty Supervisor</label>
                <select
                  required
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.department || 'No Dept'}) - {t.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalProj(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md">
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
