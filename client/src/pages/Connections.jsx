import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserCheck, UserPlus, UserMinus, UserX, Clock, 
  ShieldOff, Check, X, Ban, Search, Filter, AlertCircle, 
  CheckCircle2, MessageSquare, Trash2, Sparkles, ShieldCheck
} from 'lucide-react';

export const Connections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-connections'); // 'my-connections', 'explore', 'pending', 'history'

  // My Connections state
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [connectedLoading, setConnectedLoading] = useState(false);

  // Explore state
  const [exploreUsers, setExploreUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreLoading, setExploreLoading] = useState(false);

  // Pending requests state
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // History & Blocked state
  const [history, setHistory] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Action messages
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingRequests();

    if (activeTab === 'my-connections') fetchMyConnections();
    else if (activeTab === 'explore') fetchExploreUsers();
    else if (activeTab === 'pending') fetchPendingRequests();
    else if (activeTab === 'history') fetchHistoryAndBlocked();
  }, [activeTab, roleFilter]);

  const fetchMyConnections = async () => {
    try {
      setConnectedLoading(true);
      const res = await api.get('/connections/my-connections');
      setConnectedUsers(res.data.data.connections || []);
    } catch (err) {
      console.error('Error fetching my connections:', err);
    } finally {
      setConnectedLoading(false);
    }
  };

  const fetchExploreUsers = async () => {
    try {
      setExploreLoading(true);
      const res = await api.get('/connections/explore', {
        params: {
          role: roleFilter === 'All' ? undefined : roleFilter,
          search: searchQuery.trim() || undefined,
        },
      });
      setExploreUsers(res.data.data.users || []);
    } catch (err) {
      console.error('Error fetching explore users:', err);
    } finally {
      setExploreLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setPendingLoading(true);
      const res = await api.get('/connections/pending');
      setIncoming(res.data.data.incoming || []);
      setOutgoing(res.data.data.outgoing || []);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchHistoryAndBlocked = async () => {
    try {
      setHistoryLoading(true);
      const [histRes, blockedRes] = await Promise.all([
        api.get('/connections/history'),
        api.get('/connections/blocked'),
      ]);
      setHistory(histRes.data.data.history || []);
      setBlockedUsers(blockedRes.data.data.blockedUsers || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSendRequest = async (recipientId) => {
    setMsg('');
    setError('');
    try {
      const res = await api.post('/connections/request', { recipientId });
      setMsg(res.data.message || 'Connection request sent');
      fetchExploreUsers();
      fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send connection request');
    }
  };

  const handleRespond = async (connectionId, action) => {
    setMsg('');
    setError('');
    try {
      const res = await api.put(`/connections/respond/${connectionId}`, { action });
      setMsg(res.data.message || `Connection ${action}ed`);
      fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    }
  };

  const handleRemoveConnection = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to delete your connection with ${targetName || 'this user'}? You will no longer be able to direct message until re-connected.`)) return;
    setMsg('');
    setError('');
    try {
      await api.delete(`/connections/remove/${targetUserId}`);
      setMsg(`Connection with ${targetName || 'user'} removed successfully.`);
      if (activeTab === 'my-connections') fetchMyConnections();
      else if (activeTab === 'explore') fetchExploreUsers();
      else if (activeTab === 'history') fetchHistoryAndBlocked();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete connection');
    }
  };

  const handleCancelOutgoingRequest = async (recipientId, recipientName) => {
    if (!window.confirm(`Cancel your pending connection request to ${recipientName || 'this user'}?`)) return;
    setMsg('');
    setError('');
    try {
      await api.delete(`/connections/remove/${recipientId}`);
      setMsg(`Connection request to ${recipientName || 'user'} has been cancelled.`);
      fetchPendingRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel connection request');
    }
  };

  const handleBlockUser = async (connectionId, targetUserId) => {
    if (!window.confirm('Are you sure you want to block this user? They will not be able to connect or message you.')) return;
    setMsg('');
    setError('');
    try {
      if (connectionId) {
        await api.put(`/connections/respond/${connectionId}`, { action: 'block' });
      } else {
        const reqRes = await api.post('/connections/request', { recipientId: targetUserId });
        if (reqRes.data.data.connection?._id) {
          await api.put(`/connections/respond/${reqRes.data.data.connection._id}`, { action: 'block' });
        }
      }
      setMsg('User blocked successfully');
      if (activeTab === 'my-connections') fetchMyConnections();
      else if (activeTab === 'explore') fetchExploreUsers();
      else if (activeTab === 'pending') fetchPendingRequests();
      else fetchHistoryAndBlocked();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblock = async (targetUserId) => {
    setMsg('');
    setError('');
    try {
      await api.put(`/connections/unblock/${targetUserId}`);
      setMsg('User unblocked successfully');
      fetchHistoryAndBlocked();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Users className="w-3.5 h-3.5 text-indigo-300" /> Academic Peer Network
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Connections & Directory</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Connect with academic peers, faculty supervisors, and collaborators across departments.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <MessageSquare className="w-4 h-4" /> Open Direct Chat
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{msg}</span>
          </div>
          <button onClick={() => setMsg('')} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('my-connections')}
          className={`px-5 py-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'my-connections'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" /> My Connections
          {connectedUsers.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-black">
              {connectedUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('explore')}
          className={`px-5 py-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'explore'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" /> Explore Network
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" /> Pending Requests
          {incoming.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-black animate-pulse">
              {incoming.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldOff className="w-4 h-4" /> History & Blocked
        </button>
      </div>

      {/* TAB 1: MY CONNECTIONS */}
      {activeTab === 'my-connections' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" /> Active Peers ({connectedUsers.length})
            </h2>
          </div>

          {connectedLoading ? (
            <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : connectedUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-3 shadow-sm">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No active connections yet</h3>
              <p className="text-xs max-w-sm mx-auto">Explore the peer network to send connection requests to students and faculty supervisors.</p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-2xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-md"
              >
                <Search className="w-4 h-4" /> Explore Network
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedUsers.map((u) => (
                <div
                  key={u._id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm border border-indigo-400 overflow-hidden shrink-0 shadow-md">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name ? u.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{u.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-extrabold uppercase tracking-wider">
                          {u.role} &bull; {u.department || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate('/chat')}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
                    >
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>

                    <button
                      onClick={() => handleRemoveConnection(u._id, u.name)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition-all border border-slate-200 dark:border-slate-800"
                      title="Delete Connection"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPLORE NETWORK */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Controls: Role Filter & Search */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchExploreUsers()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-1.5 shrink-0">
              {['All', 'Student', 'Teacher', 'Admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all border ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Explore Users Grid */}
          {exploreLoading ? (
            <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : exploreUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
              No users found matching criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {exploreUsers.map((u) => (
                <div
                  key={u._id}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm border border-indigo-400 overflow-hidden shrink-0 shadow-md">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name ? u.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{u.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-extrabold uppercase">
                        {u.role} &bull; {u.department || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {u.connectionStatus === 'accepted' ? (
                      <span className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Connected
                      </span>
                    ) : u.connectionStatus === 'pending' ? (
                      <span className="px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-2xl flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Request Pending
                      </span>
                    ) : u.connectionStatus === 'blocked' ? (
                      <span className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-1.5">
                        <Ban className="w-4 h-4" /> Blocked
                      </span>
                    ) : u.cooldownDaysRemaining > 0 ? (
                      <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-2xl border border-rose-200 dark:border-rose-900">
                        Cooldown: {u.cooldownDaysRemaining} day(s)
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(u._id)}
                        className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
                      >
                        <UserPlus className="w-4 h-4" /> Connect
                      </button>
                    )}

                    <button
                      onClick={() => handleBlockUser(u.connectionId, u._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-2xl transition-all"
                      title="Block User"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div className="space-y-8">
          {/* Incoming Requests */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" /> Incoming Connection Requests ({incoming.length})
              </h2>
            </div>

            {incoming.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
                No incoming pending connection requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {incoming.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-indigo-600"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm overflow-hidden shrink-0 shadow-md">
                        {req.requester?.avatar ? (
                          <img src={req.requester.avatar} alt={req.requester.name} className="w-full h-full object-cover" />
                        ) : (
                          req.requester?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {req.requester?.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {req.requester?.role} &bull; {req.requester?.department || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRespond(req._id, 'accept')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Check className="w-4 h-4" /> Accept
                      </button>
                      <button
                        onClick={() => handleRespond(req._id, 'reject')}
                        className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-2xl border border-rose-200 dark:border-rose-900 transition-all flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-500" /> Outgoing Sent Requests ({outgoing.length})
              </h2>
            </div>

            {outgoing.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
                No outgoing pending requests.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {outgoing.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {req.recipient?.avatar ? (
                          <img src={req.recipient.avatar} alt={req.recipient.name} className="w-full h-full object-cover" />
                        ) : (
                          req.recipient?.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{req.recipient?.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{req.recipient?.role} &bull; Sent {new Date(req.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelOutgoingRequest(req.recipient._id || req.recipient, req.recipient?.name)}
                      className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-xs rounded-2xl transition-all flex items-center gap-1.5"
                    >
                      <UserX className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HISTORY & BLOCKED USERS */}
      {activeTab === 'history' && (
        <div className="space-y-8">
          {/* Connection Request History */}
          <div className="space-y-4">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Connection Requests History Logs
            </h2>

            {history.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
                No past connection history recorded.
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => {
                  const isRequester = item.requester?._id === user._id;
                  const partner = isRequester ? item.recipient : item.requester;

                  return (
                    <div key={item._id} className="p-5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md">
                          {partner?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{partner?.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {isRequester ? 'Sent by you' : 'Received by you'} &bull; {new Date(item.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        {item.status === 'accepted' ? (
                          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold rounded-full">
                            Connected
                          </span>
                        ) : item.status === 'rejected' ? (
                          <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-extrabold rounded-full">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blocked Users Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-500" /> Blocked Users Directory ({blockedUsers.length})
            </h2>

            {blockedUsers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs shadow-sm">
                No blocked users in your block list.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blockedUsers.map((bUser) => (
                  <div
                    key={bUser._id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {bUser.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{bUser.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{bUser.role} &bull; {bUser.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnblock(bUser._id)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
