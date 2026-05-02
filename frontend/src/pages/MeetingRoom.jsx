import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video as VidIcon, VideoOff, MessageSquare, Users, CalendarX, Copy, ShieldCheck, Settings, Info, MessageCircle, ListChecks } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import GroupChat from '../components/GroupChat';

/**
 * Video Player Component
 * Handles local/remote streams with elegant UI state.
 */
const VideoPlayer = ({ stream, isLocal, name }) => {
    const videoRef = useRef();
    useEffect(() => {
        if (videoRef.current && stream) videoRef.current.srcObject = stream;
    }, [stream]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-slate-900/40 rounded-[2rem] overflow-hidden aspect-video border border-white/5 shadow-3xl ring-1 ring-white/10 hover:ring-brand-500/50 transition-all"
        >
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted={isLocal} 
                className="w-full h-full object-cover transition-transform group-hover:scale-[1.02] duration-700" 
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            
            <div className="absolute bottom-6 left-6 flex items-center space-x-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
                <div className={`w-2.5 h-2.5 rounded-full ${isLocal ? 'bg-brand-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-sm font-bold tracking-tight">{name || (isLocal ? 'You' : 'Guest')}</span>
            </div>
            
            {isLocal && (
                <div className="absolute top-6 right-6 bg-brand-500/80 backdrop-blur-xl text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    Local Feed
                </div>
            )}
        </motion.div>
    );
};

const MeetingRoom = () => {
    const { id: meetingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useSocket();
    
    // Parse Lobby Settings
    const urlParams = new URLSearchParams(location.search);
    const secretKey = urlParams.get('key');
    const initMic = urlParams.get('mic') === 'true';
    const initCam = urlParams.get('cam') === 'true';

    const [userName] = useState('Speaker_' + Math.floor(Math.random() * 99));
    const [meetingTitle, setMeetingTitle] = useState('Nexus Session');
    const [activeSidebar, setActiveSidebar] = useState('participants'); // 'participants', 'transcripts', 'tasks'
    const [error, setError] = useState('');

    // --- WEBRTC Logic ---
    const { peers, localStream, initLocalCamera } = useWebRTC(socket, meetingId, secretKey);

    const hasInitialized = useRef(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        console.log('🚀 MeetingRoom Mounted:', { meetingId, secretKey, initMic, initCam });

        // Validation check: If no key, redirect to Lobby (protection)
        if (!secretKey) {
            console.error('❌ Missing secretKey - Redirecting');
            setError('Access Denied: Missing authentication key. Please enter from the lobby.');
            setIsInitializing(false);
            return;
        }

        if (!socket) {
            console.warn('⚠️ Socket not initialized yet');
        }

        // Fetch basic meeting info
        fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/meetings/${meetingId}`)
            .then(res => res.json())
            .then(data => data.meeting && setMeetingTitle(data.meeting.title))
            .catch(() => console.error("Meeting fetching error"));

        // Initialize Camera with Lobby Settings (Non-blocking)
        initLocalCamera().then(stream => {
            console.log('📸 Media initialized:', !!stream);
            if (stream) {
                stream.getAudioTracks().forEach(t => t.enabled = initMic);
                stream.getVideoTracks().forEach(t => t.enabled = initCam);
            }
            setIsInitializing(false);
        }).catch(err => {
            console.error('❌ Media failure:', err);
            setIsInitializing(false);
        });

    }, [meetingId, secretKey, socket]); // Simplified dependencies to avoid loops

    if (isInitializing) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} 
                    className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full mb-6" 
                />
                <h2 className="text-xl font-bold text-slate-400">Securing your session...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-center p-10">
                <ShieldCheck className="w-20 h-20 text-red-500/50 mb-8" />
                <h2 className="text-4xl font-black mb-4">Secure Gateway Active</h2>
                <p className="text-slate-500 max-w-sm mb-10">{error}</p>
                <button onClick={() => navigate('/')} className="bg-brand-500 px-10 py-4 rounded-2xl font-black">Return Home</button>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
            
            {/* 🖥️ Top Navigation Bar */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-slate-900/40 backdrop-blur-3xl z-40">
                <div className="flex items-center space-x-8">
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                             <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Live Workspace</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight max-w-[200px] truncate">{meetingTitle}</h1>
                    </div>
                    
                    <div className="h-8 w-px bg-white/10 hidden md:block" />
                    
                    <div className="hidden lg:flex items-center space-x-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-white/5">
                        <span className="text-xs font-mono text-slate-500">ID: {meetingId}</span>
                        <Copy onClick={() => navigator.clipboard.writeText(meetingId)} className="w-4 h-4 text-brand-500 cursor-pointer hover:text-white transition-colors" />
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="flex items-center -space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-4 border-slate-900 z-10 flex items-center justify-center text-[10px] font-bold">U1</div>
                        {peers.map((p, i) => (
                            <div key={p.peerId} className={`w-10 h-10 rounded-full bg-brand-500 border-4 border-slate-900 z-${20 + i} flex items-center justify-center text-[10px] font-bold`}>{p.peerId.substring(0,2)}</div>
                        ))}
                    </div>
                    
                    <button onClick={() => navigate('/')} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-8 py-3 rounded-2xl font-black text-sm transition-all flex items-center space-x-2 border border-red-500/20 shadow-xl shadow-red-500/5">
                        <CalendarX className="w-5 h-5" />
                        <span>Leave session</span>
                    </button>
                </div>
            </header>

            {/* 📹 Main Content Layout */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* 1. Primary Video Grid */}
                <main className="flex-1 p-8 overflow-y-auto content-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1700px] mx-auto w-full">
                    
                    {/* Local Participant */}
                    <VideoPlayer stream={localStream} isLocal={true} name={`${userName} (You)`} />

                    {/* Remote Participants (Full Mesh) */}
                    {peers.map((peer) => (
                        <VideoPlayer key={peer.peerId} stream={peer.stream} isLocal={false} name={peer.userName || `Remote Participant`} />
                    ))}

                    {/* Alone State Card */}
                    {peers.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }}
                            className="col-span-1 lg:col-span-1 flex flex-col items-center justify-center p-12 bg-white/5 border border-dashed border-white/10 rounded-[3rem] text-slate-500"
                        >
                            <div className="w-20 h-20 bg-brand-500/10 rounded-[2rem] flex items-center justify-center mb-6">
                                <Users className="w-10 h-10 text-brand-500 opacity-40" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-300">Workspace is empty</h3>
                            <p className="text-center text-sm mt-3 px-6 max-w-xs">Waiting for participants to authenticate and join your secure meeting room.</p>
                        </motion.div>
                    )}
                </main>

                {/* 2. Collaborative Sidebar (Right) */}
                <aside className="w-[380px] border-l border-white/5 bg-slate-950/40 backdrop-blur-3xl hidden xl:flex flex-col">
                    <div className="flex h-20 border-b border-white/5 p-2">
                        {[
                            { id: 'participants', icon: Users, label: 'People' },
                            { id: 'chat', icon: MessageSquare, label: 'Chat' },
                            { id: 'transcripts', icon: MessageCircle, label: 'Transcripts' },
                            { id: 'tasks', icon: ListChecks, label: 'Actions' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveSidebar(tab.id)}
                                className={`flex-1 flex items-center justify-center rounded-2xl transition-all ${activeSidebar === tab.id ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <tab.icon className="w-5 h-5 mr-2" />
                                <span className="text-xs font-bold">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            {activeSidebar === 'participants' && (
                                <motion.div key="p-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                                    <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Live Attendees ({peers.length + 1})</h4>
                                    <div className="flex items-center p-4 bg-brand-500/10 rounded-2xl border border-brand-500/20">
                                        <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center font-bold mr-4">You</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold">{userName}</p>
                                            <p className="text-[10px] text-brand-400 font-bold uppercase tracking-tight">Meeting Host</p>
                                        </div>
                                    </div>
                                    {peers.map(p => (
                                        <div key={p.peerId} className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center font-bold mr-4">GU</div>
                                            <p className="text-sm font-bold">Guest_{p.peerId.substring(0,4)}</p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                            
                            {activeSidebar === 'transcripts' && (
                                <motion.div key="t-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}  className="text-center py-20 text-slate-500">
                                    <p className="text-sm italic">AI Transcription is active and listening...</p>
                                </motion.div>
                            )}

                            {activeSidebar === 'tasks' && (
                                <motion.div key="k-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}  className="text-center py-20 text-slate-500">
                                    <p className="text-sm italic">Capture action items automatically with GPT Monitoring.</p>
                                </motion.div>
                            )}

                            {activeSidebar === 'chat' && (
                                <motion.div key="c-tab" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="h-full min-h-[400px]">
                                    <GroupChat roomId={meetingId} userName={userName} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </aside>
            </div>

            {/* 🕹️ Floating Command Toolbar */}
            <footer className="h-32 flex items-center justify-center translate-y-0 z-50">
                <div className="bg-slate-900/60 backdrop-blur-3xl px-12 py-5 rounded-[2.5rem] border border-white/10 flex items-center space-x-8 shadow-4xl shadow-black/50">
                    <button className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all group">
                        <Mic className="w-6 h-6 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    </button>
                    <button className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all group">
                        <VidIcon className="w-6 h-6 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    </button>
                    
                    <div className="w-px h-10 bg-white/10 mx-2" />

                    <button className="w-14 h-14 rounded-2xl bg-brand-500 hover:bg-brand-600 flex items-center justify-center transition-all shadow-xl shadow-brand-500/20" onClick={() => setActiveSidebar('chat')}>
                        <MessageSquare className="w-6 h-6" />
                    </button>
                    <button className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all group lg:hidden" onClick={() => setActiveSidebar('participants')}>
                        <Users className="w-6 h-6 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    </button>
                    
                    <div className="w-px h-10 bg-white/10 mx-2" />
                    
                    <button className="w-14 h-14 rounded-2xl bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-xl shadow-red-500/20" onClick={() => navigate('/')}>
                        <CalendarX className="w-6 h-6" />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MeetingRoom;
