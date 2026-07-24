import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Check, X, ShieldAlert, Search, MessageSquare, Clock, UserMinus, CheckCircle2, AlertCircle, History, ShieldOff, Sparkles } from 'lucide-react';

export const Connections = () => {
  const navigate = useNavigate();
  const { onlineUsers } = useSocket();

  const [activeTab, setActiveTab] = useState('explore');
  const [connections, setConnections] = useState([]);
  const [exploreUsers, setExploreUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [historyLog, setHistoryLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [search, roleFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    setActionMsg('');
    setActionError('');

    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'All') params.role = roleFilter;

      const [myConnRes, expRes, pendRes, blockRes, histRes] = await Promise.all([
        api.get('/connections/my-connections').catch(() => api.get('/connections/friends').catch(() => ({ data: { data: { connections: [] } } }))),
        api.get('/connections/explore', { params }).catch(() => ({ data: { data: { users: [] } } })),
        api.get('/connections/pending').catch(() => ({ data: { data: { incoming: [], outgoing: [] } } })),
        api.get('/connections/blocked').catch(() => ({ data: { data: { blockedUsers: [] } } })),
        api.get('/connections/history').catch(() => ({ data: { data: { history: [] } } })),
      ]);

      const myConnList = myConnRes.data?.data?.connections || myConnRes.data?.data?.friends || [];
      const expList = expRes.data?.data?.users || [];
      const incList = pendRes.data?.data?.incoming || [];
      const outList = pendRes.data?.data?.outgoing || [];
      const blkList = blockRes.data?.data?.blockedUsers || [];
      const histList = histRes.data?.data?.history || [];

      setConnections(myConnList);
      setExploreUsers(expList);
      setIncomingRequests(incList);
      setOutgoingRequests(outList);
      setBlockedUsers(blkList);
      setHistoryLog(histList);
    } catch (err) {
      console.error('Error loading connections data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (recipientId) => {
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.post('/connections/request', { recipientId });
      setActionMsg(res.data.message || 'Connection request sent successfully');
      fetchAllData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to send connection request');
    }
  };

  const handleRespondRequest = async (connectionId, action) => {
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.put(`/connections/respond/${connectionId}`, { action });
      setActionMsg(res.data.message || `Request ${action}ed`);
      fetchAllData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to respond to request');
    }
  };

  const handleRemoveConnection = async (targetUserId, name) => {
    if (!window.confirm(`Remove connection with ${name}?`)) return;
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.delete(`/connections/remove/${targetUserId}`);
      setActionMsg(res.data.message || `Removed connection with ${name}`);
      fetchAllData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove connection');
    }
  };

  const handleBlockUser = async (targetUserId, name) => {
    if (!window.confirm(`Block ${name}? You will no longer be able to message or connect.`)) return;
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.put(`/connections/block-user/${targetUserId}`);
      setActionMsg(res.data.message || `Blocked ${name}`);
      fetchAllData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (targetUserId, name) => {
    setActionMsg('');
    setActionError('');
    try {
      const res = await api.put(`/connections/unblock/${targetUserId}`);
      setActionMsg(res.data.message || `Unblocked ${name}`);
      fetchAllData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Academic Network</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Connections & Peer Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Discover peers, manage connection requests, block/unblock users, and build collaboration networks.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          {[
            { id: 'explore', label: `Explore Directory (${exploreUsers.length})` },
            { id: 'connections', label: `My Connections (${connections.length})` },
            { id: 'pending', label: `Pending (${incomingRequests.length + outgoingRequests.length})` },
            { id: 'blocked', label: `Blocked (${blockedUsers.length})` },
            { id: 'history', label: 'History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
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

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'explore' ? (
          /* TAB 1: Explore Network Directory */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search users by name, email, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold shrink-0">
                {['All', 'Student', 'Teacher', 'Admin'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      roleFilter === r ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {exploreUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 col-span-full">No users found matching search filters.</div>
              ) : (
                exploreUsers.map((u) => {
                  const isOnline = onlineUsers.has(u._id);

                  return (
                    <div key={u._id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 dark:text-slate-200 text-xs truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                          <span className="inline-block text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{u.role} &bull; {u.department || 'CS'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center pt-1">
                        {u.connectionStatus === 'accepted' ? (
                          <button
                            onClick={() => navigate('/chat')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Message
                          </button>
                        ) : u.connectionStatus === 'pending' ? (
                          <span className="flex-1 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-[11px] font-bold text-center">
                            {u.isRequester ? 'Request Sent' : 'Pending Action'}
                          </span>
                        ) : u.canRequest ? (
                          <button
                            onClick={() => handleSendRequest(u._id)}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Connect
                          </button>
                        ) : (
                          <span className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold rounded-xl text-center">
                            {u.cooldownDaysRemaining > 0 ? `Cooldown (${u.cooldownDaysRemaining}d)` : 'Unavailable'}
                          </span>
                        )}

                        <button
                          onClick={() => handleBlockUser(u._id, u.name)}
                          className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold rounded-xl"
                          title="Block User"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : activeTab === 'connections' ? (
          /* TAB 2: My Connections */
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {connections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                <p>No active connected peers yet.</p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-indigo-500"
                >
                  Explore Directory to Connect
                </button>
              </div>
            ) : (
              connections.map((partner) => {
                const isOnline = onlineUsers.has(partner._id);

                return (
                  <div key={partner._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 overflow-hidden">
                          {partner.avatar ? (
                            <img src={partner.avatar} alt={partner.name} className="w-full h-full object-cover" />
                          ) : (
                            partner.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-200">{partner.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{partner.email} &bull; {partner.role} &bull; {partner.department || 'CS'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/chat')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Message
                      </button>
                      <button
                        onClick={() => handleRemoveConnection(partner._id, partner.name)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold flex items-center gap-1"
                      >
                        <UserMinus className="w-3.5 h-3.5" /> Remove
                      </button>
                      <button
                        onClick={() => handleBlockUser(partner._id, partner.name)}
                        className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl font-semibold flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Block
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : activeTab === 'pending' ? (
          /* TAB 3: Pending Connection Requests */
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Incoming Requests ({incomingRequests.length})</h4>
              {incomingRequests.length === 0 ? (
                <p className="text-xs text-slate-500">No incoming connection requests.</p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {incomingRequests.map((req) => (
                    <div key={req._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 overflow-hidden shrink-0">
                          {req.requester?.avatar ? (
                            <img src={req.requester.avatar} alt={req.requester.name} className="w-full h-full object-cover" />
                          ) : (
                            req.requester?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200">{req.requester?.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{req.requester?.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondRequest(req._id, 'accept')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req._id, 'reject')}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req._id, 'block')}
                          className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl font-semibold"
                        >
                          Block
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Outgoing Sent Requests ({outgoingRequests.length})</h4>
              {outgoingRequests.length === 0 ? (
                <p className="text-xs text-slate-500">No outgoing connection requests pending.</p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {outgoingRequests.map((req) => (
                    <div key={req._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 overflow-hidden shrink-0">
                          {req.recipient?.avatar ? (
                            <img src={req.recipient.avatar} alt={req.recipient.name} className="w-full h-full object-cover" />
                          ) : (
                            req.recipient?.name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200">{req.recipient?.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{req.recipient?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveConnection(req.recipient?._id, req.recipient?.name)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Withdraw Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'blocked' ? (
          /* TAB 4: Blocked Users Directory */
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {blockedUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No blocked users.</div>
            ) : (
              blockedUsers.map((bUser) => (
                <div key={bUser._id} className="py-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-800 dark:text-slate-200 overflow-hidden shrink-0">
                      {bUser.avatar ? (
                        <img src={bUser.avatar} alt={bUser.name} className="w-full h-full object-cover" />
                      ) : (
                        bUser.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-200">{bUser.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{bUser.email} &bull; {bUser.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblockUser(bUser._id, bUser.name)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <ShieldOff className="w-3.5 h-3.5" /> Unblock User
                  </button>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'history' ? (
          /* TAB 5: Connection Request Log */
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {historyLog.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No connection history logs found.</div>
            ) : (
              historyLog.map((log) => (
                <div key={log._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-200">
                      {log.requester?.name} &rarr; {log.recipient?.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(log.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      log.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : log.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : log.status === 'blocked'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
