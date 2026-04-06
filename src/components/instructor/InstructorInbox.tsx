// src/components/instructor/InstructorInbox.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, writeBatch, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { 
    Send, Users, User, Link as LinkIcon, MessageSquare, 
    Clock, Megaphone, Plus, CheckCheck, Zap, ChevronLeft,
    Inbox, AlertCircle, ChevronDown
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
    
    // 🔥 CUSTOM DROPDOWN STATES
    const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
    const [isAttachDropdownOpen, setIsAttachDropdownOpen] = useState(false);

    const instructorEmail = user?.email || "instructor@magister.com";

    // 1. Listen for OUTGOING messages
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'artifacts', appId, 'messages'), where('senderId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => setOutgoingMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [user?.uid]);

    // 2. Listen for INCOMING messages
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'artifacts', appId, 'messages'), where('recipientId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => setIncomingMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [user?.uid]);

    // 3. Group messages into Conversation Threads
    const threads = useMemo(() => {
        const map = new Map();
        const allMsgs = [...incomingMsgs, ...outgoingMsgs].sort((a, b) => a.timestamp - b.timestamp);
        const seenBroadcasts = new Set(); 

        allMsgs.forEach(msg => {
            const isSelf = msg.senderId === user.uid;
            let tId, tName, tType, partnerEmail, partnerId;

            if (msg.type === 'broadcast') {
                tId = `broadcast_${msg.targetCohort}`;
                tName = `${msg.targetCohort} (Broadcasts)`;
                tType = 'broadcast';
                
                if (isSelf && seenBroadcasts.has(msg.timestamp)) return;
                if (isSelf) seenBroadcasts.add(msg.timestamp);
            } else {
                partnerEmail = isSelf ? msg.recipientEmail : msg.senderEmail;
                tId = `direct_${partnerEmail}`;
                tName = isSelf ? (msg.recipientEmail || 'Student') : (msg.senderName || msg.senderEmail || 'Student');
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

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [activeThread?.messages.length]);

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

    // SEND NEW BROADCAST OR DIRECT MESSAGE
    const handleDispatch = async () => {
        if (!selectedTarget) return setToastMsg("Error: Select a recipient.");
        if (!subject.trim() || !body.trim()) return setToastMsg("Error: Subject and Body are required.");
        
        setIsSending(true);
        const batch = writeBatch(db);
        const senderName = user.displayName || user.email?.split('@')[0] || 'Instructor';
        const timestamp = Date.now();

        try {
            if (recipientMode === 'cohort') {
                const targetClass = classes.find((c: any) => c.id === selectedTarget);
                if (!targetClass || !targetClass.studentEmails || targetClass.studentEmails.length === 0) {
                    setIsSending(false);
                    return setToastMsg("Error: Cohort has no students.");
                }

                targetClass.studentEmails.forEach((email: string) => {
                    const msgRef = doc(collection(db, 'artifacts', appId, 'messages'));
                    batch.set(msgRef, {
                        senderId: user.uid, senderName, senderEmail: instructorEmail, recipientEmail: email, 
                        targetCohort: targetClass.name, type: 'broadcast', subject, body, 
                        actionLink: actionLink || null, timestamp, read: false
                    });
                });
                await batch.commit();
                setToastMsg(`Message sent to ${targetClass.studentEmails.length} students.`);
                setActiveThreadId(`broadcast_${targetClass.name}`);

            } else {
                const msgRef = doc(collection(db, 'artifacts', appId, 'messages'));
                batch.set(msgRef, {
                    senderId: user.uid, senderName, senderEmail: instructorEmail, recipientEmail: selectedTarget,
                    type: 'direct', subject, body, actionLink: actionLink || null, timestamp, read: false
                });
                await batch.commit();
                setToastMsg(`Message sent to ${selectedTarget}.`);
                setActiveThreadId(`direct_${selectedTarget}`);
            }

            setSubject(''); setBody(''); setActionLink('');
        } catch (error) {
            setToastMsg("Error: Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !activeThread || activeThread.type === 'broadcast') return;
        setIsSending(true);

        try {
            await addDoc(collection(db, 'artifacts', appId, 'messages'), {
                senderId: user.uid, senderName: user.displayName || instructorEmail.split('@')[0], senderEmail: instructorEmail,
                recipientEmail: activeThread.partnerEmail || 'student@magister.com', recipientId: activeThread.partnerId || null, 
                type: 'direct', subject: `Re: Chat`, body: replyText.trim(), timestamp: Date.now(), read: false
            });
            setReplyText('');
        } catch (error) {
            setToastMsg("Failed to send reply.");
        } finally {
            setIsSending(false);
        }
    };

    // Derived Labels for Dropdowns
    const activeTargetLabel = recipientMode === 'cohort' ? classes.find((c:any) => c.id === selectedTarget)?.name : selectedTarget;
    
    const activeAttachLabel = actionLink 
        ? (actionLink.startsWith('lesson_') 
            ? lessons.find((l:any) => `lesson_${l.id}` === actionLink)?.title 
            : availableDecks.find((d:any) => `deck_${d.id}` === actionLink)?.title || availableDecks.find((d:any) => `deck_${d.id}` === actionLink)?.name)
        : '-- No Attachment --';

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none animate-in fade-in duration-500 relative transition-colors duration-300">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* UNIFIED HEADER */}
            <header className="h-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 flex justify-between items-center shrink-0 z-50 shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hidden sm:flex transition-all duration-500 shadow-inner dark:shadow-none">
                        <Inbox size={18} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Communications</h2>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Inbox & Announcements</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row w-full p-4 md:p-8 gap-6 overflow-hidden pb-32">
                
                {/* LEFT PANE: Conversation List */}
                <div className={`w-full md:w-[340px] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 transition-all h-full ${activeThreadId && activeThreadId !== 'menu' ? 'hidden md:flex' : 'flex'}`}>
                    
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-t-[2.5rem] shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="text-indigo-500" size={16} /> Inbox
                            </h3>
                        </div>
                        <button 
                            onClick={() => setActiveThreadId('compose')}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} strokeWidth={3} /> New Message
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {threads.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-bold text-sm">No messages.</div>
                        ) : (
                            threads.map(thread => (
                                <button 
                                    key={thread.id}
                                    onClick={() => setActiveThreadId(thread.id)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-start gap-3 ${
                                        activeThreadId === thread.id 
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-100 ring-1 ring-indigo-200 dark:ring-indigo-500/30' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${activeThreadId === thread.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                        {thread.type === 'broadcast' ? <Megaphone size={16} /> : <User size={16} />}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className={`font-black text-sm truncate ${activeThreadId === thread.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>{thread.name}</h4>
                                            {thread.unreadCount > 0 && (
                                                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs truncate ${activeThreadId === thread.id ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400'}`}>
                                            {thread.lastMessage.senderId === user.uid ? 'You: ' : ''}{thread.lastMessage.body}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Composer or Chat View */}
                <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 transition-transform h-full ${!activeThreadId || activeThreadId === 'menu' ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                    
                    {/* ----------------------------------------------------------------- */}
                    {/* VIEW A: COMPOSER */}
                    {/* ----------------------------------------------------------------- */}
                    {activeThreadId === 'compose' ? (
                        <div className="flex-1 flex flex-col h-full rounded-[2.5rem] overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center gap-4 shrink-0">
                                <button onClick={() => setActiveThreadId('menu')} className="md:hidden p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-500 transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">New Message</h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Compose Announcement or Direct Message</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient Type</label>
                                        <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                            <button onClick={() => { setRecipientMode('cohort'); setSelectedTarget(''); }} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${recipientMode === 'cohort' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Users size={14} /> Cohort</button>
                                            <button onClick={() => { setRecipientMode('student'); setSelectedTarget(''); }} className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${recipientMode === 'student' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><User size={14} /> Student</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Recipient</label>
                                        {/* 🔥 CUSTOM RECIPIENT DROPDOWN */}
                                        <div className="relative">
                                            <button type="button" onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all shadow-inner flex justify-between items-center">
                                                <span className="truncate">{activeTargetLabel || 'Select...'}</span>
                                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isTargetDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isTargetDropdownOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsTargetDropdownOpen(false)} />
                                                    <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-y-auto max-h-60 py-2 custom-scrollbar">
                                                        {recipientMode === 'cohort' 
                                                            ? classes.map((c: any) => (
                                                                <button key={c.id} type="button" onClick={() => { setSelectedTarget(c.id); setIsTargetDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors ${selectedTarget === c.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                                    {c.name} <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-2">({c.studentEmails?.length || 0} Students)</span>
                                                                </button>
                                                            ))
                                                            : allStudents.map((email: any) => (
                                                                <button key={email} type="button" onClick={() => { setSelectedTarget(email); setIsTargetDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${selectedTarget === email ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                                    {email}
                                                                </button>
                                                            ))
                                                        }
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</label>
                                    <input type="text" placeholder="e.g., Assignment update..." value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-3 bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2"><LinkIcon size={14} /> Attach Content (Optional)</label>
                                    {/* 🔥 CUSTOM ATTACHMENT DROPDOWN */}
                                    <div className="relative">
                                        <button type="button" onClick={() => setIsAttachDropdownOpen(!isAttachDropdownOpen)} className="w-full bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-200 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all shadow-sm flex justify-between items-center">
                                            <span className="truncate">{activeAttachLabel}</span>
                                            <ChevronDown size={16} className={`text-indigo-400 transition-transform ${isAttachDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isAttachDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setIsAttachDropdownOpen(false)} />
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/50 rounded-xl shadow-2xl z-50 overflow-y-auto max-h-64 py-2 custom-scrollbar">
                                                    <button type="button" onClick={() => { setActionLink(''); setIsAttachDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                        -- No Attachment --
                                                    </button>
                                                    
                                                    {lessons.length > 0 && <div className="px-4 py-2 mt-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-500/5">Lessons</div>}
                                                    {lessons.map((l: any) => (
                                                        <button key={l.id} type="button" onClick={() => { setActionLink(`lesson_${l.id}`); setIsAttachDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${actionLink === `lesson_${l.id}` ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                            {l.title}
                                                        </button>
                                                    ))}
                                                    
                                                    {availableDecks.length > 0 && <div className="px-4 py-2 mt-2 text-[10px] font-black text-fuchsia-400 uppercase tracking-widest bg-fuchsia-50/50 dark:bg-fuchsia-500/5">Flashcards</div>}
                                                    {availableDecks.map((d: any) => (
                                                        <button key={d.id} type="button" onClick={() => { setActionLink(`deck_${d.id}`); setIsAttachDropdownOpen(false); }} className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${actionLink === `deck_${d.id}` ? 'bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                            {d.title || d.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3 flex-1 flex flex-col">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Body</label>
                                    <textarea placeholder="Type your message here..." value={body} onChange={(e) => setBody(e.target.value)} className="w-full flex-1 min-h-[150px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm md:text-base rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all resize-none custom-scrollbar shadow-inner" />
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                                <button onClick={handleDispatch} disabled={isSending} className="w-full md:w-auto md:float-right px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {isSending ? <Clock className="animate-spin" size={16} /> : <Send size={16} />} {isSending ? 'Sending...' : 'Send Message'}
                                </button>
                                <div className="clear-both"></div>
                            </div>
                        </div>
                    ) 
                    
                    /* ----------------------------------------------------------------- */
                    /* VIEW B: CHAT BUBBLES */
                    /* ----------------------------------------------------------------- */
                    : activeThread ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden rounded-[2.5rem]">
                            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0 flex items-center gap-4">
                                <button onClick={() => setActiveThreadId('menu')} className="md:hidden p-2 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-indigo-500 transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
                                        {activeThread.name}
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {activeThread.type === 'broadcast' ? 'Announcement (Read-Only)' : 'Direct Message'}
                                    </p>
                                </div>
                            </div>

                            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6 bg-white dark:bg-slate-900">
                                {activeThread.messages.map((msg: any) => {
                                    const isSelf = msg.senderId === user.uid;
                                    return (
                                        <div key={msg.id} className={`flex flex-col w-full max-w-[85%] md:max-w-[70%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                            <div className={`p-4 rounded-2xl shadow-sm relative ${isSelf ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-700'}`}>
                                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                                                {msg.actionLink && (
                                                    <div className={`mt-4 p-3 rounded-xl border ${isSelf ? 'bg-indigo-700/50 border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Zap size={12} className={isSelf ? 'text-indigo-300' : 'text-indigo-500'} />
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${isSelf ? 'text-indigo-300' : 'text-indigo-500'}`}>Attached Content</span>
                                                        </div>
                                                        <div className={`text-xs font-bold ${isSelf ? 'text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>{msg.actionLink.replace('lesson_', 'Lesson: ').replace('deck_', 'Flashcards: ')}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                {isSelf && <CheckCheck size={12} className={msg.read ? 'text-indigo-500' : 'text-slate-300'} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {activeThread.type === 'direct' ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
                                    <div className="flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 focus-within:border-indigo-500 transition-colors shadow-sm">
                                        <textarea 
                                            value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                                            placeholder="Type a reply..."
                                            className="flex-1 max-h-32 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 p-2 outline-none resize-none custom-scrollbar" rows={1}
                                        />
                                        <button onClick={handleSendReply} disabled={!replyText.trim() || isSending} className="mb-0.5 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-xl transition-all active:scale-95 shrink-0 shadow-sm">
                                            <Send size={16} className={isSending ? 'animate-pulse' : ''} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0 text-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Announcements are read-only</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 h-full">
                            <AlertCircle size={48} className="mb-4 opacity-50" />
                            <p className="font-black uppercase tracking-widest text-xs">Select a conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
