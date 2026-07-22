import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserCheck, Check, X, AlertCircle, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

export const TeacherRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/requests');
      setRequests(res.data.data.requests || []);
    } catch (err) {
      console.error('Failed to load supervisor requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, action) => {
    setActioningId(requestId);
    setMsg('');
    setError('');

    try {
      const res = await api.post(`/teacher/requests/${requestId}/respond`, { action });
      setMsg(res.data.message);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request');
    } finally {
      setActioningId(null);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Supervision Approvals
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Incoming Supervisor Requests</h1>
        <p className="text-xs text-slate-300 mt-1">Review student applications requesting your academic supervision for FYP projects.</p>
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

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            No incoming supervisor requests pending review.
          </div>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center text-sm border border-indigo-200 dark:border-indigo-800">
                    {req.student?.name ? req.student.name.charAt(0) : 'S'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.student?.name || 'Student'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" /> {req.student?.email} &bull; <span className="font-medium text-slate-700 dark:text-slate-300">{req.student?.department || 'General'}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
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
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{req.message}"
                </div>
              )}

              {req.status === 'pending' && (
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    disabled={actioningId === req._id}
                    onClick={() => handleResponse(req._id, 'reject')}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold text-xs rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Decline
                  </button>
                  <button
                    disabled={actioningId === req._id}
                    onClick={() => handleResponse(req._id, 'accept')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Accept Supervision
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
