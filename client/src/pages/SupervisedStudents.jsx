import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, FileText, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export const SupervisedStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feedback Modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fbTitle, setFbTitle] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [fbType, setFbType] = useState('general');
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenFeedback = (st) => {
    setSelectedStudent(st);
    setFbTitle('');
    setFbMessage('');
    setFbType('general');
    setMsg('');
    setError('');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStudent.project?._id || !fbTitle.trim() || !fbMessage.trim()) return;

    setSubmitting(true);
    setMsg('');
    setError('');

    try {
      const res = await api.post(`/teacher/projects/${selectedStudent.project._id}/feedback`, {
        title: fbTitle.trim(),
        message: fbMessage.trim(),
        type: fbType,
      });
      setMsg(res.data.message || 'Feedback sent successfully');
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-xl font-extrabold text-slate-900">Supervised Students Directory</h1>
        <p className="text-xs text-slate-500 mt-1">List of students currently assigned under your supervision.</p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {students.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No students assigned yet
          </div>
        ) : (
          students.map((st) => (
            <div key={st._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    {st.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{st.name}</h3>
                    <p className="text-[11px] text-slate-500">{st.email}</p>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {st.project && (
                    <button
                      onClick={() => handleOpenFeedback(st)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
                      title="Send Feedback"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Feedback
                    </button>
                  )}
                  <button
                    onClick={() => handleDropSupervision(st._id, st.name)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors text-xs font-semibold"
                    title="Resign / Drop Supervision"
                  >
                    Drop
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Project</p>
                <p className="text-xs font-semibold text-slate-800">{st.project?.title || 'Proposal Pending'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Structured Feedback Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Send Structured Feedback</h3>
            <p className="text-xs text-slate-500">Student: <strong>{selectedStudent.name}</strong></p>

            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Feedback Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {['general', 'positive', 'constructive'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFbType(t)}
                      className={`py-1.5 text-xs font-semibold rounded-lg capitalize border ${
                        fbType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Feedback Title</label>
                <input
                  type="text"
                  required
                  value={fbTitle}
                  onChange={(e) => setFbTitle(e.target.value)}
                  placeholder="e.g. Implementation Phase 1 Guidance"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Detailed Message / Suggestions</label>
                <textarea
                  required
                  rows={4}
                  value={fbMessage}
                  onChange={(e) => setFbMessage(e.target.value)}
                  placeholder="Write clear, actionable feedback for the student..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 bg-slate-100 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
