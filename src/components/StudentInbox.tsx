// src/components/student/StudentInbox.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { 
    Inbox as InboxIcon, Zap, ChevronLeft, 
    CheckCircle2, Link as LinkIcon, Clock, ShieldAlert
} from 'lucide-react';

export default function StudentInbox({ user, onLaunchContent }: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    const studentEmail = user?.email;

    useEffect(() => {
        if (!studentEmail) return;

        // Listen for all messages directed to this scholar
        const q = query(
            collection(db, 'artifacts', appId, 'messages'),
            where('recipientEmail', '==', studentEmail),
            orderBy('timestamp', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => unsub();
    }, [studentEmail]);

    // Mark message as read when opened
    const handleOpenMessage = async (msg: any) => {
        setSelectedMsg(msg);
        if (!msg.read) {
            try {
                await updateDoc(doc(db, 'artifacts', appId, 'messages', msg.id), { read: true });
            } catch (err) {
                console.error("Failed to update read status", err);
            }
        }
    };

    // Parse the Action Payload
    const handleActionClick = (actionLink: string) => {
        if (!actionLink || !onLaunchContent) return;
        
        // actionLink looks like "lesson_123" or "deck_456"
        const [type, ...rest] = actionLink.split('_');
        const id = rest.join('_');
        
        if (type === 'lesson') {
            onLaunchContent('lesson', id);
        } else if (type === 'deck') {
            onLaunchContent('deck', id);
        }
    };

    const unreadCount = messages.filter(m => !m.read).length;

    return (
        <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
            
            {/* LEFT PANE: Message List (Hides on mobile if a message is selected) */}
            <div className={`w-full md:w-1/3 flex flex-col bg-white dark:bg-slate-900 md:border-r border-slate-200 dark:border-slate-800 shrink-0 transition-all ${selectedMsg ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-end shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <InboxIcon className="text-indigo-500" /> Intel Feed
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                            {unreadCount} Unread Transmissions
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-slate-50 dark:bg-slate-950">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Decrypting signals...</div>
                    ) : messages.length === 0 ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-400 opacity-50">
                            <CheckCircle2 size={48} className="mb-4" />
                            <span className="font-black uppercase tracking-widest text-sm">Inbox Clear</span>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <button 
                                key={msg.id}
                                onClick={() => handleOpenMessage(msg)}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 ${
                                    selectedMsg?.id === msg.id 
                                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/50 shadow-sm' 
                                        : msg.read 
                                            ? 'bg-white border-slate-100 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700' 
                                            : 'bg-white border-indigo-100 dark:bg-slate-900 dark:border-indigo-500/30 shadow-md'
                                }`}
                            >
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex items-center gap-2">
                                        {!msg.read && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />}
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${msg.type === 'broadcast' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                            {msg.type === 'broadcast' ? 'Global Broadcast' : 'Direct Intel'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2 shrink-0">
                                        {new Date(msg.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <h4 className={`text-sm truncate w-full ${!msg.read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                                    {msg.subject}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full font-medium">
                                    {msg.senderName}: {msg.body}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Message Reader */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 md:rounded-l-[2.5rem] shadow-[-20px_0_50px_rgba(0,0,0,0.05)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.3)] relative z-10 transition-transform ${!selectedMsg ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                
                {!selectedMsg ? (
                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                        <ShieldAlert size={64} className="mb-4 opacity-50" />
                        <p className="font-black uppercase tracking-widest text-sm">Select a transmission to decrypt</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-8 md:slide-in-from-bottom-4 duration-300">
                        
                        {/* Mobile Back Button */}
                        <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
                            <button onClick={() => setSelectedMsg(null)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-500 transition-colors">
                                <ChevronLeft size={16} /> Back to Feed
                            </button>
                        </div>

                        {/* Message Header */}
                        <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                                From: {selectedMsg.senderName} • {new Date(selectedMsg.timestamp).toLocaleString()}
                            </span>
                            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                                {selectedMsg.subject}
                            </h2>
                        </div>

                        {/* Message Body */}
                        <div className="p-8 md:p-12 flex-1 overflow-y-auto custom-scrollbar">
                            <p className="text-base md:text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                {selectedMsg.body}
                            </p>

                            {/* 🔥 ACTION PAYLOAD BUTTON */}
                            {selectedMsg.actionLink && (
                                <div className="mt-12 bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-200 dark:border-indigo-500/30 p-6 md:p-8 rounded-[2rem] text-center">
                                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                                        <Zap size={24} />
                                    </div>
                                    <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-100 mb-2">Action Required</h3>
                                    <p className="text-sm text-indigo-700/70 dark:text-indigo-300/70 font-bold mb-6">
                                        Your instructor has attached a specific payload to this transmission.
                                    </p>
                                    <button 
                                        onClick={() => handleActionClick(selectedMsg.actionLink)}
                                        className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <LinkIcon size={18} /> Launch Payload
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
