// src/components/ClassForum.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { X, Send, Loader, MessageSquare, MessageCircle, MoreHorizontal, CornerDownRight } from 'lucide-react';

// ============================================================================
//  CLASS FORUM (Fixed Typing Bug)
// ============================================================================

// 1. Helper Component (Moved OUTSIDE to fix focus/typing bugs)
const InlineInput = ({ value, onChange, onSubmit, onCancel, placeholder, sending }: any) => (
    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex gap-2 items-start">
            <div className="flex-1 relative">
                <textarea
                    autoFocus
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
                    placeholder={placeholder}
                    className="w-full p-3 bg-slate-50 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:bg-white outline-none resize-none text-sm min-h-[80px]"
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                    <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><X size={14}/></button>
                    <button onClick={onSubmit} disabled={sending || !value.trim()} className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"><Send size={14}/></button>
                </div>
            </div>
        </div>
    </div>
);

export default function ClassForum({ classData, user }: any) {
    const [posts, setPosts] = useState<any[]>([]);
    
    // Global Composer
    const [mainContent, setMainContent] = useState('');
    const [isPostingMain, setIsPostingMain] = useState(false);

    // Reply State
    const [activeInputId, setActiveInputId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Accordion State
    const [expandedThreads, setExpandedThreads] = useState<any>({});

    // Live Feed
    useEffect(() => {
        const q = query(
            collection(db, 'artifacts', appId, 'class_posts'),
            where('classId', '==', classData.id),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
        const unsub = onSnapshot(q, (snap) => {
            setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, [classData.id]);

    // Create New Thread
    const createPost = async () => {
        if (!mainContent.trim()) return;
        setIsPostingMain(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'class_posts'), {
                classId: classData.id,
                userId: user.uid,
                authorName: user.displayName || user.email.split('@')[0], 
                content: mainContent.trim(),
                timestamp: Date.now(),
                replies: [],
                likes: []
            });
            setMainContent('');
        } catch (e) { console.error(e); }
        setIsPostingMain(false);
    };

    // Add Reply
    const sendReply = async (parentPostId: string, replyToName?: string) => {
        if (!replyContent.trim()) return;
        setSendingReply(true);
        try {
            const postRef = doc(db, 'artifacts', appId, 'class_posts', parentPostId);
            const text = replyToName ? `@${replyToName} ${replyContent}` : replyContent;
            
            const newReply = {
                id: Date.now().toString(),
                userId: user.uid,
                authorName: user.displayName || user.email.split('@')[0],
                content: text.trim(),
                timestamp: Date.now()
            };
            
            await updateDoc(postRef, { replies: arrayUnion(newReply) });
            
            setReplyContent('');
            setActiveInputId(null); 
            setExpandedThreads({ ...expandedThreads, [parentPostId]: true });
        } catch (e) { console.error(e); }
        setSendingReply(false);
    };

    const toggleAccordion = (postId: string) => {
        setExpandedThreads((prev: any) => ({ ...prev, [postId]: !prev[postId] }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            
            {/* MAIN POST COMPOSER */}
            <div className="p-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
                <div className="relative group">
                    <textarea 
                        value={mainContent} 
                        onChange={(e) => setMainContent(e.target.value)} 
                        placeholder={`Start a new discussion...`} 
                        className="w-full p-4 pr-14 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none text-sm font-medium h-20 placeholder:text-slate-400" 
                    />
                    <button onClick={createPost} disabled={isPostingMain || !mainContent.trim()} className="absolute bottom-3 right-3 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center">
                        {isPostingMain ? <Loader size={18} className="animate-spin"/> : <Send size={18} className="ml-0.5"/>}
                    </button>
                </div>
            </div>

            {/* FEED */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-24">
                {posts.length === 0 && (
                    <div className="text-center py-12 opacity-60">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4"><MessageSquare size={32} className="text-slate-400"/></div>
                        <p className="text-sm font-bold text-slate-500">It's quiet in here...</p>
                    </div>
                )}

                {posts.map((post) => {
                    const replies = post.replies || [];
                    const isExpanded = expandedThreads[post.id];
                    const visibleReplies = isExpanded ? replies : replies.slice(-2);
                    const hiddenCount = replies.length - visibleReplies.length;

                    return (
                        <div key={post.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                            
                            {/* ROOT POST */}
                            <div className="flex gap-3 relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 border-2 border-white z-10">
                                    {post.authorName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-black text-slate-800 text-sm truncate">{post.authorName}</span>
                                        <span className="text-[10px] font-bold text-slate-400 shrink-0">{new Date(post.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap break-words mt-1">{post.content}</p>
                                    
                                    {/* Root Actions */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <button 
                                            onClick={() => { setActiveInputId(activeInputId === post.id ? null : post.id); setReplyContent(''); }} 
                                            className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                        >
                                            <MessageCircle size={14}/> Reply
                                        </button>
                                        {hiddenCount > 0 && (
                                            <button onClick={() => toggleAccordion(post.id)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                <MoreHorizontal size={12}/> View {hiddenCount} more
                                            </button>
                                        )}
                                        {isExpanded && replies.length > 2 && (
                                            <button onClick={() => toggleAccordion(post.id)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Collapse</button>
                                        )}
                                    </div>

                                    {/* Inline Input for Root */}
                                    {activeInputId === post.id && (
                                        <InlineInput 
                                            value={replyContent}
                                            onChange={setReplyContent}
                                            placeholder="Write a reply..." 
                                            onSubmit={() => sendReply(post.id)} 
                                            onCancel={() => setActiveInputId(null)}
                                            sending={sendingReply}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* REPLIES */}
                            {visibleReplies.length > 0 && (
                                <div className="mt-4 space-y-4">
                                    {visibleReplies.map((reply: any) => (
                                        <div key={reply.id} className="flex gap-3 relative pl-4 group">
                                            <div className="absolute left-[19px] -top-6 bottom-0 w-px bg-slate-200"></div>
                                            <div className="absolute left-[19px] top-3 w-4 h-px bg-slate-200"></div>

                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 border border-slate-200 z-10 relative">
                                                {reply.authorName.charAt(0).toUpperCase()}
                                            </div>
                                            
                                            <div className="flex-1 bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 relative">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="font-bold text-slate-700 text-xs">{reply.authorName}</span>
                                                    <span className="text-[9px] text-slate-400">{new Date(reply.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <p className="text-slate-600 text-xs leading-relaxed">{reply.content}</p>
                                                
                                                <div className="mt-2 flex">
                                                    <button 
                                                        onClick={() => { setActiveInputId(activeInputId === reply.id ? null : reply.id); setReplyContent(`@${reply.authorName} `); }} 
                                                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                                                    >
                                                        <CornerDownRight size={10}/> Reply
                                                    </button>
                                                </div>

                                                {/* Inline Input for Sub-Reply */}
                                                {activeInputId === reply.id && (
                                                    <InlineInput 
                                                        value={replyContent}
                                                        onChange={setReplyContent}
                                                        placeholder={`Reply to ${reply.authorName}...`} 
                                                        onSubmit={() => sendReply(post.id)} 
                                                        onCancel={() => setActiveInputId(null)} 
                                                        sending={sendingReply}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
