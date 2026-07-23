import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, CheckCircle2, AlertCircle, UserMinus } from 'lucide-react';

export const SupervisedStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teacher/students');
      setStudents(res.data.data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDropSupervision = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to resign as supervisor for ${studentName}? The student project will be left unassigned.`)) return;

    setMsg('');
    setError('');

    try {
      const res = await api.post(`/teacher/students/${studentId}/drop`);
      setMsg(res.data.message);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to drop supervision');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Supervised Students Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">List of students currently assigned under your supervision.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {students.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            No active students under supervision
          </div>
        ) : (
          students.map((st) => (
            <div key={st._id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{st.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{st.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDropSupervision(st._id, st.name)}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-400 rounded-xl transition-colors text-xs font-bold flex items-center gap-1 border border-rose-200 dark:border-rose-900"
                  title="Resign / Drop Supervision"
                >
                  <UserMinus className="w-3.5 h-3.5" /> Drop Student
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned Project</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{st.project?.title || 'Proposal Pending'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
