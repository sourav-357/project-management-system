import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { caller, callType, offer }
  const [activeCall, setActiveCall] = useState(null); // { partner, callType, offer, answer, isCaller, isConnected, mode }
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

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

    // Incoming Call Popup Signal
    newSocket.on('incoming_call', (data) => {
      setIncomingCall(data);
    });

    // 1-on-1 Call Signals (Clean silent state resets to prevent alert loops)
    newSocket.on('call_accepted', (data) => {
      setActiveCall((prev) => (prev ? { ...prev, answer: data.answer, isConnected: true } : null));
    });

    newSocket.on('call_rejected', () => {
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
      mode: 'outgoing',
    });
    socketRef.current.emit('initiate_call', {
      recipientId: recipient._id,
      callType,
      offer,
    });
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    const partner = incomingCall.caller;
    const callType = incomingCall.callType;
    const offer = incomingCall.offer;

    setActiveCall({
      partner,
      callType,
      offer,
      isCaller: false,
      isConnected: true,
      mode: 'incoming',
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
