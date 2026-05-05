import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebRTC Hook - Senior Production Implementation
 * Supports Multi-User Mesh Topology with Mandatory STUN/TURN fallback.
 */
export const useWebRTC = (socket, meetingId, secretKey) => {
    const [peers, setPeers] = useState([]); // [{ peerId, userId, stream }]
    const [localStream, setLocalStream] = useState(null);
    const peersRef = useRef({}); // { socketId: RTCPeerConnection }

    const rtcConfig = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject"
            }
        ],
        iceCandidatePoolSize: 10,
    };

    const initLocalCamera = useCallback(async () => {
        // Use a functional check instead of depending on localStream
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            });
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('❌ Camera Access Denied:', err);
            return null;
        }
    }, []); // Removed localStream dependency to prevent infinite loops

    const createPeerConnection = useCallback((targetId, stream, forceTurn = false) => {
        const pc = new RTCPeerConnection({
            ...rtcConfig,
            iceTransportPolicy: forceTurn ? 'relay' : 'all'
        });
        
        let isUsingTurnFallback = forceTurn;

        // 1. Add local tracks to the connection
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        // 2. Handle outgoing ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('ice-candidate', {
                    target: targetId,
                    candidate: event.candidate
                });
            }
        };

        // 3. Handle incoming Remote Stream
        pc.ontrack = (event) => {
            console.log(`📺 Received remote track from ${targetId}`);
            setPeers(prev => {
                const existing = prev.find(p => p.peerId === targetId);
                if (existing) return prev;
                return [...prev, { peerId: targetId, stream: event.streams[0] }];
            });
        };

        // 4. Connection State Management
        pc.oniceconnectionstatechange = async () => {
            console.log(pc.iceConnectionState);
            if (['disconnected', 'failed'].includes(pc.iceConnectionState)) {
                if (!isUsingTurnFallback) {
                    console.log(`🔄 Attempting TURN fallback for [${targetId}]`);
                    isUsingTurnFallback = true;
                    try {
                        pc.setConfiguration({ ...rtcConfig, iceTransportPolicy: 'relay' });
                        const offer = await pc.createOffer({ iceRestart: true });
                        await pc.setLocalDescription(offer);
                        socket.emit('offer', { target: targetId, sdp: pc.localDescription });
                    } catch (e) {
                        console.error('❌ TURN fallback failed:', e);
                        closePeer(targetId);
                    }
                } else {
                    closePeer(targetId);
                }
            } else if (pc.iceConnectionState === 'closed') {
                closePeer(targetId);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`📡 Connection State [${targetId}]: ${pc.connectionState}`);
            if (pc.connectionState === 'closed') {
                closePeer(targetId);
            }
        };

        return pc;
    }, [socket]);

    const closePeer = useCallback((userId) => {
        if (peersRef.current[userId]) {
            peersRef.current[userId].close();
            delete peersRef.current[userId];
        }
        setPeers(prev => prev.filter(p => p.peerId !== userId));
    }, []);

    useEffect(() => {
        if (!socket || !localStream || !meetingId) return;

        // --- AUTHENTICATED JOIN ---
        console.log(`📡 JoiningAuthenticatedRoom: ${meetingId}`);
        socket.emit('join-room', { roomId: meetingId, secretKey, userName: 'User_' + socket.id.substring(0,4) });

        // --- SIGNALING HANDLERS ---

        const handleAllUsers = (userIds) => {
            console.log('👥 Room participants discovered:', userIds);
            userIds.forEach(async (targetId) => {
                if (peersRef.current[targetId]) return;
                
                const pc = createPeerConnection(targetId, localStream);
                peersRef.current[targetId] = pc;

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('offer', { target: targetId, sdp: pc.localDescription });
            });
        };

        const handleUserJoined = ({ caller, userName }) => {
            console.log(`👤 New user joined: ${userName} [${caller}]`);
            if (peersRef.current[caller]) return;

            const pc = createPeerConnection(caller, localStream);
            peersRef.current[caller] = pc;
        };

        const handleOffer = async ({ sdp, caller }) => {
            console.log('✉️ Received offer from:', caller);
            let pc = peersRef.current[caller];
            if (!pc) {
                pc = createPeerConnection(caller, localStream);
                peersRef.current[caller] = pc;
            }

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { target: caller, sdp: pc.localDescription });
        };

        const handleAnswer = async ({ sdp, caller }) => {
            console.log('✅ Received answer from:', caller);
            const pc = peersRef.current[caller];
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        };

        const handleIceCandidate = async ({ candidate, from }) => {
            const pc = peersRef.current[from];
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('❌ ICE Integration Error:', e);
                }
            }
        };

        const handleUserLeft = (userId) => {
            console.log('👋 Peer left:', userId);
            closePeer(userId);
        };

        const handleError = (data) => {
            console.error('🚫 Auth/Signaling Error:', data.message);
            // Optionally redirect or show UI toast here
        };

        socket.on('all-users', handleAllUsers);
        socket.on('user-joined', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('user-left', handleUserLeft);
        socket.on('error', handleError);

        return () => {
            socket.off('all-users');
            socket.off('user-joined');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('user-left');
            socket.off('error');
            Object.keys(peersRef.current).forEach(closePeer);
        };
    }, [socket, meetingId, secretKey, localStream, createPeerConnection, closePeer]);

    return { peers, localStream, initLocalCamera };
};

export default useWebRTC;