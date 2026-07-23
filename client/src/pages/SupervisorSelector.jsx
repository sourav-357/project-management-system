import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserCheck, Send, CheckCircle2, AlertCircle, Search, Filter, Lock, Clock, Sparkles } from 'lucide-react';

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
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Faculty Supervisor Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Search expertise, verify supervision capacity, and request faculty guidance for your project.</p>
      </div>

      {statusMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* DYNAMIC ELIGIBILITY / STATUS REASON BANNERS */}
      {hasSupervisor ? (
        <div className="p-5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
              {mySupervisor ? mySupervisor.name.charAt(0) : 'S'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Active Supervisor Assigned: {mySupervisor ? mySupervisor.name : 'Faculty Member'}
              </p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                You cannot request any new supervisor because you currently have an active supervisor assigned to your project ({mySupervisor?.email || ''}).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-600 text-white font-semibold text-xs rounded-lg shrink-0 self-start sm:self-auto">
            Supervisor Assigned
          </span>
        </div>
      ) : hasPendingRequest ? (
        <div className="p-5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Supervision Request Pending: Prof. {pendingRequest.supervisor?.name}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                You currently have an active pending supervisor request sent to Prof. {pendingRequest.supervisor?.name} ({pendingRequest.supervisor?.department}). You cannot send a request to another teacher until this request is accepted or declined.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500 text-white font-semibold text-xs rounded-lg shrink-0 self-start sm:self-auto">
            Request Pending Review
          </span>
        </div>
      ) : !hasProject ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="font-bold">No Project Proposal Submitted</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              You must submit a project proposal before you can request a faculty supervisor. Please write and submit your proposal first.
            </p>
          </div>
        </div>
      ) : !isApproved ? (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-900 dark:text-blue-200 text-xs flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="font-bold">Proposal Pending Approval (Status: {projectStatus})</p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
              Your project proposal is currently under evaluation. You can only request a supervisor after your project proposal is approved by faculty or admin.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">Proposal Approved & Eligible for Supervision!</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              Your project proposal "{project?.title}" is approved! Select an available faculty supervisor from the directory below to send a request.
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, dept, or expertise tag (e.g. AI)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          Available Supervisees Only
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSupervisors.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            No faculty members match your search terms
          </div>
        ) : (
          filteredSupervisors.map((t) => (
            <div key={t._id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.department || 'Computer Science'}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                      t.isAvailable
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {t.assignedCount || 0} / {t.maxStudents || 10} Students
                  </span>
                </div>

                {t.expertise && t.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {t.expertise.map((exp, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
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
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  Supervisor Already Assigned
                </button>
              ) : hasPendingRequest ? (
                <button
                  disabled
                  className="w-full py-2 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs rounded-xl cursor-not-allowed border border-amber-200 dark:border-amber-800"
                >
                  Request Pending Review
                </button>
              ) : !hasProject ? (
                <button
                  disabled
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  Submit Proposal First
                </button>
              ) : !isApproved ? (
                <button
                  disabled
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  Proposal Pending Approval
                </button>
              ) : (
                <button
                  disabled={!t.isAvailable}
                  onClick={() => setSelectedTeacher(t)}
                  className="w-full py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Request Supervisor: {selectedTeacher.name}</h3>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write a brief message introducing your project idea to the professor..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendRequest}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700"
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
