// src/components/instructor/InstructorInbox.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, writeBatch, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { 
    Send, Users, User, Link as LinkIcon, MessageSquare, 
    Clock, Megaphone, Plus, ShieldAlert, CheckCheck, Zap, ChevronLeft
} from 'lucide-react';
import { JuicyToast } from '../Toast';

export default function InstructorInbox({ user, classes = [], decks = {}, lessons = [] }: any) {
    const [incomingMsgs, setIncomingMsgs] = useState<any[]>([]);
    const [outgoingMsgs, setOutgoingMsgs] = useState<any[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>('compose');
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Composer State
    const [recipientMode, setRecipientMode] = useState<'cohort' | 'student'>('cohort');
    const [selectedTarget, setSelectedTarget] = useState(''); 
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [actionLink, setActionLink] = useState(''); 

    // 1. Listen for OUTGOING messages (Includes Broadcasts & Directs)
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, 'artifacts', appId, 'messages'),
            where('senderId', '==', user.uid)
        );
        const unsub = onSnapshot(q, (snap) => setOutgoingMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [user?.uid]);

    // 2. Listen for INCOMING messages (Replies from students)
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, 'artifacts', appId, 'messages'),
            where('recipientId', '==', user.uid)
        );
        const unsub = onSnapshot(q, (snap) => setIncomingMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [user?.uid]);

    // 3. Group messages into Conversation Threads
    const threads = useMemo(() => {
        const map = new Map();
        const allMsgs = [...incomingMsgs, ...outgoingMsgs].sort((a, b) => a.timestamp - b.timestamp);
        const seenBroadcasts = new Set(); // Prevent rendering 30 identical bubbles for 1 broadcast

        allMsgs.forEach(msg => {
            const isSelf = msg.senderId === user.uid;
            let tId, tName, tType, partnerEmail, partnerId;

            if (msg.type === 'broadcast') {
                tId = `broadcast_${msg.targetCohort}`;
                tName = `${msg.targetCohort} (Broadcasts)`;
                tType = 'broadcast';
                
                // Deduplicate broadcasts sent at the exact same timestamp
                if (isSelf && seenBroadcasts.has(msg.timestamp)) return;
                if (isSelf) seenBroadcasts.add(msg.timestamp);
            } else {
                partnerEmail = isSelf ? msg.recipientEmail : msg.senderEmail;
                tId = `direct_${partnerEmail}`;
                tName = isSelf ? (msg.recipientEmail || 'Scholar') : (msg.senderName || msg.senderEmail);
                tType = 'direct';
                partnerId = isSelf ? msg.recipientId : msg.senderId;
            }

            if (!map.has(tId)) {
                map.set(tId, { id: tId, name: tName, type: tType, partnerEmail, partnerId, messages: [], unreadCount: 0 });
            }

            const thread = map.get(tId);
            thread.messages.push(msg);
            if (!isSelf && !msg.read) thread.unreadCount++;
            thread.lastMessage = msg;
        });

        return Array.from(map.values()).sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
    }, [incomingMsgs, outgoingMsgs, user?.uid]);

    const activeThread = threads.find(t => t.id === activeThreadId);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [activeThread?.messages.length]);

    // Mark incoming messages as read when opening a thread
    useEffect(() => {
        if (activeThread) {
            activeThread.messages.forEach((msg: any) => {
                if (msg.senderId !== user.uid && !msg.read) {
                    updateDoc(doc(db, 'artifacts', appId, 'messages', msg.id), { read: true }).catch(() => {});
                }
            });
        }
    }, [activeThread, user?.uid]);

    const availableDecks = Object.values(decks || {}).filter((d: any) => d.id && d.id !== 'custom');
    const allStudents = Array.from(new Set(classes.flatMap((c: any) => c.studentEmails || [])));

    // SEND NEW BROADCAST OR DIRECT MESSAGE (COMPOSER)
    const handleDispatch = async () => {
        if (!selectedTarget) return setToastMsg("Error: Select a target recipient.");
        if (!subject.trim() || !body.trim()) return setToastMsg("Error: Subject and Body are required.");
        
        setIsSending(true);
        const batch = writeBatch(db);
        const senderName = user.displayName || user.email.split('@')[0];
        const timestamp = Date.now();

        try {
            if (recipientMode === 'cohort') {
                const targetClass = classes.find((c: any) => c.id === selectedTarget);
                if (!targetClass || !targetClass.studentEmails || targetClass.studentEmails.length === 0) {
                    setIsSending(false);
                    return setToastMsg("Error: Cohort has no scholars.");
                }

                targetClass.studentEmails.forEach((email: string) => {
                    const msgRef = doc(collection(db, 'artifacts', appId, 'messages'));
                    batch.set(msgRef, {
                        senderId: user.uid, senderName, senderEmail: user.email,
                        recipientEmail: email, targetCohort: targetClass.name,
                        type: 'broadcast', subject, body, actionLink: actionLink || null, timestamp, read: false
                    });
                });
                await batch.commit();
                setToastMsg(`Broadcast deployed to ${targetClass.studentEmails.length} scholars! 🚀`);
                setActiveThreadId(`broadcast_${targetClass.name}`);

            } else {
                const msgRef = doc(collection(db, 'artifacts', appId, 'messages'));
                batch.set(msgRef, {
                    senderId: user.uid, senderName, senderEmail: user.email,
                    recipientEmail: selectedTarget,
                    type: 'direct', subject, body, actionLink: actionLink || null, timestamp, read: false
                });
                await batch.commit();
                setToastMsg(`Direct Intel sent to ${selectedTarget}! 🎯`);
                setActiveThreadId(`direct_${selectedTarget}`);
            }

            setSubject(''); setBody(''); setActionLink('');
        } catch (error) {
            setToastMsg("Critical Error: Deployment failed.");
        } finally {
            setIsSending(false);
        }
    };

    // SEND QUICK REPLY (CHAT VIEW)
    const handleSendReply = async () => {
        if (!replyText.trim() || !activeThread || activeThread.type === 'broadcast') return;
        setIsSending(true);

        try {
            await addDoc(collection(db, 'artifacts', appId, 'messages'), {
                senderId: user.uid,
                senderName: user.displayName || user.email.split('@')[0],
                senderEmail: user.email,
                recipientEmail: activeThread.partnerEmail,
                recipientId: activeThread.partnerId || null, 
                type: 'direct',
                subject: `Re: Chat`,
                body: replyText.trim(),
                timestamp: Date.now(),
                read: false
            });
            setReplyText('');
        } catch (error) {
            setToastMsg("Failed to send reply.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500 w-full p-2 md:p-6 gap-4">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* LEFT PANE: Conversation List */}
            <div className={`w-full md:w-80 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shrink-0 transition-all ${activeThreadId && activeThreadId !== 'menu' ? 'hidden md:flex' : 'flex'}`}>
                
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-t-[2rem] shrink-0">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2 mb-4">
                        <MessageSquare className="text-indigo-500" size={20} /> Comms Network
                    </h2>
                    <button 
                        onClick={() => setActiveThreadId('compose')}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_5px_15px_rgba(99,102,241,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} /> Compose Signal
                    </button>
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
                                        {thread.lastMessage.senderId === user.uid ? 'You: ' : ''}{thread.lastMessage.body}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Composer or Chat View */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl relative z-10 transition-transform ${!activeThreadId || activeThreadId === 'menu' ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                
                {/* ----------------------------------------------------------------- */}
                {/* VIEW A: COMPOSER */}
                {/* ----------------------------------------------------------------- */}
                {activeThreadId === 'compose' ? (
                    <div className="flex-1 flex flex-col h-full rounded-[2rem] overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center gap-4 shrink-0">
                            <button onClick={() => setActiveThreadId('menu')} className="md:hidden p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-500 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Signal Composer</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Initialize New Transmission</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transmission Mode</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <button onClick={() => { setRecipientMode('cohort'); setSelectedTarget(''); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${recipientMode === 'cohort' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={16} /> Cohort Broadcast</button>
                                        <button onClick={() => { setRecipientMode('student'); setSelectedTarget(''); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${recipientMode === 'student' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><User size={16} /> Direct Message</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Identity</label>
                                    <select value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all">
                                        <option value="" disabled>Select a target...</option>
                                        {recipientMode === 'cohort' ? classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.studentEmails?.length || 0})</option>) : allStudents.map((email: any) => <option key={email} value={email}>{email}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject Line</label>
                                <input type="text" placeholder="e.g., Required prep for Arena..." value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all" />
                            </div>
                            <div className="space-y-3 bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-2"><LinkIcon size={14} /> Action Payload (Optional)</label>
                                <select value={actionLink} onChange={(e) => setActionLink(e.target.value)} className="w-full bg-white dark:bg-slate-950 border-2 border-indigo-200 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-200 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all">
                                    <option value="">-- No Attachment --</option>
                                    <optgroup label="Interactive Lessons">{lessons.map((l: any) => <option key={l.id} value={`lesson_${l.id}`}>{l.title}</option>)}</optgroup>
                                    <optgroup label="Data Crystals (Decks)">{availableDecks.map((d: any) => <option key={d.id} value={`deck_${d.id}`}>{d.title || d.name}</option>)}</optgroup>
                                </select>
                            </div>
                            <div className="space-y-3 flex-1 flex flex-col">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transmission Body</label>
                                <textarea placeholder="Draft your briefing here..." value={body} onChange={(e) => setBody(e.target.value)} className="w-full flex-1 min-h-[150px] bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-base rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all resize-none custom-scrollbar" />
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <button onClick={handleDispatch} disabled={isSending} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isSending ? <Clock className="animate-spin" size={24} /> : <Send size={24} />} {isSending ? 'Transmitting...' : 'Dispatch Intel'}
                            </button>
                        </div>
                    </div>
                ) 
                
                /* ----------------------------------------------------------------- */
                /* VIEW B: CHAT BUBBLES */
                /* ----------------------------------------------------------------- */
                : activeThread ? (
                    <div className="flex-1 flex flex-col h-full overflow-hidden rounded-[2rem]">
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 shrink-0 flex items-center gap-4">
                            <button onClick={() => setActiveThreadId('menu')} className="md:hidden p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-500 transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
                                    {activeThread.name}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {activeThread.type === 'broadcast' ? 'Broadcast Channel (Read-Only)' : 'Encrypted Direct Channel'}
                                </p>
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
                            {activeThread.messages.map((msg: any) => {
                                const isSelf = msg.senderId === user.uid;
                                return (
                                    <div key={msg.id} className={`flex flex-col w-full max-w-[85%] md:max-w-[70%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                        <div className={`p-4 md:p-5 rounded-3xl shadow-sm relative ${isSelf ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-slate-700'}`}>
                                            <p className="text-sm md:text-base font-medium leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                                            {msg.actionLink && (
                                                <div className={`mt-4 p-4 rounded-2xl border-2 ${isSelf ? 'bg-indigo-700/50 border-indigo-500' : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'}`}>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Zap size={14} className={isSelf ? 'text-indigo-300' : 'text-indigo-500'} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSelf ? 'text-indigo-300' : 'text-indigo-500'}`}>Attached Payload</span>
                                                    </div>
                                                    <div className={`text-xs font-bold ${isSelf ? 'text-indigo-100' : 'text-indigo-600'}`}>{msg.actionLink}</div>
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

                        {activeThread.type === 'direct' ? (
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                                <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-2 focus-within:border-indigo-500 transition-colors">
                                    <textarea 
                                        value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                                        placeholder="Type a message..."
                                        className="flex-1 max-h-32 bg-transparent text-sm md:text-base font-medium text-slate-800 dark:text-slate-100 p-3 outline-none resize-none custom-scrollbar" rows={1}
                                    />
                                    <button onClick={handleSendReply} disabled={!replyText.trim() || isSending} className="mb-1 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-full transition-all active:scale-95 shrink-0">
                                        <Send size={18} className={isSending ? 'animate-pulse' : ''} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0 text-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Broadcasts are sent via Composer</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 h-full">
                        <ShieldAlert size={64} className="mb-4 opacity-50" />
                        <p className="font-black uppercase tracking-widest text-sm">Select a channel to connect</p>
                    </div>
                )}
            </div>
        </div>
    );
}
