import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Video, Plus, Users, Clock, History, Calendar, CheckCircle2, AlertCircle, Play, Trash2, PhoneMissed, Check
} from 'lucide-react';

export const MeetingsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [historySubTab, setHistorySubTab] = useState('All'); // 'All' | 'Attended' | 'Missed'

  const [meetings, setMeetings] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Host modal state
  const [showHostModal, setShowHostModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const isHostRole = user?.role === 'Teacher' || user?.role === 'Admin';

  useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'active') {
        const res = await api.get('/meetings');
        setMeetings(res.data.data.meetings || []);
      } else {
        const res = await api.get('/meetings/history');
        setHistory(res.data.data.history || []);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeetingHistory = async (historyId) => {
    try {
      await api.delete(`/meetings/history/${historyId}`);
      setHistory((prev) => prev.filter((h) => h._id !== historyId));
    } catch (err) {
      alert('Failed to delete meeting record');
    }
  };

  const handleEndMeeting = async (meetingId, meetingTitle) => {
    if (!window.confirm(`End meeting "${meetingTitle}" for all participants?`)) return;
    try {
      await api.put(`/meetings/${meetingId}/end`);
      setMsg(`Meeting "${meetingTitle}" ended and notifications cleared.`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end meeting');
    }
  };

  const handleDeleteMeeting = async (meetingId, meetingTitle) => {
    if (!window.confirm(`Delete meeting "${meetingTitle}"? This will remove notifications for all invited users.`)) return;
    try {
      await api.delete(`/meetings/${meetingId}`);
      setMsg(`Meeting "${meetingTitle}" deleted.`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete meeting');
    }
  };

  const openHostModal = async () => {
    setShowHostModal(true);
    try {
      const res = await api.get('/meetings/available-invitees');
      setAvailableUsers(res.data.data.users || []);
    } catch (err) {
      console.error('Error loading invitees:', err);
    }
  };

  const toggleInvitee = (userId) => {
    if (selectedInvitees.includes(userId)) {
      setSelectedInvitees(selectedInvitees.filter((id) => id !== userId));
    } else {
      setSelectedInvitees([...selectedInvitees, userId]);
    }
  };

  const handleStartMeeting = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setMsg('');
    setError('');

    try {
      const res = await api.post('/meetings', {
        title: title.trim(),
        description: description.trim(),
        invitedUserIds: selectedInvitees,
      });

      const meetingId = res.data.data.meeting._id;
      setShowHostModal(false);
      navigate(`/meetings/${meetingId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (historySubTab === 'Attended') return item.userAttendanceStatus === 'attended';
    if (historySubTab === 'Missed') return item.userAttendanceStatus === 'missed';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
              <Video className="w-3.5 h-3.5" /> Group Video Meetings Engine
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Group Video Meetings Directory</h1>
            <p className="text-xs text-slate-300 mt-1">Host group video conferences, invite users, and view attended & missed meeting records.</p>
          </div>

          {isHostRole && (
            <button
              onClick={openHostModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" /> Start New Video Meeting
            </button>
          )}
        </div>
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

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Video className="w-4 h-4" /> Ongoing & Invited Meetings
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" /> Meeting Logs & History
        </button>
      </div>

      {/* TAB 1: ONGOING & INVITED MEETINGS */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-8 flex items-center justify-center min-h-[300px]">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : meetings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              No active or scheduled meetings. {isHostRole && 'Click "Start New Video Meeting" above to host a call.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {meetings.map((m) => (
                <div
                  key={m._id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{m.title}</h3>
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Meeting
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">{m.description}</p>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1">
                      <span>Host: <strong>{m.host?.name}</strong> ({m.host?.role})</span>
                      <span>&bull;</span>
                      <span>{m.invitedUsers?.length || 0} Invited</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      Started: {new Date(m.startedAt || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(m.host?._id === user._id || isHostRole) && (
                        <>
                          <button
                            onClick={() => handleEndMeeting(m._id, m.title)}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all border border-rose-200 dark:border-rose-900"
                            title="End Meeting for All"
                          >
                            End
                          </button>
                          <button
                            onClick={() => handleDeleteMeeting(m._id, m.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all border border-slate-200 dark:border-slate-800"
                            title="Delete Meeting"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => navigate(`/meetings/${m._id}`)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-200 dark:shadow-indigo-950"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Join Video Meeting
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GROUP MEETING HISTORY WITH MISSED MEETINGS FILTER */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* History Sub-tabs */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl w-fit text-xs">
            {['All', 'Attended', 'Missed'].map((st) => (
              <button
                key={st}
                onClick={() => setHistorySubTab(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  historySubTab === st
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {st} Logs
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center min-h-[300px]">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              No meeting records found for selected filter ({historySubTab}).
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHistory.map((record) => (
                <div key={record._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${record.userAttendanceStatus === 'missed' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'}`}>
                      {record.userAttendanceStatus === 'missed' ? <PhoneMissed className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {record.title}
                        {record.userAttendanceStatus === 'missed' ? (
                          <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-[9px] rounded-full border border-rose-200 dark:border-rose-800">
                            Missed Meeting
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[9px] rounded-full border border-emerald-200 dark:border-emerald-800">
                            Attended
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Host: {record.host?.name} ({record.host?.role}) &bull; {record.participants?.length || 1} Attendees
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Duration: {Math.round((record.durationSeconds || 0) / 60)} min(s)
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteMeetingHistory(record._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete Meeting Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HOST NEW MEETING MODAL */}
      {showHostModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Host New Video Conference Meeting</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Create a video conference room and select users to invite.</p>

            <form onSubmit={handleStartMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Project Evaluation & Progress Review"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agenda items or discussion notes..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Invitees Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invite Participants</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 space-y-1 bg-slate-50/50 dark:bg-slate-950/40">
                  {availableUsers.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedInvitees.includes(u._id)}
                        onChange={() => toggleInvitee(u._id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                      <span className="text-[10px] text-slate-400">({u.role} &bull; {u.department || 'General'})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHostModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Starting...' : 'Start Video Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
