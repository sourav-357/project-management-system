import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserCheck, CheckCircle2, AlertCircle, Check, X, History } from 'lucide-react';

export const TeacherRequests = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/requests');
      setRequests(res.data.data.requests || []);
    } catch (err) {
      console.error('Error fetching supervision requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, action) => {
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.post(`/teacher/requests/${requestId}/respond`, { action });
      setActionMsg(res.data.message || `Request ${action}ed successfully.`);
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to process request.');
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const historyRequests = requests.filter((r) => r.status !== 'pending');

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Supervision Applications</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Supervision Requests Inbox</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Review and evaluate student supervision applications.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Pending ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'history' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            History ({historyRequests.length})
          </button>
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        {activeTab === 'pending' ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No pending supervision requests.</div>
            ) : (
              pendingRequests.map((req) => (
                <div key={req._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 overflow-hidden shrink-0">
                      {req.student?.avatar ? (
                        <img src={req.student.avatar} alt={req.student.name} className="w-full h-full object-cover" />
                      ) : (
                        req.student?.name?.charAt(0) || 'S'
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-200">{req.student?.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">({req.student?.email})</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 italic">"{req.message || req.notes || 'No message provided'}"</p>
                      <p className="text-[10px] text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResponse(req._id, 'accept')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleResponse(req._id, 'reject')}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {historyRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No supervision request history.</div>
            ) : (
              historyRequests.map((req) => (
                <div key={req._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{req.student?.name}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">"{req.message || req.notes || 'No notes'}"</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${req.status === 'approved' || req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                    {req.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
