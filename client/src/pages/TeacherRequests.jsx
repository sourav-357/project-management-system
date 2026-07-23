import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  UserCheck, Check, X, AlertCircle, CheckCircle2, 
  ShieldCheck, Mail, Users, UserPlus, Sparkles 
} from 'lucide-react';

export const TeacherRequests = () => {
  const [requests, setRequests] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('supervision'); // 'supervision' | 'connections'
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const [supRes, connRes] = await Promise.all([
        api.get('/teacher/requests'),
        api.get('/connections/pending'),
      ]);
      setRequests(supRes.data.data.requests || []);
      setConnectionRequests(connRes.data.data.incoming || []);
    } catch (err) {
      console.error('Failed to load incoming requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSupervisorResponse = async (requestId, action) => {
    setActioningId(requestId);
    setMsg('');
    setError('');

    try {
      const res = await api.post(`/teacher/requests/${requestId}/respond`, { action });
      setMsg(res.data.message);
      fetchAllRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process supervision request');
    } finally {
      setActioningId(null);
    }
  };

  const handleConnectionResponse = async (connectionId, action) => {
    setActioningId(connectionId);
    setMsg('');
    setError('');

    try {
      const res = await api.put(`/connections/respond/${connectionId}`, { action });
      setMsg(res.data.message);
      fetchAllRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process connection request');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Request Inbox...</p>
      </div>
    );
  }

  const pendingSupervisorCount = requests.filter(r => r.status === 'pending').length;
  const pendingConnectionCount = connectionRequests.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" /> Faculty Inbox
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Pending Requests</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Review student applications requesting project supervision and incoming peer connection requests.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-fit text-xs font-bold border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('supervision')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'supervision'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Supervision Requests ({pendingSupervisorCount})
        </button>

        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'connections'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Peer Connections ({pendingConnectionCount})
        </button>
      </div>

      {/* SUPERVISION REQUESTS SECTION */}
      {activeTab === 'supervision' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
              No incoming supervisor requests pending review.
            </div>
          ) : (
            requests.map((req) => (
              <div key={req._id} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-md">
                      {req.student?.name ? req.student.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{req.student?.name || 'Student'}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {req.student?.email} &bull; <span className="font-semibold text-slate-700 dark:text-slate-300">{req.student?.department || 'Department'}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      req.status === 'approved'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : req.status === 'rejected'
                        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                {req.message && (
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    "{req.message}"
                  </div>
                )}

                {req.status === 'pending' && (
                  <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      disabled={actioningId === req._id}
                      onClick={() => handleSupervisorResponse(req._id, 'reject')}
                      className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-2xl hover:bg-rose-100 transition-all flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/60"
                    >
                      <X className="w-4 h-4" /> Decline Request
                    </button>
                    <button
                      disabled={actioningId === req._id}
                      onClick={() => handleSupervisorResponse(req._id, 'accept')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Accept Supervision
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* PEER CONNECTION REQUESTS SECTION */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          {connectionRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
              No pending peer connection requests.
            </div>
          ) : (
            connectionRequests.map((conn) => (
              <div key={conn._id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-indigo-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                    {conn.requester?.name ? conn.requester.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{conn.requester?.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{conn.requester?.role || 'User'}</span> &bull; {conn.requester?.department || 'Department'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                  <button
                    disabled={actioningId === conn._id}
                    onClick={() => handleConnectionResponse(conn._id, 'reject')}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-2xl hover:bg-rose-100 transition-all flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/60"
                  >
                    <X className="w-4 h-4" /> Decline
                  </button>
                  <button
                    disabled={actioningId === conn._id}
                    onClick={() => handleConnectionResponse(conn._id, 'accept')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Accept Connection
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
