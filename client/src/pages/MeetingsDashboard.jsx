import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Video, Plus, Users, CheckCircle2, AlertCircle, Play, Trash2
} from 'lucide-react';

export const MeetingsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
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
    fetchActiveMeetings();
  }, []);

  const fetchActiveMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/meetings');
      setMeetings(res.data.data.meetings || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndMeeting = async (meetingId, meetingTitle) => {
    if (!window.confirm(`End meeting "${meetingTitle}" for all participants?`)) return;
    try {
      await api.put(`/meetings/${meetingId}/end`);
      setMsg(`Meeting "${meetingTitle}" ended successfully.`);
      fetchActiveMeetings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to end meeting');
    }
  };

  const handleDeleteMeeting = async (meetingId, meetingTitle) => {
    if (!window.confirm(`Delete meeting "${meetingTitle}"? This will remove notifications for all invited users.`)) return;
    try {
      await api.delete(`/meetings/${meetingId}`);
      setMsg(`Meeting "${meetingTitle}" deleted.`);
      fetchActiveMeetings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete meeting');
    }
  };

  const openHostModal = async () => {
    setShowHostModal(true);
    setTitle('');
    setDescription('');
    setSelectedInvitees([]);
    setError('');
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
        invitees: selectedInvitees,
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Video className="w-3.5 h-3.5 text-indigo-300" /> Instant Video Conference
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Meetings Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Start instant video meetings, invite students or faculty members, and join active conference rooms.
            </p>
          </div>

          {isHostRole && (
            <button
              onClick={openHostModal}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Start Meeting
            </button>
          )}
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

      {/* ACTIVE & INVITED MEETINGS SECTION */}
      <div className="space-y-6">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Video className="w-4 h-4 text-indigo-500" /> Active & Invited Meetings ({meetings.length})
        </h2>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Active Meetings...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
            No active meetings found. {isHostRole && 'Click "Start Meeting" above to host a new call.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meetings.map((m) => (
              <div
                key={m._id}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{m.title}</h3>
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold rounded-full flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Call
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{m.description}</p>
                  )}
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1 font-medium">
                    <span>Host: <strong className="text-slate-700 dark:text-slate-300">{m.host?.name}</strong> ({m.host?.role})</span>
                    <span>&bull;</span>
                    <span>{m.invitedUsers?.length || 0} Invited</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Started: {new Date(m.startedAt || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {(m.host?._id === user._id || isHostRole) && (
                      <>
                        <button
                          onClick={() => handleEndMeeting(m._id, m.title)}
                          className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl transition-all border border-rose-200 dark:border-rose-900"
                          title="End Meeting for All"
                        >
                          End
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(m._id, m.title)}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl transition-all"
                          title="Delete Meeting"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigate(`/meetings/${m._id}`)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current" /> Join Room
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SIMPLE START MEETING MODAL */}
      {showHostModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Start Meeting</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enter a title and select people to invite to the video call.</p>

            <form onSubmit={handleStartMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Project Review Session"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short discussion note or agenda..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Invitees Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Invite People</label>
                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 space-y-1 bg-slate-50/50 dark:bg-slate-950/40">
                  {availableUsers.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">No other users available</p>
                  ) : (
                    availableUsers.map((u) => (
                      <label key={u._id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedInvitees.includes(u._id)}
                          onChange={() => toggleInvitee(u._id)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({u.role} &bull; {u.department || 'General'})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHostModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Starting...' : 'Start Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
