import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Video, Search, X, ShieldAlert, Key, Users, Copy, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [newMeetingData, setNewMeetingData] = useState(null); // { meetingId, secretKey }

  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [joinSecretKey, setJoinSecretKey] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/meetings`)
      .then(res => res.json())
      .then(data => Array.isArray(data) && setMeetings(data))
      .catch(() => console.log("Meeting fetch fallback"));
  }, []);

  const handleCreateMeeting = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Executive Session' })
      });
      const data = await res.json();
      setNewMeetingData(data); // Shows the success popup with credentials
    } catch (err) {
      console.error("Failed to create meeting", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinValidation = async (e) => {
    e.preventDefault();
    setJoinError('');
    setIsProcessing(true);
    
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/meetings/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ meetingId: joinMeetingId.trim(), secretKey: joinSecretKey.trim() })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            navigate(`/lobby/${joinMeetingId.trim()}?key=${joinSecretKey.trim()}`);
        } else {
            setJoinError(data.error || 'Access Denied: Please verify your ID and Secret Key.');
        }
    } catch (err) {
        setJoinError('Network connectivity error. Please try again.');
    } finally {
        setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* 🚀 HIGH-END HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-8 glass p-10 rounded-[3rem] border-slate-700/50 bg-slate-900 text-white shadow-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-5xl font-black mb-3 tracking-tighter">Nexus AI <br/> Meeting Platform</h1>
          <p className="text-slate-400 text-xl font-medium max-w-md">Secure, real-time collaboration with intelligent monitoring.</p>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-5 w-full md:w-auto">
            <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateMeeting}
                disabled={isProcessing}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-4 shadow-2xl shadow-brand-500/30 transition-all"
            >
                <Video className="w-7 h-7" />
                <span>{isProcessing ? 'Initializing...' : 'New Meeting'}</span>
            </motion.button>

            <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsJoinModalOpen(true)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-4 transition-all border border-white/10 ring-1 ring-white/10"
            >
                <Users className="w-7 h-7" />
                <span>Join Meeting</span>
            </motion.button>
        </div>
      </header>

      {/* 📋 RECENT SESSIONS */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black flex items-center tracking-tight">
                Latest Collaborations
            </h2>
            <div className="flex bg-slate-200 dark:bg-slate-900 rounded-full p-1.5 border border-white/5">
                <button className="px-5 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-sm font-bold">All</button>
                <button className="px-5 py-2 rounded-full text-slate-500 text-sm font-bold hover:text-slate-200 transition-colors">Private</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {meetings.length > 0 ? meetings.map(m => (
                <motion.div 
                    key={m._id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => navigate(`/lobby/${m._id}`)} 
                    className="glass p-8 rounded-[2.5rem] border-slate-800/50 hover:border-brand-500/50 transition-all cursor-pointer group hover:bg-slate-900/40"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                            <Video className="w-6 h-6 text-brand-500 group-hover:text-white" />
                        </div>
                        <span className="text-xs font-mono text-slate-500 tracking-tighter">ID: {m._id}</span>
                    </div>
                    <h3 className="font-black text-2xl mb-2 group-hover:text-brand-400 transition-colors truncate">{m.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-6">Generated on {new Date(m.createdAt).toLocaleDateString()}</p>
                    
                    <div className="flex -space-x-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-4 border-slate-950 flex items-center justify-center text-[10px] font-bold">JD</div>
                        <div className="w-10 h-10 rounded-full bg-brand-500 border-4 border-slate-950 flex items-center justify-center text-[10px] font-bold">AI</div>
                    </div>
                </motion.div>
            )) : (
                <div className="col-span-full py-32 text-center text-slate-500 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-white/5">
                    No session history detected. Select "New Meeting" to start your first collaborative workspace.
                </div>
            )}
        </div>
      </div>

      {/* 🔐 JOIN MODAL */}
      <AnimatePresence>
        {isJoinModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    className="glass w-full max-w-lg p-10 rounded-[3.5rem] border-slate-700/50 bg-slate-900 shadow-4xl relative"
                >
                    <button onClick={() => setIsJoinModalOpen(false)} className="absolute top-8 right-8 p-3 text-slate-500 hover:text-white rounded-full hover:bg-white/5 transition-all">
                        <X className="w-8 h-8" />
                    </button>

                    <div className="text-center mb-10">
                        <div className="w-24 h-24 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-brand-500/20 shadow-2xl">
                            <Key className="w-12 h-12 text-brand-500" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tight">Enter Conference</h2>
                        <p className="text-slate-500 mt-3 text-lg">Input your meeting credentials to proceed.</p>
                    </div>

                    <form onSubmit={handleJoinValidation} className="space-y-8">
                        <div>
                            <label className="block text-xs font-black text-brand-500 uppercase tracking-[0.2em] mb-3 ml-2">Meeting Identity</label>
                            <input 
                                value={joinMeetingId}
                                onChange={e => setJoinMeetingId(e.target.value)}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-mono text-lg text-white"
                                placeholder="Meeting Room ID"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-brand-500 uppercase tracking-[0.2em] mb-3 ml-2">Access Key (6-Digits)</label>
                            <input 
                                maxLength={6}
                                value={joinSecretKey}
                                onChange={e => setJoinSecretKey(e.target.value)}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-8 py-5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-mono tracking-[0.4em] text-2xl text-white text-center"
                                placeholder="••••••"
                            />
                        </div>

                        {joinError && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-3 text-red-500 bg-red-500/10 p-5 rounded-2xl border border-red-500/20 font-bold text-sm">
                                <ShieldAlert className="w-5 h-5 shrink-0" />
                                <span>{joinError}</span>
                            </motion.div>
                        )}

                        <button 
                            disabled={isProcessing}
                            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-6 rounded-[1.5rem] font-black text-2xl shadow-3xl shadow-brand-500/30 transition-all hover:scale-[1.02]"
                        >
                            {isProcessing ? 'Validating...' : 'Authenticate'}
                        </button>
                    </form>
                </motion.div>
            </div>
        )}

        {/* 🎉 SUCCESS MODAL (After Creating) */}
        {newMeetingData && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass w-full max-w-xl p-12 rounded-[4rem] border-brand-500/30 bg-slate-900 border"
                >
                    <div className="text-center mb-10">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tight">Success! Room Reserved.</h2>
                        <p className="text-slate-400 mt-4 text-lg">Share these credentials with your team.</p>
                    </div>

                    <div className="space-y-5 mb-10">
                        <div onClick={() => copyToClipboard(newMeetingData.meetingId)} className="group bg-slate-950 p-6 rounded-3xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-brand-500 transition-colors">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Room Identity</p>
                                <p className="font-mono text-xl text-brand-400 font-bold">{newMeetingData.meetingId}</p>
                            </div>
                            <Copy className="w-6 h-6 text-slate-700 group-hover:text-brand-500" />
                        </div>

                        <div onClick={() => copyToClipboard(newMeetingData.secretKey)} className="group bg-slate-950 p-6 rounded-3xl border border-white/5 flex items-center justify-between cursor-pointer hover:border-brand-500 transition-colors">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Secret Access Key</p>
                                <p className="font-mono text-2xl tracking-[0.3em] font-black text-white">{newMeetingData.secretKey}</p>
                            </div>
                            <Copy className="w-6 h-6 text-slate-700 group-hover:text-brand-500" />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setNewMeetingData(null)} className="flex-1 bg-slate-800 text-white py-5 rounded-2xl font-black text-lg">Dismiss</button>
                        <button onClick={() => navigate(`/lobby/${newMeetingData.meetingId}?key=${newMeetingData.secretKey}`)} className="flex-2 bg-brand-500 text-white py-5 px-10 rounded-2xl font-black text-lg shadow-xl shadow-brand-500/20">Enter Lobby</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
