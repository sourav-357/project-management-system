import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';

export const CallModal = ({
  socket,
  currentUser,
  activeCall, // { mode: 'outgoing' | 'incoming' | 'connected', callType: 'one_to_one_voice' | 'one_to_one_video', partner, offer }
  onCloseCall,
}) => {
  const [callState, setCallState] = useState(activeCall?.mode || 'outgoing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(activeCall?.callType === 'one_to_one_voice');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const isVideoCall = activeCall?.callType === 'one_to_one_video';

  useEffect(() => {
    // 1. Listen for termination and signaling socket events at component mount level
    if (socket) {
      const handleRemoteCallEnded = () => {
        hangUp(false);
      };

      const handleRemoteCallRejected = () => {
        alert('Call was declined');
        hangUp(false);
      };

      socket.on('call_ended', handleRemoteCallEnded);
      socket.on('call_rejected', handleRemoteCallRejected);

      setupWebRTC();

      return () => {
        socket.off('call_ended', handleRemoteCallEnded);
        socket.off('call_rejected', handleRemoteCallRejected);
        cleanupCall();
      };
    } else {
      setupWebRTC();
      return () => {
        cleanupCall();
      };
    }
  }, []);

  const setupWebRTC = async () => {
    try {
      // 1. Get user media (mic & camera)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      peerConnectionRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Remote stream track handler
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && activeCall?.partner?._id) {
          socket.emit('ice_candidate', {
            targetId: activeCall.partner._id,
            candidate: event.candidate,
          });
        }
      };

      // Socket signal listeners for connection & candidates
      if (socket) {
        socket.on('call_accepted', async ({ answer }) => {
          if (pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            setCallState('connected');
          }
        });

        socket.on('ice_candidate', async ({ candidate }) => {
          if (pc && candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          }
        });
      }

      // If caller -> create offer and send to partner
      if (activeCall?.mode === 'outgoing') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('initiate_call', {
          recipientId: activeCall.partner._id,
          callType: activeCall.callType,
          offer,
        });
      }
    } catch (err) {
      console.error('Error setting up WebRTC call:', err);
      alert('Unable to access microphone or camera for call');
      onCloseCall();
    }
  };

  const handleAcceptCall = async () => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc || !activeCall?.offer) return;

      await pc.setRemoteDescription(new RTCSessionDescription(activeCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer_call', {
        callerId: activeCall.partner._id,
        answer,
        callType: activeCall.callType,
      });

      setCallState('connected');
    } catch (err) {
      console.error('Failed to accept call:', err);
    }
  };

  const handleDeclineCall = () => {
    if (socket && activeCall?.partner?._id) {
      socket.emit('reject_call', { callerId: activeCall.partner._id });
    }
    hangUp(false);
  };

  // Immediate Hang Up on either side
  const hangUp = (emitEvent = true) => {
    if (emitEvent && socket && activeCall?.partner?._id) {
      socket.emit('end_call', { targetId: activeCall.partner._id });
    }
    cleanupCall();
    onCloseCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.enabled = false;
        track.stop();
      });
      localStreamRef.current = null;
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((t) => {
          t.enabled = false;
          t.stop();
        });
      }
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const stream = remoteVideoRef.current.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((t) => {
          t.enabled = false;
          t.stop();
        });
      }
      remoteVideoRef.current.srcObject = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.enabled = false;
          sender.track.stop();
        }
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socket) {
      socket.off('call_accepted');
      socket.off('ice_candidate');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto p-4 sm:p-6 flex flex-col justify-between min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center text-white pb-3 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
            {activeCall?.partner?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">{activeCall?.partner?.name}</h2>
            <p className="text-xs text-indigo-400 font-semibold capitalize flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {callState === 'outgoing' ? 'Ringing...' : callState === 'incoming' ? 'Incoming Call' : 'Call in Progress'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Responsive Scrollable Video View */}
      <div className="flex-1 my-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center min-h-0">
        {/* LOCAL STREAM BOX */}
        <div className="relative w-full aspect-video md:aspect-auto md:h-full md:min-h-[300px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex items-center justify-center">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
          />
          {isVideoOff && (
            <div className="flex flex-col items-center gap-2 text-slate-400 p-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white shadow-md">
                {currentUser?.name?.charAt(0) || 'Y'}
              </div>
              <span className="text-xs font-bold text-slate-300">You ({currentUser?.name}) &bull; Camera Off</span>
            </div>
          )}
          <span className="absolute bottom-3 left-3 bg-slate-950/80 text-white text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-800 shadow-sm backdrop-blur-sm">
            You ({currentUser?.name})
          </span>
        </div>

        {/* REMOTE STREAM BOX */}
        <div className="relative w-full aspect-video md:aspect-auto md:h-full md:min-h-[300px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {callState !== 'connected' && (
            <div className="flex flex-col items-center gap-2 text-slate-400 p-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-white shadow-md animate-bounce">
                {activeCall?.partner?.name?.charAt(0) || 'P'}
              </div>
              <span className="text-xs font-bold text-slate-300">
                {callState === 'outgoing' ? 'Waiting for response...' : 'Incoming Call...'}
              </span>
            </div>
          )}
          <span className="absolute bottom-3 left-3 bg-slate-950/80 text-white text-[11px] font-bold px-3 py-1 rounded-lg border border-slate-800 shadow-sm backdrop-blur-sm">
            {activeCall?.partner?.name}
          </span>
        </div>
      </div>

      {/* Floating Responsive Sticky Bottom Control Bar */}
      <div className="sticky bottom-2 z-20 bg-slate-900/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl flex justify-center items-center gap-3 sm:gap-4 max-w-md mx-auto w-full shrink-0">
        {callState === 'incoming' ? (
          <>
            <button
              onClick={handleAcceptCall}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
              title="Accept Call"
            >
              <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={handleDeclineCall}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-all shadow-lg active:scale-95"
              title="Decline Call"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
                isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {isVideoCall && (
              <button
                onClick={toggleVideo}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            <button
              onClick={() => hangUp(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-all shadow-lg active:scale-95"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
