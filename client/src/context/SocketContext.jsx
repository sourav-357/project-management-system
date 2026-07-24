import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/axios';
import { getSocketUrl } from '../utils/socketUrl';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Unread messages counts map: friendId -> count
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeChatUserId, setActiveChatUserId] = useState(null);

  // Global Call States for App-Wide Popups
  const [incomingCall, setIncomingCall] = useState(null); // { caller, callType, offer }
  const [activeCall, setActiveCall] = useState(null); // { partner, callType, offer, answer, isCaller }

  const socketRef = useRef(null);

  // 1. Establish App-Wide Socket Connection when User is Logged In
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setOnlineUsers(new Set());
      setIncomingCall(null);
      setActiveCall(null);
      return;
    }

    const token = getAccessToken();
    const socketUrl = getSocketUrl();
    if (!socketUrl) return;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('App-Wide Socket connected for user:', user.name);

      // Request online users list
      newSocket.emit('get_online_users', (res) => {
        if (res && res.onlineUsers) {
          setOnlineUsers(new Set(res.onlineUsers));
        }
      });
    });

    // Online Status Listeners
    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    // Incoming Call Popup Signal (Triggered on ANY page)
    newSocket.on('incoming_call', (data) => {
      console.log('Incoming call received:', data);
      setIncomingCall(data);
    });

    // 1-on-1 Call Signals
    newSocket.on('call_accepted', (data) => {
      setActiveCall((prev) => (prev ? { ...prev, answer: data.answer, isConnected: true } : null));
    });

    newSocket.on('call_rejected', () => {
      alert('Call was declined or unanswered.');
      setActiveCall(null);
      setIncomingCall(null);
    });

    newSocket.on('call_ended', () => {
      setActiveCall(null);
      setIncomingCall(null);
    });

    // Real-Time Unread Message Counter Listener
    newSocket.on('receive_message', (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      if (senderId && senderId !== user._id && senderId !== activeChatUserId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
      }
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Total Unread Messages Count
  const totalUnreadCount = Object.values(unreadCounts).reduce((acc, curr) => acc + curr, 0);

  const markChatAsRead = useCallback((friendId) => {
    if (!friendId) return;
    setUnreadCounts((prev) => {
      const copy = { ...prev };
      delete copy[friendId];
      return copy;
    });
  }, []);

  // Call Actions
  const initiateCall = (recipient, callType, offer) => {
    if (!socketRef.current) return;
    setActiveCall({
      partner: recipient,
      callType,
      offer,
      isCaller: true,
      isConnected: false,
    });
    socketRef.current.emit('initiate_call', {
      recipientId: recipient._id,
      callType,
      offer,
    });
  };

  const acceptCall = (answer) => {
    if (!socketRef.current || !incomingCall) return;
    const partner = incomingCall.caller;
    const callType = incomingCall.callType;
    const offer = incomingCall.offer;

    setActiveCall({
      partner,
      callType,
      offer,
      answer,
      isCaller: false,
      isConnected: true,
    });

    socketRef.current.emit('answer_call', {
      callerId: partner._id,
      answer,
    });

    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!socketRef.current || !incomingCall) return;
    socketRef.current.emit('reject_call', {
      callerId: incomingCall.caller._id,
    });
    setIncomingCall(null);
  };

  const endCall = (targetId) => {
    if (socketRef.current && targetId) {
      socketRef.current.emit('end_call', { targetId });
    }
    setActiveCall(null);
    setIncomingCall(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        unreadCounts,
        totalUnreadCount,
        markChatAsRead,
        activeChatUserId,
        setActiveChatUserId,
        incomingCall,
        activeCall,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
