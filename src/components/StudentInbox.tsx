// src/components/StudentInbox.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { 
    MessageSquare, Zap, ChevronLeft, Send,
    Link as LinkIcon, ShieldAlert, CheckCheck, Megaphone, User
} from 'lucide-react';

export default function StudentInbox({ user, onLaunchContent }: any) {
    const [incomingMsgs, setIncomingMsgs] = useState<any[]>([]);
    const [outgoingMsgs, setOutgoingMsgs] = useState<any[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const studentEmail = user?.email;
    const studentId = user?.uid;

    // 1. Listen for INCOMING messages
    useEffect(() => {
        if (!studentEmail) return;
        const q = query(
            collection(db, 'artifacts', appId, 'messages'),
            where('recipientEmail', '==', studentEmail)
        );
        const unsub = onSnapshot(q, (snap) => setIncomingMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [studentEmail]);

    // 2. Listen for OUTGOING messages (Replies sent by this student)
    useEffect(() => {
        if (!studentId) return;
        const q = query(
            collection(db, 'artifacts', appId, 'messages'),
            where('senderId', '==', studentId)
        );
        const unsub = onSnapshot(q, (snap) => setOutgoingMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [studentId]);

    // 3. Group messages into Conversation Threads
    const threads = useMemo(() => {
        const map = new Map();
        const allMsgs = [...incomingMsgs, ...outgoingMsgs].sort((a, b) => a.timestamp - b.timestamp); // Chronological

        allMsgs.forEach(msg => {
            const isSelf = msg.senderId === studentId;
            let tId, tName, tType, partnerId;

            if (msg.type === 'broadcast') {
                tId = `broadcast_${msg.targetCohort}`;
                tName = `${msg.targetCohort} (Announcements)`;
                tType = 'broadcast';
                partnerId = msg.senderId; // The instructor who broadcasted it
            } else {
                tId = isSelf ? `direct_${msg.recipientId || msg.recipientEmail}` : `direct_${msg.senderId}`;
                tName = isSelf ? (msg.recipientName || 'Instructor') : (msg.senderName || 'Instructor');
                tType = 'direct';
                partnerId = isSelf ? msg.recipientId : msg.senderId;
            }

            if (!map.has(tId)) {
                map.set(tId, { 
                    id: tId, name: tName, type: tType, partnerId,
                    messages: [], unreadCount: 0 
                });
            }

            const thread = map.get(tId);
            thread.messages.push(msg);
            if (!isSelf && !msg.read) thread.unreadCount++;
            thread.lastMessage = msg;
        });

        return Array.from(map.values()).sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
    }, [incomingMsgs, outgoingMsgs, studentId]);

    const activeThread = threads.find(t => t.id === activeThreadId);

    // Auto-scroll to bottom of chat when opening a thread or sending a message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeThread?.messages.length]);

    // Mark messages as read
    useEffect(() => {
        if (activeThread) {
            activeThread.messages.forEach((msg: any) => {
                if (msg.senderId !== studentId && !msg.read) {
                    updateDoc(doc(db, 'artifacts', appId, 'messages', msg.id), { read: true }).catch(() => {});
                }
            });
        }
    }, [activeThread, studentId]);

    // Parse the Action Payload
    const handleActionClick = (actionLink: string) => {
        if (!actionLink || !onLaunchContent) return;
        const [type, ...rest] = actionLink.split('_');
        const id = rest.join('_');
        if (type === 'lesson') onLaunchContent('lesson', id);
        else if (type === 'deck') onLaunchContent('deck', id);
    };

    // Send a Reply
    const handleSendReply = async () => {
        if (!replyText.trim() || !activeThread || activeThread.type === 'broadcast') return;
        setIsSending(true);

        try {
            await addDoc(collection(db, 'artifacts', appId, 'messages'), {
                senderId: studentId,
                senderName: user?.displayName || studentEmail.split('@')[0],
                senderEmail: studentEmail,
                // 🔥 FIXED: Firebase hates "undefined". This safely falls back to null.
                recipientId: activeThread.partnerId || null, 
                recipientName: activeThread.name || "Instructor",
                type: 'direct',
                subject: `Re: Chat`,
                body: replyText.trim(),
                timestamp: Date.now(),
                read: false
            });
            setReplyText('');
        } catch (error) {
            console.error("Failed to send reply:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        // 🔥 FIXED: Added pb-24 for mobile to lift the layout above the StudentNavBar!
        <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500 max-w-[1400px] mx-auto w-full p-2 pb-24 md:p-6 md:pb-6 gap-4">
            
            {/* LEFT PANE: Conversation List */}
            <div className={`w-full md:w-80 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shrink-0 transition-all ${activeThreadId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-t-[2rem] shrink-0">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                        <MessageSquare className="text-indigo-500" size={20} /> Comms Network
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {threads.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-bold text-sm">No active comms channels.</div>
                    ) : (
                        threads.map(thread => (
                            <button 
                                key={thread.id}
                                onClick={() => setActiveThreadId(thread.id)}
                                className={`w-full text-left p-4 rounded-2xl transition-all flex items-start gap-3 ${
                                    activeThreadId === thread.id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeThreadId === thread.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                    {thread.type === 'broadcast' ? <Megaphone size={18} /> : <User size={18} />}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-black text-sm truncate">{thread.name}</h4>
                                        {thread.unreadCount > 0 && (
                                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                                                {thread.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate ${activeThreadId === thread.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {thread.lastMessage.senderId === studentId ? 'You: ' : ''}{thread.lastMessage.body}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Chat View */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl relative z-10 transition-transform ${!activeThreadId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                
                {!activeThread ? (
                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                        <ShieldAlert size={64} className="mb-4 opacity-50" />
                        <p className="font-black uppercase tracking-widest text-sm">Select a channel to connect</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full overflow-hidden rounded-[2rem]">
                        
                        {/* Chat Header */}
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 shrink-0 flex items-center gap-4">
                            <button onClick={() => setActiveThreadId(null)} className="md:hidden p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-500 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
                                    {activeThread.name}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {activeThread.type === 'broadcast' ? 'ReadOnly Broadcast Channel' : 'Encrypted Direct Channel'}
                                </p>
                            </div>
                        </div>

                        {/* Chat Bubbles Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
                            {activeThread.messages.map((msg: any) => {
                                const isSelf = msg.senderId === studentId;
                                
                                return (
                                    <div key={msg.id} className={`flex flex-col w-full max-w-[85%] md:max-w-[70%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                        
                                        <div className={`p-4 md:p-5 rounded-3xl shadow-sm relative ${
                                            isSelf 
                                                ? 'bg-indigo-600 text-white rounded-br-sm' 
                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-700'
                                        }`}>
                                            <p className="text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap break-words">
                                                {msg.body}
                                            </p>

                                            {/* Action Payload Card embedded inside the bubble */}
                                            {msg.actionLink && (
                                                <div className={`mt-4 p-4 rounded-2xl border-2 ${isSelf ? 'bg-indigo-700/50 border-indigo-500' : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Zap size={14} className={isSelf ? 'text-indigo-300' : 'text-indigo-500'} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelf ? 'text-indigo-300' : 'text-indigo-500'}`}>Attached Payload</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleActionClick(msg.actionLink)}
                                                        className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2 ${isSelf ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20'}`}
                                                    >
                                                        <LinkIcon size={14} /> Launch
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {isSelf && <CheckCheck size={12} className={msg.read ? 'text-indigo-500' : 'text-slate-300'} />}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area (Only for Direct Messages) */}
                        {activeThread.type === 'direct' ? (
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-2 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 transition-colors">
                                    <textarea 
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendReply();
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        className="flex-1 max-h-32 bg-transparent text-sm md:text-base font-medium text-slate-800 dark:text-slate-100 p-3 outline-none resize-none custom-scrollbar"
                                        rows={1}
                                    />
                                    <button 
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim() || isSending}
                                        className="mb-1 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-full transition-all active:scale-95 shrink-0"
                                    >
                                        <Send size={18} className={isSending ? 'animate-pulse' : ''} />
                                    </button>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold text-center mt-2">Press Enter to send, Shift + Enter for new line</div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0 text-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Read-Only Broadcast Channel</span>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
