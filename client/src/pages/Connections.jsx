import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserPlus, Clock, ShieldOff, Check, X, Ban, Search, Filter, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';

export const Connections = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('explore'); // 'explore', 'pending', 'history'

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
    if (activeTab === 'explore') fetchExploreUsers();
    else if (activeTab === 'pending') fetchPendingRequests();
    else if (activeTab === 'history') fetchHistoryAndBlocked();
  }, [activeTab, roleFilter]);

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
      if (activeTab === 'explore') fetchExploreUsers();
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-indigo-200 text-[11px] font-semibold mb-2">
              <Users className="w-3.5 h-3.5" /> Academic Peer Network
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Connections & Network Directory</h1>
            <p className="text-xs text-slate-300 mt-1">Connect with students, supervisors, and admins across the platform.</p>
          </div>
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
          onClick={() => setActiveTab('explore')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'explore'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" /> Explore Network
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" /> Pending Requests
          {incoming.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-extrabold">
              {incoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldOff className="w-4 h-4" /> History & Blocked Users
        </button>
      </div>

      {/* TAB 1: EXPLORE NETWORK */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          {/* Controls: Role Filter & Search */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search users by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchExploreUsers()}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex gap-1.5 shrink-0">
              {['All', 'Student', 'Teacher', 'Admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all border ${
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
            <div className="p-8 flex items-center justify-center min-h-[300px]">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : exploreUsers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              No users found matching criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {exploreUsers.map((u) => (
                <div
                  key={u._id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-sm border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name ? u.name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.name}</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 text-[10px] font-bold">
                        {u.role} &bull; {u.department || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {u.connectionStatus === 'accepted' ? (
                      <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-xl flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Connected
                      </span>
                    ) : u.connectionStatus === 'pending' ? (
                      <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-xl flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Request Pending
                      </span>
                    ) : u.connectionStatus === 'blocked' ? (
                      <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold rounded-xl flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> Blocked
                      </span>
                    ) : u.cooldownDaysRemaining > 0 ? (
                      <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                        Rejected &bull; Re-request in {u.cooldownDaysRemaining} day(s)
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(u._id)}
                        className="px-3.5 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Connect
                      </button>
                    )}

                    <button
                      onClick={() => handleBlockUser(u.connectionId, u._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
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

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === 'pending' && (
        <div className="space-y-8">
          {/* Incoming Requests */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Incoming Connection Requests ({incoming.length})
            </h2>

            {incoming.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                No incoming pending connection requests
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {incoming.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {req.requester?.avatar ? (
                          <img src={req.requester.avatar} alt={req.requester.name} className="w-full h-full object-cover" />
                        ) : (
                          req.requester?.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{req.requester?.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{req.requester?.role} &bull; {req.requester?.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(req._id, 'accept')}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => handleRespond(req._id, 'reject')}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-semibold text-xs rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-500" /> Outgoing Sent Requests ({outgoing.length})
            </h2>

            {outgoing.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                No outgoing pending requests
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {outgoing.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
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

                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-xl">
                      Pending Approval
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY & BLOCKED USERS */}
      {activeTab === 'history' && (
        <div className="space-y-8">
          {/* Connection Request History */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Connection Requests History
            </h2>

            {history.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                No past connection history recorded
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {history.map((item) => {
                  const isRequester = item.requester?._id === user._id;
                  const partner = isRequester ? item.recipient : item.requester;

                  return (
                    <div key={item._id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                          {partner?.avatar ? (
                            <img src={partner.avatar} alt={partner.name} className="w-full h-full object-cover" />
                          ) : (
                            partner?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{partner?.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isRequester ? 'Sent by you' : 'Received by you'} &bull; {new Date(item.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        {item.status === 'accepted' ? (
                          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-xl">
                            Connected
                          </span>
                        ) : item.status === 'rejected' ? (
                          <div className="text-right">
                            <span className="px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold rounded-xl">
                              Rejected
                            </span>
                            {item.cooldownDays > 0 && (
                              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1">
                                Cooldown: {item.cooldownDays} day(s) left
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-xl">
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
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" /> Blocked Users Directory ({blockedUsers.length})
            </h2>

            {blockedUsers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                No blocked users
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blockedUsers.map((bUser) => (
                  <div
                    key={bUser._id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
                        {bUser.avatar ? (
                          <img src={bUser.avatar} alt={bUser.name} className="w-full h-full object-cover" />
                        ) : (
                          bUser.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{bUser.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{bUser.role} &bull; {bUser.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnblock(bUser._id)}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
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
