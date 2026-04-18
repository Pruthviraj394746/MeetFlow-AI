import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { Send, Monitor, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_AUDIO_CHUNKS = 300;

const GroupChat = ({ roomId, userName, localStream }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioMimeTypeRef = useRef('audio/webm');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!socket || !roomId) return;

        // Sync old chat state
        socket.emit("sync-chat-state", roomId);

        const handleHistory = (history) => {
            setMessages(history);
            setTimeout(scrollToBottom, 100);
        };

        const handleReceive = (newMsg) => {
            setMessages((prev) => {
                // Deduplicate by msgId to prevent ghost duplicates
                if (prev.some(m => m.msgId === newMsg.msgId)) return prev;
                return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 50);
            
            // If we were the sender, clear sending state
            if (newMsg.userId === socket.id) {
                setIsSending(false);
            }
        };

        socket.on("chat-history", handleHistory);
        socket.on("receive-message", handleReceive);

        // Cleanup function for hooks
        return () => {
            socket.off("chat-history", handleHistory);
            socket.off("receive-message", handleReceive);
        };
    }, [socket, roomId]);

    useEffect(() => {
        if (!localStream || typeof MediaRecorder === 'undefined') return;

        const audioTracks = localStream.getAudioTracks();
        if (!audioTracks.length) return;

        const audioOnlyStream = new MediaStream(audioTracks);
        const preferredTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4'
        ];
        const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));

        try {
            const recorder = mimeType ? new MediaRecorder(audioOnlyStream, { mimeType }) : new MediaRecorder(audioOnlyStream);
            audioMimeTypeRef.current = recorder.mimeType || mimeType || 'audio/webm';

            recorder.ondataavailable = (event) => {
                if (!event.data || event.data.size === 0) return;
                audioChunksRef.current.push(event.data);
                if (audioChunksRef.current.length > MAX_AUDIO_CHUNKS) {
                    audioChunksRef.current.shift();
                }
            };

            recorder.start(1000);
            mediaRecorderRef.current = recorder;
        } catch (err) {
            console.error('Failed to initialize meeting audio recorder:', err);
        }

        return () => {
            const recorder = mediaRecorderRef.current;
            if (recorder && recorder.state !== 'inactive') recorder.stop();
            mediaRecorderRef.current = null;
            audioChunksRef.current = [];
        };
    }, [localStream]);

    const getRecordedAudioBlob = () => {
        if (!audioChunksRef.current.length) return null;
        return new Blob(audioChunksRef.current, { type: audioMimeTypeRef.current || 'audio/webm' });
    };

    const queryMeetFlowWithAudio = async (promptText) => {
        const audioBlob = getRecordedAudioBlob();
        if (!audioBlob) {
            throw new Error('No recorded audio available yet. Please speak for a few seconds and try again.');
        }

        const formData = new FormData();
        formData.append('roomId', roomId);
        formData.append('userName', userName || 'Guest');
        formData.append('prompt', promptText);
        formData.append('audio', audioBlob, `meeting-audio.${audioBlob.type.includes('ogg') ? 'ogg' : 'webm'}`);

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/ai/audio-query`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Failed to process audio query.');
        }

        return response.json();
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        
        if (!input.trim() || isSending) return;
        
        const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
        const text = input.trim();
        const meetFlowMatch = text.match(/^@meetflow\s+([\s\S]+)$/i);
        
        setIsSending(true);
        try {
            if (meetFlowMatch) {
                const promptText = meetFlowMatch[1].trim();

                socket.emit("send-message", {
                    roomId,
                    userId: socket.id,
                    userName: userName || 'Guest',
                    message: text,
                    deviceType,
                    aiHandled: true
                });

                const aiPayload = await queryMeetFlowWithAudio(promptText);
                socket.emit("send-ai-message", {
                    roomId,
                    message: aiPayload.answer
                });
                setIsSending(false);
            } else {
                socket.emit("send-message", {
                    roomId,
                    userId: socket.id,
                    userName: userName || 'Guest',
                    message: text,
                    deviceType
                });
            }
        } catch (err) {
            console.error('MeetFlow audio query failed:', err);
            socket.emit("send-ai-message", {
                roomId,
                message: err.message || 'I could not process the latest meeting audio right now.'
            });
            setIsSending(false);
        }
        
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
            
            {/* Fixed Header */}
            <div className="flex-none p-4 border-b border-white/5 bg-slate-950/50">
                <h4 className="text-slate-200 text-xs font-black uppercase tracking-widest flex items-center">
                    <span className="w-2 h-2 rounded-full bg-brand-500 mr-2 animate-pulse"></span>
                    Live Chat
                </h4>
            </div>

            {/* Message List - Flex Grow with specific scrolling properties for Mobile */}
            <div 
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-50">
                        <Send className="w-8 h-8" />
                        <p className="text-sm font-medium">Start the conversation</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msgAction) => {
                            const isMe = msgAction.userId === socket.id;
                            const isAi = msgAction.userId === 'meetflow-ai';
                            
                            return (
                                <motion.div 
                                    key={msgAction.msgId}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {isMe ? 'You' : (isAi ? 'MeetFlow AI' : msgAction.userName)}
                                        </span>
                                        <div className="flex items-center space-x-1 opacity-50">
                                            {isAi ? null : msgAction.deviceType === 'Mobile' ? (
                                                <Smartphone className="w-3 h-3 text-slate-500" />
                                            ) : (
                                                <Monitor className="w-3 h-3 text-slate-500" />
                                            )}
                                        </div>
                                        <span className="text-[9px] text-slate-600">
                                            {new Date(msgAction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    
                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-brand-500 text-white rounded-tr-sm' : (isAi ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 rounded-tl-sm' : 'bg-white/10 text-slate-200 rounded-tl-sm')}`}>
                                        <p style={{ wordBreak: 'break-word' }}>{msgAction.message}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-none p-3 bg-slate-950/80 border-t border-white/5">
                <form 
                    onSubmit={sendMessage}
                    className="flex items-center space-x-2 relative"
                >
                    <input 
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message to room... (use @meetflow your question)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500/50 transition-colors placeholder-slate-600 min-h-[44px]"
                        disabled={isSending}
                    />
                    <button 
                        type="submit"
                        disabled={!input.trim() || isSending}
                        className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all ${!input.trim() || isSending ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20'}`}
                    >
                        {isSending ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GroupChat;
