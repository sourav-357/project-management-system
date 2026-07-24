import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, MessageSquare, UserMinus, CheckCircle2, AlertCircle, Award, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SupervisedStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [historyStudents, setHistoryStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [stRes, projRes] = await Promise.all([
        api.get('/teacher/students'),
        api.get('/teacher/projects'),
      ]);

      setStudents(stRes.data.data.students || []);

      const allProjects = projRes.data.data.projects || [];
      const completedProjects = allProjects.filter((p) => p.status === 'completed');

      const completedStudents = completedProjects.map((p) => ({
        _id: p.student?._id || p._id,
        name: p.student?.name || 'Completed Student',
        email: p.student?.email || '',
        department: p.student?.department || 'CS',
        projectTitle: p.title,
        completedAt: p.updatedAt,
      }));

      setHistoryStudents(completedStudents);
    } catch (err) {
      console.error('Error fetching supervised students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDropStudent = async (studentId, name) => {
    if (!window.confirm(`Drop supervision for ${name}?`)) return;
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.put(`/teacher/students/${studentId}/drop`);
      setActionMsg(res.data.message || `Dropped supervision for ${name}`);
      fetchStudents();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to drop supervision.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Supervision Directory</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Supervised Students</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">View active supervised students and completed project supervision history.</p>
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

      {/* Active Supervisees */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Active Supervisees ({students.length})</h3>

        {students.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No students currently assigned under active supervision.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {students.map((st) => (
              <div key={st._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 overflow-hidden shrink-0">
                    {st.avatar ? (
                      <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                    ) : (
                      st.name?.charAt(0) || 'S'
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-200">{st.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{st.email} &bull; {st.department || 'Computer Science'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/chat')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </button>
                  <button
                    onClick={() => handleDropStudent(st._id, st.name)}
                    className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl font-semibold flex items-center gap-1"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Drop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Supervisee History */}
      {historyStudents.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Completed Supervisions History ({historyStudents.length})
          </h3>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {historyStudents.map((st, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-200">{st.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Project: <b>{st.projectTitle}</b></p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Completed & Archived
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
