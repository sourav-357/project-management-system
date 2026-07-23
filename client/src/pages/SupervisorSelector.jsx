import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  UserCheck, Send, CheckCircle2, AlertCircle, Search, 
  Filter, Lock, Clock, Sparkles, User, ShieldCheck 
} from 'lucide-react';

export const SupervisorSelector = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [mySupervisor, setMySupervisor] = useState(null);
  const [project, setProject] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supListRes, mySupRes, projectRes, pendingRes] = await Promise.all([
        api.get('/student/fetch-supervisors'),
        api.get('/student/supervisor'),
        api.get('/student/project'),
        api.get('/student/pending-supervisor-request'),
      ]);
      setSupervisors(supListRes.data.data.supervisors || []);
      setMySupervisor(mySupRes.data.data.supervisor || null);
      setProject(projectRes.data.data.project || null);
      setPendingRequest(pendingRes.data.data.pendingRequest || null);
    } catch (err) {
      console.error('Error loading supervisor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    if (mySupervisor) {
      setErrorMsg('You already have an active supervisor assigned to your project.');
      setSelectedTeacher(null);
      return;
    }

    if (pendingRequest) {
      setErrorMsg(`You already have a pending supervisor request sent to Prof. ${pendingRequest.supervisor?.name}. Please wait for them to respond.`);
      setSelectedTeacher(null);
      return;
    }

    if (!project) {
      setErrorMsg('You must submit a project proposal first before requesting a supervisor.');
      setSelectedTeacher(null);
      return;
    }

    if (project.status !== 'approved' && project.status !== 'assigned' && project.status !== 'milestone_in_progress') {
      setErrorMsg(`Your project proposal is in status '${project.status}'. You can only request a supervisor once your proposal is approved.`);
      setSelectedTeacher(null);
      return;
    }

    setSubmitting(true);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const res = await api.post('/student/supervisor-request', {
        teacherId: selectedTeacher._id,
        message: messageText || 'Requesting supervisor assignment for my project.',
      });
      setStatusMsg(res.data.message);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit supervisor request');
    } finally {
      setSelectedTeacher(null);
      setMessageText('');
      setSubmitting(false);
    }
  };

  // Filtered Supervisors
  const filteredSupervisors = supervisors.filter((t) => {
    const matchesSearch =
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.expertise && t.expertise.some((e) => e.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesAvailability = availableOnly ? t.isAvailable : true;

    return matchesSearch && matchesAvailability;
  });

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Faculty Directory...</p>
      </div>
    );
  }

  const projectStatus = project?.status;
  const hasProject = !!project;
  const isApproved = projectStatus === 'approved' || projectStatus === 'assigned' || projectStatus === 'milestone_in_progress';
  const hasSupervisor = !!mySupervisor || !!project?.supervisor;
  const hasPendingRequest = !!pendingRequest;
  const canRequestSupervisor = hasProject && isApproved && !hasSupervisor && !hasPendingRequest;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <UserCheck className="w-3.5 h-3.5 text-indigo-300" /> Faculty Selection & Supervision
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Supervisor Selector</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Search faculty expertise, verify available capacity slots, and request project guidance from academic supervisors.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* DYNAMIC ELIGIBILITY / STATUS REASON BANNERS */}
      {hasSupervisor ? (
        <div className="p-6 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-md">
              {mySupervisor ? mySupervisor.name.charAt(0) : 'S'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Active Supervisor: {mySupervisor ? mySupervisor.name : 'Faculty Member'}
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                Supervision is active ({mySupervisor?.email || ''}). Once your project is completed, supervision is released and you can request a new supervisor for a new project.
              </p>
            </div>
          </div>
          <span className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-2xl shrink-0 self-start sm:self-auto shadow-sm">
            Supervisor Assigned
          </span>
        </div>
      ) : hasPendingRequest ? (
        <div className="p-6 bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-md">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Request Pending: Prof. {pendingRequest.supervisor?.name}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Your supervision request sent to Prof. {pendingRequest.supervisor?.name} is under review.
              </p>
            </div>
          </div>
          <span className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-2xl shrink-0 self-start sm:self-auto shadow-sm">
            Pending Review
          </span>
        </div>
      ) : !hasProject ? (
        <div className="p-5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3.5 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">No Active Project Proposal</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              You must submit a project proposal before requesting a faculty supervisor.
            </p>
          </div>
        </div>
      ) : !isApproved ? (
        <div className="p-5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-3xl text-blue-900 dark:text-blue-200 text-xs flex items-center gap-3.5 shadow-sm">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">Proposal Under Review (Status: {projectStatus})</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Supervisors can be requested once your proposal is approved by faculty or admin.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">Proposal Approved & Eligible for Supervision!</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
              Your proposal "{project?.title}" is approved! Select an available supervisor below.
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by faculty name, department, or expertise tag..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          Show Available Capacity Only
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSupervisors.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
            No faculty members match your search terms.
          </div>
        ) : (
          filteredSupervisors.map((t) => (
            <div key={t._id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md">
                      {t.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.department || 'Computer Science'}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      t.isAvailable
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {t.assignedCount || 0} / {t.maxStudents || 10} Slots
                  </span>
                </div>

                {t.expertise && t.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.expertise.map((exp, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-xl font-semibold">
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ACTION BUTTON WITH CLEAR STATUS REASON BADGE */}
              {hasSupervisor ? (
                <button
                  disabled
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  Supervisor Already Assigned
                </button>
              ) : hasPendingRequest ? (
                <button
                  disabled
                  className="w-full py-3 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-2xl cursor-not-allowed border border-amber-200 dark:border-amber-800"
                >
                  Request Pending Review
                </button>
              ) : !hasProject ? (
                <button
                  disabled
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  Submit Proposal First
                </button>
              ) : !isApproved ? (
                <button
                  disabled
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-2xl cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  Proposal Pending Approval
                </button>
              ) : (
                <button
                  disabled={!t.isAvailable}
                  onClick={() => setSelectedTeacher(t)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-40"
                >
                  {t.isAvailable ? 'Request Supervision' : 'Capacity Full'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal for sending request */}
      {selectedTeacher && canRequestSupervisor && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Request Supervisor: {selectedTeacher.name}</h3>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write a brief note introducing your project topic to the professor..."
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendRequest}
                disabled={submitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
