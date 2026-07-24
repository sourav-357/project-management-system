import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { getAccessToken } from '../api/axios';
import { getSocketUrl } from '../utils/socketUrl';
import { useAuth } from '../context/AuthContext';
import {
  Video, VideoOff, Mic, MicOff, MonitorUp, PhoneOff, MessageSquare, Pin, Send, Users, X, Volume2
} from 'lucide-react';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Component for rendering remote participant video stream with WebRTC audio/video
const PeerVideo = ({ peer, stream, isPinned, onPin, isHost, onHostMute, onHostUnmute, onHostRemove }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center group min-h-[240px]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${peer.isVideoOff || !stream ? 'hidden' : 'block'}`}
      />

      {(peer.isVideoOff || !stream) && (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white border border-slate-700">
            {peer.user?.name?.charAt(0) || 'P'}
          </div>
          <span className="text-xs font-bold text-white">{peer.user?.name}</span>
          <span className="text-[10px] text-slate-400">{peer.user?.role}</span>
        </div>
      )}

      {/* Peer Name Banner & Status */}
      <div className="absolute bottom-3 left-3 bg-slate-950/80 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-sm">
        <span>{peer.user?.name}</span>
        {peer.isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
      </div>

      {/* Host Controls & Actions overlay on hover */}
      <div className="hidden group-hover:flex absolute top-3 right-3 items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-sm z-10">
        <button
          onClick={onPin}
          className="p-1.5 text-slate-300 hover:text-indigo-400 transition-colors"
          title={isPinned ? 'Unpin' : 'Pin Video'}
        >
          <Pin className="w-4 h-4" />
        </button>
        {isHost && (
          <>
            {peer.isMuted ? (
              <button
                onClick={() => onHostUnmute(peer.user._id)}
                className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                title="Unmute Participant"
              >
                <Mic className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onHostMute(peer.user._id)}
                className="p-1.5 text-amber-400 hover:text-amber-300 transition-colors"
                title="Mute Participant"
              >
                <MicOff className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onHostRemove(peer.user._id)}
              className="p-1.5 text-rose-500 hover:text-rose-400 transition-colors"
              title="Remove Participant from Call"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const GroupMeeting = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  // Call & Stream States
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Participants & Video Streams
  const [peers, setPeers] = useState([]); // Array of { socketId, user, isMuted, isVideoOff }
  const [peerStreams, setPeerStreams] = useState({}); // socketId -> MediaStream
  const [pinnedUser, setPinnedUser] = useState(null); // User ID or socket ID of pinned video

  // In-Meeting Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // socketId -> RTCPeerConnection
  const remoteStreamsRef = useRef(new Map()); // socketId -> MediaStream
  const socketRef = useRef(null);

  const isHost = meeting?.host?._id === user._id || user.role === 'Admin';

  // 1. Fetch Meeting Details & Setup Media + Socket
  useEffect(() => {
    let isMounted = true;

    const startMeetingSession = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/meetings/${meetingId}`);
        const fetchedMeeting = res.data.data.meeting;

        if (!fetchedMeeting || fetchedMeeting.status === 'ended') {
          alert('This meeting has ended and is no longer active.');
          navigate('/meetings');
          return;
        }

        if (!isMounted) return;
        setMeeting(fetchedMeeting);

        // Get local camera & microphone
        const stream = await initLocalMedia();
        setupMeetingSocket(stream);
      } catch (err) {
        console.error('Error starting meeting session:', err);
        alert(err.response?.data?.message || 'This meeting has ended or does not exist.');
        navigate('/meetings');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    startMeetingSession();

    return () => {
      isMounted = false;
      cleanupLocalMedia();
    };
  }, [meetingId]);

  const initLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Camera/Mic access denied or unavailable:', err);
      setIsVideoOff(true);
      return null;
    }
  };

  // WebRTC Peer Connection Helper
  const createPeerConnection = (targetSocketId, localStream) => {
    if (peerConnectionsRef.current.has(targetSocketId)) {
      return peerConnectionsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(targetSocketId, pc);

    // Add local stream tracks to PC
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // ICE Candidate Handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('group_ice_candidate', {
          targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Track Received Handler (Remote Audio / Video stream)
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      remoteStreamsRef.current.set(targetSocketId, remoteStream);
      setPeerStreams((prev) => ({
        ...prev,
        [targetSocketId]: remoteStream,
      }));
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
        removePeerConnection(targetSocketId);
      }
    };

    return pc;
  };

  const removePeerConnection = (targetSocketId) => {
    const pc = peerConnectionsRef.current.get(targetSocketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(targetSocketId);
    }
    remoteStreamsRef.current.delete(targetSocketId);
    setPeerStreams((prev) => {
      const updated = { ...prev };
      delete updated[targetSocketId];
      return updated;
    });
  };

  const setupMeetingSocket = (localStream) => {
    const token = getAccessToken();
    const socketUrl = getSocketUrl();
    if (!socketUrl) return;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      newSocket.emit('join_meeting_room', {
        meetingId,
        isMuted,
        isVideoOff,
      });
    });

    // Banned / Rejected from rejoining
    newSocket.on('join_rejected', (data) => {
      alert(data.message || 'You cannot join this meeting.');
      cleanupLocalMedia();
      navigate('/meetings');
    });

    // Handle existing users in room
    newSocket.on('existing_meeting_users', async (existingUsers) => {
      setPeers(existingUsers);

      // Initiate WebRTC connections to all existing users
      for (const peer of existingUsers) {
        try {
          const pc = createPeerConnection(peer.socketId, localStreamRef.current || localStream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          newSocket.emit('sending_signal', {
            userToSignal: peer.socketId,
            signal: offer,
          });
        } catch (err) {
          console.error('Error creating WebRTC offer for existing user:', err);
        }
      }
    });

    // Handle new user joining room
    newSocket.on('user_joined_meeting', (newUser) => {
      setPeers((prev) => {
        if (prev.some((p) => p.socketId === newUser.socketId)) return prev;
        return [...prev, newUser];
      });
    });

    // Handle incoming WebRTC offer signal from a joining user
    newSocket.on('user_signal', async ({ signal, callerSocketId }) => {
      try {
        const pc = createPeerConnection(callerSocketId, localStreamRef.current || localStream);
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit('returning_signal', {
          signal: answer,
          callerId: callerSocketId,
        });
      } catch (err) {
        console.error('Error handling incoming WebRTC signal:', err);
      }
    });

    // Handle returned WebRTC answer signal
    newSocket.on('receiving_returned_signal', async ({ signal, id }) => {
      try {
        const pc = peerConnectionsRef.current.get(id);
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } catch (err) {
        console.error('Error setting remote answer description:', err);
      }
    });

    // Handle group ICE candidate
    newSocket.on('group_ice_candidate', async ({ candidate, senderSocketId }) => {
      try {
        const pc = peerConnectionsRef.current.get(senderSocketId);
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    // Handle peer media state toggled (Mute / Unmute / Video toggle)
    newSocket.on('peer_media_toggled', ({ userId, socketId, isMuted, isVideoOff }) => {
      setPeers((prev) =>
        prev.map((p) => {
          if (p.user._id === userId || p.socketId === socketId) {
            return { ...p, isMuted, isVideoOff };
          }
          return p;
        })
      );
    });

    // Handle user leaving room (or removed by host)
    newSocket.on('user_left_meeting', ({ userId, socketId }) => {
      setPeers((prev) => prev.filter((p) => p.user._id !== userId && p.socketId !== socketId));
      if (socketId) {
        removePeerConnection(socketId);
      } else {
        peerConnectionsRef.current.forEach((pc, sId) => {
          removePeerConnection(sId);
        });
      }
    });

    // Handle In-Meeting Live Chat Messages
    newSocket.on('receive_meeting_message', (msg) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.sender?._id === msg.sender?._id && m.content === msg.content && Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 2000)) {
          return prev;
        }
        return [...prev, msg];
      });
    });

    // Handle Host Moderation Actions
    newSocket.on('muted_by_host', () => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
      setIsMuted(true);
      newSocket.emit('toggle_media_state', { meetingId, isMuted: true, isVideoOff });
      alert('You have been muted by the meeting host.');
    });

    newSocket.on('unmuted_by_host', () => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
      }
      setIsMuted(false);
      newSocket.emit('toggle_media_state', { meetingId, isMuted: false, isVideoOff });
      alert('You have been unmuted by the meeting host.');
    });

    newSocket.on('removed_by_host', () => {
      alert('You were removed from the meeting by the host and cannot rejoin.');
      handleLeaveMeeting();
    });

    newSocket.on('meeting_ended_by_host', () => {
      alert('The meeting host has ended the conference.');
      handleLeaveMeeting();
    });

    setSocket(newSocket);
  };

  const cleanupLocalMedia = () => {
    peerConnectionsRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    setPeerStreams({});

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      screenStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (socketRef.current) {
      socketRef.current.emit('leave_meeting_room', { meetingId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const handleLeaveMeeting = () => {
    cleanupLocalMedia();
    navigate('/meetings');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextMuteState = !isMuted;
        audioTracks.forEach((t) => (t.enabled = !nextMuteState));
        setIsMuted(nextMuteState);

        if (socket) {
          socket.emit('toggle_media_state', {
            meetingId,
            isMuted: nextMuteState,
            isVideoOff,
          });
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextVideoOffState = !isVideoOff;
        videoTracks.forEach((t) => (t.enabled = !nextVideoOffState));
        setIsVideoOff(nextVideoOffState);

        if (socket) {
          socket.emit('toggle_media_state', {
            meetingId,
            isMuted,
            isVideoOff: nextVideoOffState,
          });
        }
      }
    }
  };

  // Screen Sharing Feature
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } catch (err) {
        console.error('Screen sharing canceled or failed:', err);
      }
    }
  };

  // Host Actions
  const handleHostMuteUser = (targetUserId) => {
    if (!socket || !isHost) return;
    socket.emit('host_mute_user', { meetingId, targetUserId });
  };

  const handleHostUnmuteUser = (targetUserId) => {
    if (!socket || !isHost) return;
    socket.emit('host_unmute_user', { meetingId, targetUserId });
  };

  const handleHostRemoveUser = (targetUserId) => {
    if (!socket || !isHost) return;
    if (!window.confirm('Remove this user from the meeting? They will not be able to rejoin.')) return;
    socket.emit('host_remove_user', { meetingId, targetUserId });
  };

  const handleHostEndMeeting = async () => {
    if (!isHost) return;
    if (!window.confirm('End this meeting for all participants?')) return;

    try {
      await api.put(`/meetings/${meetingId}/end`);
      if (socket) {
        socket.emit('host_end_meeting', { meetingId });
      }
      handleLeaveMeeting();
    } catch (err) {
      alert('Failed to end meeting');
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    const content = chatInput.trim();
    const msgData = {
      sender: { _id: user._id, name: user.name, role: user.role },
      content,
      createdAt: new Date(),
    };

    setChatMessages((prev) => [...prev, msgData]);
    setChatInput('');

    socket.emit('send_meeting_message', {
      meetingId,
      content,
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top Meeting Header */}
      <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 text-white flex justify-between items-center z-10">
        <div>
          <h1 className="text-sm font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {meeting?.title}
          </h1>
          <p className="text-[11px] text-slate-400">
            Host: {meeting?.host?.name} ({meeting?.host?.role}) &bull; {peers.length + 1} Participant(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showChat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Live Chat
          </button>

          {isHost && (
            <button
              onClick={handleHostEndMeeting}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1 shadow-sm"
            >
              <PhoneOff className="w-3.5 h-3.5" /> End Meeting for All
            </button>
          )}
        </div>
      </div>

      {/* Main Video View & Side Chat Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIDEO CONFERENCE GRID / PINNED FOCUS VIEW */}
        <div className="flex-1 p-6 overflow-y-auto">
          {pinnedUser ? (
            /* PINNED FOCUS VIEW */
            <div className="h-full flex flex-col space-y-4">
              <div className="flex-1 bg-slate-900 rounded-2xl border-2 border-indigo-500 overflow-hidden relative flex items-center justify-center">
                {pinnedUser === 'local' ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full relative">
                    <video
                      ref={(el) => {
                        if (el && peerStreams[pinnedUser]) {
                          el.srcObject = peerStreams[pinnedUser];
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <button
                  onClick={() => setPinnedUser(null)}
                  className="absolute top-3 right-3 p-2 bg-slate-950/80 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Pin className="w-4 h-4 text-indigo-400" /> Unpin Video
                </button>
              </div>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Local User Stream Box */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center group min-h-[240px]">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff && !isScreenSharing ? 'hidden' : 'block'}`}
                />
                {isVideoOff && !isScreenSharing && (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white">
                      {user?.name?.charAt(0) || 'You'}
                    </div>
                    <span className="text-xs font-semibold text-slate-300">You (Camera Off)</span>
                  </div>
                )}
                <span className="absolute bottom-3 left-3 bg-slate-950/80 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <span>You ({user?.name}) {isHost && '• Host'}</span>
                  {isMuted && <MicOff className="w-3 h-3 text-rose-400" />}
                </span>
                <button
                  onClick={() => setPinnedUser('local')}
                  className="hidden group-hover:flex absolute top-3 right-3 p-1.5 bg-slate-950/80 text-white rounded-lg"
                  title="Pin Video"
                >
                  <Pin className="w-4 h-4" />
                </button>
              </div>

              {/* Connected Remote Peers Streams */}
              {peers.filter((peer) => peer.user?._id !== user?._id).map((peer) => (
                <PeerVideo
                  key={peer.socketId || peer.user._id}
                  peer={peer}
                  stream={peerStreams[peer.socketId]}
                  isPinned={pinnedUser === peer.socketId || pinnedUser === peer.user._id}
                  onPin={() => setPinnedUser(peer.socketId || peer.user._id)}
                  isHost={isHost}
                  onHostMute={handleHostMuteUser}
                  onHostUnmute={handleHostUnmuteUser}
                  onHostRemove={handleHostRemoveUser}
                />
              ))}
            </div>
          )}
        </div>

        {/* IN-MEETING LIVE GROUP CHAT DRAWER */}
        {showChat && (
          <div className="w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 flex flex-col justify-between z-20">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-white bg-slate-950/60">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> Live Conference Chat
              </h3>
              <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No messages sent yet in this live meeting.
                </div>
              ) : (
                chatMessages.map((m, idx) => (
                  <div key={idx} className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-2xl space-y-1 text-xs text-slate-100 shadow-sm">
                    <div className="flex justify-between items-baseline text-[10px]">
                      <span className="font-bold text-indigo-300">{m.sender?.name} ({m.sender?.role || 'User'})</span>
                      <span className="text-slate-400">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-relaxed font-medium">{m.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-800 flex gap-2 bg-slate-950/60">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message all attendees..."
                className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold disabled:opacity-40 transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Control Toolbar */}
      <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex justify-center items-center gap-4 z-10">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all ${
            isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          <span>{isVideoOff ? 'Camera On' : 'Camera Off'}</span>
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all ${
            isScreenSharing ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          <MonitorUp className="w-5 h-5" />
          <span>{isScreenSharing ? 'Stop Presenting' : 'Present Screen'}</span>
        </button>

        <button
          onClick={handleLeaveMeeting}
          className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <PhoneOff className="w-5 h-5" />
          <span>Leave Call</span>
        </button>
      </div>
    </div>
  );
};
