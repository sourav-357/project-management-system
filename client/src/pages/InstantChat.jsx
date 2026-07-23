import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api, { getAccessToken } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare, Send, CheckCheck, Check, Reply, Users, Filter, Search, ArrowUp, AlertCircle, X, Phone, Video, History, Trash2, Smile, PhoneMissed, CornerDownRight, UserX, UserMinus, Eraser, ArrowLeft
} from 'lucide-react';
import { CallModal } from '../components/CallModal';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '👏', '💯'];

// Date & Time formatting helpers
const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr;
  } else if (isYesterday) {
    return `Yesterday ${timeStr}`;
  } else if (d.getFullYear() === now.getFullYear()) {
    const monthDay = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${monthDay}, ${timeStr}`;
  } else {
    const fullDate = d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${fullDate} ${timeStr}`;
  }
};

const formatCallTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  } else {
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
  }
};

const getDayHeaderLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();

  if (d.toDateString() === now.toDateString()) {
    return 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
};

export const InstantChat = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  // Online active status state
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Connected friends state
  const [friends, setFriends] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendsLoading, setFriendsLoading] = useState(true);

  // Chat room state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // 1-on-1 Call state
  const [activeCall, setActiveCall] = useState(null);

  // Call History Modal State
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Setup Socket.io client connection & active user tracking
  useEffect(() => {
    const token = getAccessToken();
    const socketUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket.io connected to server on port 3000');
      newSocket.emit('get_online_users', (res) => {
        if (res && res.onlineUsers) {
          setOnlineUsers(new Set(res.onlineUsers));
        }
      });
    });

    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    newSocket.on('online_users_list', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Fetch Friends List
  useEffect(() => {
    fetchFriends();
  }, [roleFilter]);

  const fetchFriends = async () => {
    try {
      setFriendsLoading(true);
      const res = await api.get('/chat/friends', {
        params: { role: roleFilter === 'All' ? undefined : roleFilter },
      });
      const friendList = res.data.data.friends || [];
      setFriends(friendList);

      if (!selectedFriend && friendList.length > 0 && window.innerWidth >= 768) {
        setSelectedFriend(friendList[0]);
      }
    } catch (err) {
      console.error('Error fetching chat friends:', err);
    } finally {
      setFriendsLoading(false);
    }
  };

  // 3. Fetch Conversation Messages when Selected Friend changes
  useEffect(() => {
    if (!selectedFriend) return;

    setPage(1);
    fetchMessages(selectedFriend._id, 1, false);

    if (socket) {
      socket.emit('mark_read', { senderId: selectedFriend._id });
    }
  }, [selectedFriend]);

  const fetchMessages = async (friendId, targetPage, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingOlder(true);
      else setMessagesLoading(true);

      const res = await api.get(`/chat/messages/${friendId}`, {
        params: { page: targetPage, limit: 30 },
      });

      const { messages: fetchedMsgs, pagination } = res.data.data;

      if (isLoadMore) {
        setMessages((prev) => {
          const newUnique = fetchedMsgs.filter((m) => !prev.some((p) => p._id === m._id));
          return [...newUnique, ...prev];
        });
      } else {
        setMessages(fetchedMsgs);
        scrollToBottom();
      }

      setHasMore(pagination.hasMore);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
      setLoadingOlder(false);
    }
  };

  const loadOlderMessages = () => {
    if (!selectedFriend || !hasMore || loadingOlder) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(selectedFriend._id, nextPage, true);
  };

  // 4. Socket Event Listeners for incoming real-time messages & call signals
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msgData) => {
      if (
        selectedFriend &&
        (msgData.sender === selectedFriend._id || msgData.recipient === selectedFriend._id ||
         msgData.sender?._id === selectedFriend._id || msgData.recipient?._id === selectedFriend._id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msgData._id)) return prev;
          return [...prev, msgData];
        });
        scrollToBottom();

        if (msgData.sender === selectedFriend._id || msgData.sender?._id === selectedFriend._id) {
          socket.emit('mark_read', { senderId: selectedFriend._id });
        }
      }
      fetchFriends();
    };

    const handleMessagesRead = ({ readerId }) => {
      if (selectedFriend && selectedFriend._id === readerId) {
        setMessages((prev) =>
          prev.map((m) => ({ ...m, isRead: true }))
        );
      }
    };

    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleIncomingCall = ({ caller, callType, offer }) => {
      setActiveCall({
        mode: 'incoming',
        callType,
        partner: caller,
        offer,
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('reaction_updated', handleReactionUpdated);
    socket.on('incoming_call', handleIncomingCall);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('reaction_updated', handleReactionUpdated);
      socket.off('incoming_call', handleIncomingCall);
    };
  }, [socket, selectedFriend]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Jump to Tagged / Replied Message in Chat Stream
  const handleJumpToMessage = (targetMsgId) => {
    if (!targetMsgId) return;
    const elem = document.getElementById(`msg-${targetMsgId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elem.classList.add('ring-4', 'ring-indigo-500/80', 'ring-offset-2', 'dark:ring-offset-slate-900', 'bg-indigo-50/80', 'dark:bg-indigo-950/70', 'scale-[1.02]', 'transition-all', 'duration-300');
      setTimeout(() => {
        elem.classList.remove('ring-4', 'ring-indigo-500/80', 'ring-offset-2', 'dark:ring-offset-slate-900', 'bg-indigo-50/80', 'dark:bg-indigo-950/70', 'scale-[1.02]');
      }, 2200);
    }
  };

  // Single Canonical Message Sending (No Duplicates)
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !socket) return;

    const content = newMessage.trim();
    const replyToObj = replyToMessage;

    setNewMessage('');
    setReplyToMessage(null);
    setShowEmojiPicker(false);

    socket.emit(
      'send_message',
      {
        recipientId: selectedFriend._id,
        content,
        replyToId: replyToObj ? replyToObj._id : null,
      },
      (response) => {
        if (response && response.success) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === response.message._id)) return prev;
            return [...prev, response.message];
          });
          scrollToBottom();
        } else if (response && response.error) {
          alert(response.error);
        }
      }
    );
  };

  const handleToggleEmoji = async (messageId, emoji) => {
    if (socket) {
      socket.emit('toggle_reaction', { messageId, emoji });
    }
  };

  const startCall = (callType) => {
    if (!selectedFriend) return;
    setActiveCall({
      mode: 'outgoing',
      callType,
      partner: selectedFriend,
    });
  };

  const openCallHistoryModal = async () => {
    setShowCallHistory(true);
    try {
      setHistoryLoading(true);
      const res = await api.get('/chat/call-history');
      setCallHistory(res.data.data.history || []);
    } catch (err) {
      console.error('Error fetching call history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteCallRecord = async (historyId) => {
    try {
      await api.delete(`/chat/call-history/${historyId}`);
      setCallHistory((prev) => prev.filter((item) => item._id !== historyId));
    } catch (err) {
      alert('Failed to delete call record');
    }
  };

  const handleClearChat = async () => {
    if (!selectedFriend) return;
    if (!window.confirm(`Clear all messages with ${selectedFriend.name}? Your connection will remain intact.`)) return;

    try {
      await api.delete(`/chat/clear-chat/${selectedFriend._id}`);
      setMessages([]);
    } catch (err) {
      alert('Failed to clear chat history');
    }
  };

  const handleRemoveConnection = async () => {
    if (!selectedFriend) return;
    if (!window.confirm(`Remove connection with ${selectedFriend.name}?`)) return;

    try {
      await api.delete(`/connections/remove/${selectedFriend._id}`);
      alert(`Connection with ${selectedFriend.name} removed.`);
      fetchFriends();
      setSelectedFriend(null);
    } catch (err) {
      alert('Failed to remove connection');
    }
  };

  const handleBlockUser = async () => {
    if (!selectedFriend) return;
    if (!window.confirm(`Block ${selectedFriend.name}? They will no longer be able to message or connect with you.`)) return;

    try {
      await api.put(`/connections/block-user/${selectedFriend._id}`);
      alert(`${selectedFriend.name} has been blocked.`);
      fetchFriends();
      setSelectedFriend(null);
    } catch (err) {
      alert('Failed to block user');
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-95px)] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {/* 1-on-1 Call Overlay Modal */}
      {activeCall && (
        <CallModal
          socket={socket}
          currentUser={user}
          activeCall={activeCall}
          onCloseCall={() => setActiveCall(null)}
        />
      )}

      {/* 1-on-1 CALL HISTORY MODAL */}
      {showCallHistory && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 1-on-1 Call History Logs
              </h3>
              <button onClick={() => setShowCallHistory(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {historyLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : callHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No 1-on-1 call history records found.
                </div>
              ) : (
                callHistory.map((item) => (
                  <div key={item._id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${item.status === 'missed' || item.status === 'declined' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'}`}>
                        {item.status === 'missed' || item.status === 'declined' ? <PhoneMissed className="w-4 h-4" /> : item.callType === 'one_to_one_video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {item.title} ({item.host?._id === user._id ? `With ${item.participants?.find((p) => p._id !== user._id)?.name || 'User'}` : `From ${item.host?.name}`})
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatCallTime(item.startedAt || item.createdAt)}
                          {item.durationSeconds > 0 && ` \u2022 Duration: ${Math.floor(item.durationSeconds / 60)}m ${item.durationSeconds % 60}s`}
                          {` \u2022 Status: `}
                          <span className={`capitalize font-bold ${item.status === 'missed' || item.status === 'declined' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {item.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCallRecord(item._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete Call Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: SLEEK COMPACT FRIENDS DIRECTORY (RESPONSIVE) */}
        <div
          className={`w-full md:w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 shrink-0 ${
            selectedFriend ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Chat Directory
              </h2>
              <button
                onClick={openCallHistoryModal}
                className="p-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-md text-[10px] font-semibold flex items-center gap-1"
                title="View Call Logs"
              >
                <History className="w-3 h-3" /> Logs
              </button>
            </div>

            <div className="flex gap-1">
              {['All', 'Student', 'Teacher', 'Admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all border ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {friendsLoading ? (
              <div className="p-6 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-slate-400">
                No connected friends found
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <button
                  key={friend._id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`w-full p-2.5 text-left flex items-center gap-2.5 transition-colors ${
                    selectedFriend?._id === friend._id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-l-3 border-indigo-600'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[11px] overflow-hidden">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                      ) : (
                        friend.name?.charAt(0) || 'U'
                      )}
                    </div>
                    {onlineUsers.has(friend._id) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Active Now"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">{friend.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {friend.role} &bull; {friend.department}
                    </p>
                  </div>

                  {friend.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-extrabold shrink-0">
                      {friend.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SLEEK CHAT ROOM (RESPONSIVE) */}
        <div
          className={`flex-1 flex flex-col bg-white dark:bg-slate-900 ${
            !selectedFriend ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedFriend ? (
            <>
              {/* Chat Header with Back Button (Mobile) & Actions */}
              <div className="px-3 sm:px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="md:hidden p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg"
                    title="Back to Friends List"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[11px] overflow-hidden border border-slate-300 dark:border-slate-700">
                      {selectedFriend.avatar ? (
                        <img src={selectedFriend.avatar} alt={selectedFriend.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedFriend.name?.charAt(0) || 'U'
                      )}
                    </div>
                    {onlineUsers.has(selectedFriend._id) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{selectedFriend.name}</h3>
                      {onlineUsers.has(selectedFriend._id) ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Now
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Offline</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {selectedFriend.role} &bull; {selectedFriend.department || 'General'}
                    </p>
                  </div>
                </div>

                {/* Call & Connection Management Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startCall('one_to_one_voice')}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-600 transition-all"
                    title="Voice Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => startCall('one_to_one_video')}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-all"
                    title="Video Call"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5" />
                  <button
                    onClick={handleClearChat}
                    className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-all"
                    title="Clear Chat (Keep Connection)"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRemoveConnection}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-600 transition-all"
                    title="Remove Connection"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all"
                    title="Block User"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3">
                {hasMore && (
                  <div className="text-center pb-1">
                    <button
                      onClick={loadOlderMessages}
                      disabled={loadingOlder}
                      className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-full hover:bg-slate-200 transition-all disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <ArrowUp className="w-2.5 h-2.5" />
                      {loadingOlder ? 'Loading...' : 'Load older messages'}
                    </button>
                  </div>
                )}

                {messagesLoading ? (
                  <div className="p-6 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No messages yet. Send a message or start a voice/video call!
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = msg.sender === user._id || msg.sender?._id === user._id;
                    const isMissedCall = msg.content?.includes('Missed');

                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDateHeader = !prevMsg || new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                    return (
                      <React.Fragment key={msg._id || index}>
                        {showDateHeader && (
                          <div className="flex items-center justify-center my-3">
                            <span className="px-3 py-1 bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full shadow-xs uppercase tracking-wider">
                              {getDayHeaderLabel(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        <div
                          id={`msg-${msg._id}`}
                          className={`flex flex-col group relative transition-all rounded-xl ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          {/* Hover Quick Action Toolbar */}
                          <div
                            className={`hidden group-hover:flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2 py-0.5 shadow-md absolute -top-3 z-10 ${
                              isMine ? 'right-0' : 'left-0'
                            }`}
                          >
                            <button
                              onClick={() => setReplyToMessage(msg)}
                              className="p-0.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold flex items-center gap-0.5"
                              title="Tag / Reply to message"
                            >
                              <Reply className="w-3 h-3" /> Reply
                            </button>
                            <div className="h-2.5 w-[1px] bg-slate-200 dark:bg-slate-700" />
                            {EMOJIS.slice(0, 6).map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleEmoji(msg._id, emoji)}
                                className="text-xs p-0.5 opacity-80 hover:opacity-100"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                          {/* SLEEK COMPACT MESSAGE BUBBLE */}
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 rounded-xl text-xs space-y-1 shadow-sm transition-all ${
                              isMissedCall
                                ? 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                                : isMine
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs border border-indigo-500/20'
                                : 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80'
                            }`}
                          >
                            {/* TAGGED / REPLIED MESSAGE PREVIEW WITH JUMP CLICK */}
                            {msg.replyTo && (
                              <div
                                onClick={() => handleJumpToMessage(msg.replyTo._id || msg.replyTo)}
                                className={`p-2 rounded-lg text-[11px] mb-1 border-l-3 cursor-pointer hover:opacity-95 transition-all shadow-inner ${
                                  isMine
                                    ? 'bg-black/20 border-indigo-300 text-indigo-100'
                                    : 'bg-slate-200/80 dark:bg-slate-700/80 border-indigo-500 text-slate-800 dark:text-slate-200'
                                }`}
                                title="Click to jump to tagged message"
                              >
                                <div className="flex items-center justify-between font-bold text-[10px]">
                                  <span className="flex items-center gap-1">
                                    <CornerDownRight className="w-2.5 h-2.5 text-indigo-400" />
                                    {msg.replyTo.sender?.name || 'Tagged Message'}
                                  </span>
                                </div>
                                <p className="truncate opacity-90 italic mt-0.5 text-[10px]">{msg.replyTo.content}</p>
                              </div>
                            )}

                            <p className="leading-snug whitespace-pre-wrap font-medium">{msg.content}</p>

                            <div
                              className={`flex items-center justify-end gap-1 text-[9px] pt-0.5 ${
                                isMine ? 'text-indigo-200' : 'text-slate-400'
                              }`}
                            >
                              <span>
                                {formatMessageTime(msg.createdAt)}
                              </span>
                              {isMine && !isMissedCall && (
                                msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-300 font-extrabold" title={`Read ${msg.readAt ? `at ${new Date(msg.readAt).toLocaleTimeString()}` : ''}`} />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-indigo-200" title="Sent (Unread)" />
                                )
                              )}
                            </div>
                          </div>

                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {msg.reactions.map((r, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] rounded-full text-slate-800 dark:text-slate-200 shadow-sm"
                                >
                                  {r.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5 relative">
                {showEmojiPicker && (
                  <div className="absolute bottom-14 left-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl flex gap-1.5 z-20">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setNewMessage((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-base p-1 opacity-80 hover:opacity-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {replyToMessage && (
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 text-[11px]">
                        <Reply className="w-3 h-3" /> Replying to {replyToMessage.sender?.name || 'message'}:
                      </span>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">{replyToMessage.content}</p>
                    </div>
                    <button
                      onClick={() => setReplyToMessage(null)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                    title="Insert Emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${selectedFriend.name}...`}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-3.5 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md disabled:opacity-40 flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3 h-3" /> Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-700" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Chat Selected</h3>
              <p className="text-[11px] mt-0.5">Select a connected friend from the directory to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
