// src/components/instructor/InstructorInbox.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { Send, Users, User, Link as LinkIcon, MessageSquare, Clock, CheckCircle2, AlertTriangle, Layers, PenTool } from 'lucide-react';
import { JuicyToast } from '../Toast';

export default function InstructorInbox({ user, classes = [], decks = {}, lessons = [] }: any) {
    const [sentMessages, setSentMessages] = useState<any[]>([]);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [isDispatching, setIsDispatching] = useState(false);

    // Composer State
    const [recipientMode, setRecipientMode] = useState<'cohort' | 'student'>('cohort');
    const [selectedTarget, setSelectedTarget] = useState(''); // Class ID or Student Email
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [actionLink, setActionLink] = useState(''); // ID of a deck or lesson

    // Fetch sent history
    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, 'artifacts', appId, 'messages'),
            where('senderId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );
        const unsub = onSnapshot(q, (snap) => {
            setSentMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [user?.uid]);

    // Flatten decks into an array for the Action Payload dropdown
    const availableDecks = Object.values(decks || {}).filter((d: any) => d.id && d.id !== 'custom');
    
    // Get all students across all classes for Direct Messaging
    const allStudents = Array.from(new Set(classes.flatMap((c: any) => c.studentEmails || [])));

    const handleDispatch = async () => {
        if (!selectedTarget) return setToastMsg("Error: Select a target recipient.");
        if (!subject.trim() || !body.trim()) return setToastMsg("Error: Subject and Body are required.");
        
        setIsDispatching(true);
        const batch = writeBatch(db);
        const senderName = user.displayName || user.email.split('@')[0];

        try {
            if (recipientMode === 'cohort') {
                // FAN-OUT BROADCAST: Send a copy to every student in the class
                const targetClass = classes.find((c: any) => c.id === selectedTarget);
                if (!targetClass || !targetClass.studentEmails || targetClass.studentEmails.length === 0) {
                    setIsDispatching(false);
                    return setToastMsg("Error: Cohort has no scholars.");
                }

                targetClass.studentEmails.forEach((email: string) => {
                    const msgRef = doc(collection(db, 'artifacts', appId, 'messages'));
                    batch.set(msgRef, {
                        senderId: user.uid,
                        senderName,
                        recipientEmail: email,
                        targetCohort: targetClass.name,
                        type: 'broadcast',
                        subject,
                        body,
                        actionLink: actionLink || null,
                        timestamp: Date.now(),
                        read: false
                    });
                });
                
                await batch.commit();
                setToastMsg(`Broadcast deployed to ${targetClass.studentEmails.length} scholars! 🚀`);

            } else {
                // DIRECT MESSAGE: Send to a single student
                const msgRef = doc(collection(db, 'artifacts', appId, 'messages'));
                batch.set(msgRef, {
                    senderId: user.uid,
                    senderName,
                    recipientEmail: selectedTarget,
                    type: 'direct',
                    subject,
                    body,
                    actionLink: actionLink || null,
                    timestamp: Date.now(),
                    read: false
                });

                await batch.commit();
                setToastMsg(`Direct Intel sent to ${selectedTarget}! 🎯`);
            }

            // Clear composer
            setSubject('');
            setBody('');
            setActionLink('');
        } catch (error) {
            console.error("Dispatch failed:", error);
            setToastMsg("Critical Error: Deployment failed.");
        } finally {
            setIsDispatching(false);
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6 p-6 md:p-8 animate-in fade-in duration-500">
            {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* LEFT PANE: Sent History */}
            <div className="w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden shrink-0">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                        <MessageSquare size={20} className="text-indigo-500" /> Outbound Comms
                    </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-slate-50 dark:bg-slate-950">
                    {sentMessages.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 font-bold text-sm">No intel dispatched yet.</div>
                    ) : (
                        sentMessages.map((msg) => (
                            <div key={msg.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-indigo-300">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${msg.type === 'broadcast' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                        {msg.type}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10} /> {new Date(msg.timestamp).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{msg.subject}</h4>
                                <p className="text-xs text-slate-500 truncate mt-1">To: {msg.type === 'broadcast' ? msg.targetCohort : msg.recipientEmail}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: The Composer */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Signal Composer</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Transmit Intel to Scholars</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6">
                    
                    {/* Targeting Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transmission Mode</label>
                            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <button 
                                    onClick={() => { setRecipientMode('cohort'); setSelectedTarget(''); }}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${recipientMode === 'cohort' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Users size={16} /> Cohort Broadcast
                                </button>
                                <button 
                                    onClick={() => { setRecipientMode('student'); setSelectedTarget(''); }}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${recipientMode === 'student' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <User size={16} /> Direct Message
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Identity</label>
                            <select 
                                value={selectedTarget}
                                onChange={(e) => setSelectedTarget(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="" disabled>Select a {recipientMode === 'cohort' ? 'class' : 'scholar'}...</option>
                                {recipientMode === 'cohort' 
                                    ? classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.studentEmails?.length || 0} scholars)</option>)
                                    : allStudents.map((email: any) => <option key={email} value={email}>{email}</option>)
                                }
                            </select>
                        </div>
                    </div>

                    {/* Subject Line */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject Line</label>
                        <input 
                            type="text"
                            placeholder="e.g., Preparation for tomorrow's Arena..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {/* Action Payload (Optional Attachment) */}
                    <div className="space-y-3 bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 flex items-center gap-2">
                            <LinkIcon size={14} /> Action Payload (Optional)
                        </label>
                        <p className="text-xs text-indigo-900/60 dark:text-indigo-300/60 font-medium mb-3">Attach a specific lesson or data crystal for the scholars to launch instantly from this message.</p>
                        <select 
                            value={actionLink}
                            onChange={(e) => setActionLink(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border-2 border-indigo-200 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-200 font-bold rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all"
                        >
                            <option value="">-- No Attachment --</option>
                            <optgroup label="Interactive Lessons">
                                {lessons.map((l: any) => <option key={l.id} value={`lesson_${l.id}`}>{l.title}</option>)}
                            </optgroup>
                            <optgroup label="Data Crystals (Decks)">
                                {availableDecks.map((d: any) => <option key={d.id} value={`deck_${d.id}`}>{d.title || d.name}</option>)}
                            </optgroup>
                        </select>
                    </div>

                    {/* Message Body */}
                    <div className="space-y-3 flex-1 flex flex-col">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transmission Body</label>
                        <textarea 
                            placeholder="Draft your intelligence briefing here..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full flex-1 min-h-[200px] bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-base rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition-all resize-none custom-scrollbar"
                        />
                    </div>
                </div>

                <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button 
                        onClick={handleDispatch}
                        disabled={isDispatching}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        {isDispatching ? <Clock className="animate-spin" size={24} /> : <Send size={24} />} 
                        {isDispatching ? 'Transmitting...' : 'Dispatch Intel'}
                    </button>
                </div>
            </div>
        </div>
    );
}
