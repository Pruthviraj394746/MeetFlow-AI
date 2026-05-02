import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, Settings, ShieldCheck, ArrowRight, Video as VidIcon } from 'lucide-react';

/**
 * Lobby Component - Production Hardware Check
 * Users preview their gear before the signaling starts in MeetingRoom.
 */
const Lobby = () => {
    const { id: meetingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const secretKey = urlParams.get('key');

    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        startPreview();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startPreview = async () => {
        setIsLoading(true);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Lobby Setup Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => (track.enabled = !isMicOn));
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCam = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => (track.enabled = !isCamOn));
            setIsCamOn(!isCamOn);
        }
    };

    const handleJoin = () => {
        // Stop preview tracks so MeetingRoom can acquire the media session cleanly
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Pass essential flags to MeetingRoom via URL
        const path = `/meeting/${meetingId}?key=${secretKey || ''}&mic=${isMicOn}&cam=${isCamOn}`;
        navigate(path);
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mb-4" />
                <p className="text-slate-400 font-medium">Preparing Hardware Preview...</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden font-sans">
            <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 lg:p-16 gap-12 max-w-7xl mx-auto w-full">
                
                {/* Visual Preview */}
                <div className="flex-1 w-full max-w-3xl aspect-video relative rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-2xl border border-white/5 ring-1 ring-white/10 group">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full" />
                        </div>
                    )}
                    
                    {!isCamOn && !isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 z-10">
                            <VideoOff className="w-24 h-24 text-slate-600 mb-4 opacity-30" />
                            <p className="text-slate-400 font-medium">Camera Stopped</p>
                        </div>
                    )}

                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover transition-opacity duration-700 ${isCamOn ? 'opacity-100' : 'opacity-0'}`} 
                    />

                    {/* Quick Toggles Overlay */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={toggleMic} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMicOn ? 'bg-slate-900/60 backdrop-blur-xl hover:bg-slate-800' : 'bg-red-500 shadow-lg shadow-red-500/20'}`}>
                            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                        </button>
                        <button onClick={toggleCam} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isCamOn ? 'bg-slate-900/60 backdrop-blur-xl hover:bg-slate-800' : 'bg-red-500 shadow-lg shadow-red-500/20'}`}>
                            {isCamOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Status and Action Panel */}
                <div className="w-full lg:w-[400px] flex flex-col space-y-10">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 text-brand-500">
                             <VidIcon className="w-8 h-8" />
                             <span className="text-xs font-black uppercase tracking-[0.3em] font-mono">Hardware Check</span>
                        </div>
                        <h1 className="text-5xl font-black leading-none tracking-tight">Ready to <br/> launch?</h1>
                        <p className="text-slate-500 text-lg leading-relaxed">Check your audio and video settings before the meeting begins. Everything is set!</p>
                    </div>

                    <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm font-medium">Meeting ID</span>
                            <span className="font-mono text-brand-400 font-bold">{meetingId}</span>
                        </div>
                        <div className="h-px bg-white/5 w-full" />
                        <div className="flex items-center justify-between text-green-500">
                            <span className="text-xs font-bold uppercase tracking-widest">Access Status</span>
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>

                    <button 
                        onClick={handleJoin}
                        className="w-full bg-brand-500 hover:bg-brand-600 text-white p-6 rounded-[1.5rem] font-black text-2xl flex items-center justify-center space-x-4 shadow-2xl shadow-brand-500/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
                    >
                        <span>Join Now</span>
                        <ArrowRight className="w-8 h-8" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Lobby;
