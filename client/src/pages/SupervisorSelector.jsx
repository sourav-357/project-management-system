import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { UserCheck, CheckCircle2, AlertCircle, Search, Mail, Users, Lock, ShieldCheck, History, Clock, XCircle } from 'lucide-react';

export const SupervisorSelector = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [project, setProject] = useState(null);
  const [studentSupervisor, setStudentSupervisor] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [requestsHistory, setRequestsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [notes, setNotes] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [supRes, projRes, reqRes] = await Promise.all([
        api.get('/student/fetch-supervisors'),
        api.get('/student/project'),
        api.get('/student/pending-supervisor-request'),
      ]);
      setTeachers(supRes.data.data.supervisors || []);
      setProject(projRes.data.data.project);
      setStudentSupervisor(projRes.data.data.user?.supervisor || user?.supervisor);
      setPendingRequest(reqRes.data.data.pendingRequest || null);
      setRequestsHistory(reqRes.data.data.requestsHistory || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setMessage(null);
    setError(null);
    setRequesting(true);

    try {
      const res = await api.post('/student/supervisor-request', {
        teacherId: selectedTeacher._id,
        notes,
      });
      setMessage(res.data.message || 'Supervision request sent successfully!');
      setSelectedTeacher(null);
      setNotes('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send supervision request.');
    } finally {
      setRequesting(false);
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.department && t.department.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Eligibility Rules
  const hasSupervisor = !!studentSupervisor;
  const hasPendingRequest = !!pendingRequest;
  const isProposalApproved = project && (project.status === 'approved' || project.status === 'assigned');
  
  // Can request supervisor ONLY if: no assigned supervisor, NO pending request sent, and project proposal is approved
  const canRequestSupervisor = !hasSupervisor && !hasPendingRequest && isProposalApproved;

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Faculty Selection</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Supervisor Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Select an available faculty member to request supervision for your approved project.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
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

      {/* State Lock Banners */}
      {hasPendingRequest ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <strong className="block font-bold">Pending Supervision Request Active</strong>
            You have already sent a supervision request to <b>Prof. {pendingRequest.supervisor?.name || 'Faculty'}</b> (<span className="uppercase font-bold text-amber-600 dark:text-amber-400">Pending Review</span>). You cannot request another supervisor until this request is accepted or declined.
          </div>
        </div>
      ) : !isProposalApproved && !hasSupervisor ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <Lock className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <strong className="block font-bold">Supervision Locked: Requires Approved Proposal</strong>
            You can only request a faculty supervisor AFTER your project proposal has been <b>APPROVED</b> by faculty or administration. Current proposal status: <span className="font-bold uppercase text-amber-600 dark:text-amber-400">{project?.status || 'No Active Proposal'}</span>.
          </div>
        </div>
      ) : null}

      {/* Teachers Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => {
          const assigned = teacher.assignedStudents?.length || 0;
          const max = teacher.maxStudents || 5;
          const isFull = assigned >= max;

          return (
            <div key={teacher._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-white shrink-0 overflow-hidden">
                    {teacher.avatar ? (
                      <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : (
                      teacher.name?.charAt(0) || 'T'
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{teacher.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{teacher.email}</p>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{teacher.department || 'Computer Science'}</span>
                  </div>
                </div>

                {/* Capacity Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Supervision Capacity</span>
                    <span>{assigned} / {max} Students</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min((assigned / max) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {canRequestSupervisor ? (
                <button
                  disabled={isFull}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40 shadow-sm"
                >
                  {isFull ? 'Capacity Reached' : 'Request Supervision'}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2 bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl opacity-70 cursor-not-allowed"
                >
                  {hasSupervisor ? 'Supervisor Assigned' : hasPendingRequest ? 'Request Pending' : 'Approval Required'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Requests & Supervision History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Supervision Requests & History Log ({requestsHistory.length})
        </h3>

        {requestsHistory.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No supervision requests sent yet.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {requestsHistory.map((reqItem) => (
              <div key={reqItem._id} className="py-4 space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Prof. {reqItem.supervisor?.name || 'Faculty Member'}
                    </p>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      reqItem.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : reqItem.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {reqItem.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(reqItem.createdAt).toLocaleDateString()}</span>
                </div>

                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Message sent: <i>"{reqItem.message || reqItem.notes || 'Requesting supervision'}"</i>
                </p>

                {project && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Associated Project Proposal: <b className="text-slate-800 dark:text-slate-200">{project.title}</b>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Request Supervision from {selectedTeacher.name}</h3>
            <form onSubmit={handleSendRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message / Notes for Faculty</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Introduce yourself and briefly explain why you chose this supervisor..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTeacher(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  {requesting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
