import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserCheck, Send, CheckCircle2, AlertCircle, Search, Filter } from 'lucide-react';

export const SupervisorSelector = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [mySupervisor, setMySupervisor] = useState(null);
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
      const [supListRes, mySupRes] = await Promise.all([
        api.get('/student/fetch-supervisors'),
        api.get('/student/supervisor'),
      ]);
      setSupervisors(supListRes.data.data.supervisors || []);
      setMySupervisor(mySupRes.data.data.supervisor);
    } catch (err) {
      console.error('Error loading supervisor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

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
      setErrorMsg(err.response?.data?.message || 'Failed to send supervisor request.');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Faculty Supervisor Directory</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Search expertise, verify supervision capacity, and request faculty guidance for your FYP.</p>
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

      {mySupervisor && (
        <div className="p-5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
              {mySupervisor.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Assigned Supervisor: {mySupervisor.name}</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300">{mySupervisor.email} &bull; {mySupervisor.department}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-600 text-white font-semibold text-xs rounded-lg">Active</span>
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
                    {t.assignedCount} / {t.maxStudents} Students
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

              {!mySupervisor && (
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
      {selectedTeacher && (
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
