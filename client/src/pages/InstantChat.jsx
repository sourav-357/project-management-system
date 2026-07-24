import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  MessageSquare, Send, CheckCheck, Check, Reply, Users, Filter, Search, ArrowUp, AlertCircle, X, Phone, Video, History, Trash2, Smile, PhoneMissed, CornerDownRight, UserX, UserMinus, Eraser, ArrowLeft, Trash
} from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉', '👏', '💯'];

// Helper to format date headers in message stream
const getDayHeaderLabel = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
};

// Time formatting helper
const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  if (isToday) return `Today at ${timeStr}`;
  if (isYesterday) return `Yesterday at ${timeStr}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
};

export const InstantChat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers, initiateCall, markChatAsRead, setActiveChatUserId } = useSocket();

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Call History Modal State
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Fetch Friends List
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

  // 2. Fetch Conversation Messages when Selected Friend changes
  useEffect(() => {
    if (!selectedFriend) {
      setActiveChatUserId(null);
      return;
    }

    setActiveChatUserId(selectedFriend._id);
    markChatAsRead(selectedFriend._id);
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

  // 3. Socket Event Listeners for incoming real-time messages & reactions
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msgData) => {
      const senderId = msgData.sender?._id || msgData.sender;
      const recipientId = msgData.recipient?._id || msgData.recipient;

      // Update messages stream if this message belongs to the open chat
      if (
        selectedFriend &&
        (senderId === selectedFriend._id || recipientId === selectedFriend._id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msgData._id)) return prev;
          return [...prev, msgData];
        });
        scrollToBottom();

        if (senderId === selectedFriend._id) {
          socket.emit('mark_read', { senderId: selectedFriend._id });
          markChatAsRead(selectedFriend._id);
        }
      }

      // Re-order contact list: move messaged contact to the VERY TOP of the list
      const targetFriendId = senderId === user._id ? recipientId : senderId;
      setFriends((prevFriends) => {
        const targetFriend = prevFriends.find((f) => f._id === targetFriendId);
        if (!targetFriend) return prevFriends;

        const isSenderMe = senderId === user._id;
        const isCurrentlyOpenChat = senderId === selectedFriend?._id;

        const updatedTarget = {
          ...targetFriend,
          lastMessage: msgData.content,
          lastMessageDate: msgData.createdAt,
          unreadCount: (isSenderMe || isCurrentlyOpenChat) ? 0 : (targetFriend.unreadCount || 0) + 1,
        };

        const remaining = prevFriends.filter((f) => f._id !== targetFriendId);
        return [updatedTarget, ...remaining];
      });
    };

    const handleMessagesRead = ({ readerId }) => {
      if (selectedFriend && selectedFriend._id === readerId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };

    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('reaction_updated', handleReactionUpdated);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('reaction_updated', handleReactionUpdated);
    };
  }, [socket, selectedFriend, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Jump & Highlight Replied Message (Max 2 seconds highlight)
  const handleJumpToMessage = (targetMsgId) => {
    if (!targetMsgId) return;
    const targetId = typeof targetMsgId === 'object' ? targetMsgId._id : targetMsgId;
    const elem = document.getElementById(`msg-${targetId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elem.classList.add('ring-4', 'ring-indigo-500', 'bg-indigo-500/20', 'scale-[1.02]', 'transition-all', 'duration-300', 'rounded-2xl');
      setTimeout(() => {
        elem.classList.remove('ring-4', 'ring-indigo-500', 'bg-indigo-500/20', 'scale-[1.02]');
      }, 2000);
    }
  };

  // Send Message Handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !socket) return;

    const content = newMessage.trim();
    const replyToObj = replyToMessage;

    setNewMessage('');
    setReplyToMessage(null);

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

          // Move current contact to top of left contact list
          setFriends((prevFriends) => {
            const targetFriend = prevFriends.find((f) => f._id === selectedFriend._id);
            if (!targetFriend) return prevFriends;

            const updatedTarget = {
              ...targetFriend,
              lastMessage: response.message.content,
              lastMessageDate: response.message.createdAt,
            };

            const remaining = prevFriends.filter((f) => f._id !== selectedFriend._id);
            return [updatedTarget, ...remaining];
          });
        } else if (response && response.error) {
          alert(response.error);
        }
      }
    );
  };

  const handleToggleEmoji = (messageId, emoji) => {
    if (!socket) return;
    
    // Optimistically update reactions state locally for instant snappy feedback
    setMessages((prev) =>
      prev.map((m) => {
        if (m._id !== messageId) return m;
        const currentReactions = m.reactions || [];
        const existingIdx = currentReactions.findIndex((r) => (r.user?._id || r.user) === user._id);
        
        let nextReactions = [...currentReactions];
        if (existingIdx > -1) {
          if (nextReactions[existingIdx].emoji === emoji) {
            nextReactions.splice(existingIdx, 1);
          } else {
            nextReactions[existingIdx] = { user: user._id, emoji };
          }
        } else {
          nextReactions.push({ user: user._id, emoji });
        }
        return { ...m, reactions: nextReactions };
      })
    );

    socket.emit('toggle_reaction', { messageId, emoji });
  };

  const startCall = (callType) => {
    if (!selectedFriend) return;
    initiateCall(selectedFriend, callType);
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

  const handleClearAllCallHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all call history logs?')) return;
    try {
      await api.delete('/chat/call-history/clear-all');
      setCallHistory([]);
    } catch (err) {
      alert('Failed to clear all call history');
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

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1-on-1 CALL HISTORY MODAL */}
      {showCallHistory && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Call History Logs
              </h3>
              <div className="flex items-center gap-2">
                {callHistory.length > 0 && (
                  <button
                    onClick={handleClearAllCallHistory}
                    className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Trash className="w-3.5 h-3.5" /> Clear All Logs
                  </button>
                )}
                <button onClick={() => setShowCallHistory(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 space-y-1">
              {historyLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : callHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No call history logs found.</div>
              ) : (
                callHistory.map((item) => (
                  <div key={item._id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                        {item.callType === 'one_to_one_video' ? <Video className="w-4 h-4 text-indigo-500" /> : <Phone className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-200">{item.title || '1-on-1 Call'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatCallTime(item.startedAt)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCallRecord(item._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Call Log"
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

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Friends / Connections List */}
        <div
          className={`w-full md:w-80 bg-slate-50 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between ${
            selectedFriend ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Conversations
              </h2>
              <button
                onClick={openCallHistoryModal}
                className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs transition-all"
                title="View Call Logs"
              >
                <History className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              {['All', 'Teacher', 'Student'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`flex-1 py-1 rounded-lg text-center transition-all ${
                    roleFilter === role ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Friends List Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/50">
            {friendsLoading ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No connections found. Connect with peers in the Network section!
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isOnline = onlineUsers.has(friend._id);
                const isSelected = selectedFriend?._id === friend._id;
                const lastMsgText = typeof friend.lastMessage === 'string' ? friend.lastMessage : (friend.lastMessage?.content || 'No messages yet');
                const unreadCount = friend.unreadCount || 0;

                return (
                  <div
                    key={friend._id}
                    onClick={() => {
                      setSelectedFriend(friend);
                      setFriends((prev) =>
                        prev.map((f) => (f._id === friend._id ? { ...f, unreadCount: 0 } : f))
                      );
                    }}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/10 border-l-4 border-indigo-600 dark:border-indigo-500'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                        ) : (
                          friend.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{friend.name}</h4>
                        {friend.lastMessageDate && (
                          <span className="text-[10px] text-slate-500">
                            {getDayHeaderLabel(friend.lastMessageDate)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                          {lastMsgText}
                        </p>
                        {unreadCount > 0 && !isSelected && (
                          <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[9px] font-bold shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Active Chat Room */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-slate-950 ${!selectedFriend ? 'hidden md:flex' : 'flex'}`}>
          {selectedFriend ? (
            <>
              {/* Chat Room Header */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedFriend(null)}
                    className="md:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0">
                      {selectedFriend.avatar ? (
                        <img src={selectedFriend.avatar} alt={selectedFriend.name} className="w-full h-full object-cover" />
                      ) : (
                        selectedFriend.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        onlineUsers.has(selectedFriend._id) ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedFriend.name}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {onlineUsers.has(selectedFriend._id) ? 'Online' : 'Offline'} &bull; {selectedFriend.role}
                    </p>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startCall('one_to_one_voice')}
                    className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all"
                    title="Voice Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startCall('one_to_one_video')}
                    className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all"
                    title="Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClearChat}
                    className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all"
                    title="Clear Chat History"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Message Stream with Day Dividers */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-100/40 dark:bg-slate-950">
                {hasMore && (
                  <div className="flex justify-center">
                    <button
                      onClick={loadOlderMessages}
                      disabled={loadingOlder}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      {loadingOlder ? 'Loading older messages...' : 'Load older messages'}
                    </button>
                  </div>
                )}

                {messagesLoading ? (
                  <div className="p-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    No messages yet. Send a greeting to start chatting!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSelf = (msg.sender?._id || msg.sender) === user._id;

                    // Day Divider Calculation
                    const currentDateHeader = getDayHeaderLabel(msg.createdAt);
                    const prevDateHeader = idx > 0 ? getDayHeaderLabel(messages[idx - 1].createdAt) : null;
                    const showDayDivider = currentDateHeader !== prevDateHeader;

                    return (
                      <React.Fragment key={msg._id || idx}>
                        {showDayDivider && (
                          <div className="flex justify-center my-3">
                            <span className="px-3 py-1 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                              {currentDateHeader}
                            </span>
                          </div>
                        )}

                        <div
                          id={`msg-${msg._id}`}
                          className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} group transition-all duration-300`}
                        >
                          {/* Message Bubble Container */}
                          <div
                            className={`max-w-[75%] p-3.5 rounded-2xl text-xs space-y-1.5 shadow-sm relative transition-all duration-300 ${
                              isSelf
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-bl-none'
                            }`}
                          >
                            {/* Replied Message Tag - Clicking jumps to original message with 2s highlight */}
                            {msg.replyTo && (
                              <div
                                onClick={() => handleJumpToMessage(msg.replyTo._id || msg.replyTo)}
                                className={`p-2 rounded-xl text-[11px] cursor-pointer mb-1 border-l-3 transition-all hover:opacity-90 ${
                                  isSelf
                                    ? 'bg-indigo-700/70 border-indigo-300 text-indigo-100'
                                    : 'bg-slate-100 dark:bg-slate-800 border-indigo-500 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <p className="font-bold flex items-center gap-1 text-[10px]">
                                  <Reply className="w-3 h-3" /> {msg.replyTo.sender?.name || 'User'}
                                </p>
                                <p className="truncate text-[10px] opacity-90">{msg.replyTo.content}</p>
                              </div>
                            )}

                            <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>

                            {/* Emoji Reaction Display Chips */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {msg.reactions.map((r, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleToggleEmoji(msg._id, r.emoji)}
                                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-950/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] rounded-full border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1"
                                  >
                                    <span>{r.emoji}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-1.5 text-[10px] opacity-75 pt-1">
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              {isSelf && (
                                <span>
                                  {msg.isRead ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Quick Emoji Reaction Toolbar */}
                            <div
                              className={`hidden group-hover:flex absolute -top-8 ${
                                isSelf ? 'right-0' : 'left-0'
                              } bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-xl gap-1.5 z-20 transition-all`}
                            >
                              {EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleEmoji(msg._id, emoji)}
                                  className="hover:scale-125 transition-transform p-0.5 text-sm"
                                  title={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setReplyToMessage(msg)}
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                title="Reply"
                              >
                                <Reply className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Replied Message Preview Banner */}
              {replyToMessage && (
                <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <CornerDownRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">Replying to: <b>{replyToMessage.content}</b></span>
                  </div>
                  <button onClick={() => setReplyToMessage(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs p-8 space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              <p className="font-bold text-slate-700 dark:text-slate-300">Select a conversation to start chatting</p>
              <p className="text-slate-500">Connect with classmates, supervisors, and colleagues in real time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
