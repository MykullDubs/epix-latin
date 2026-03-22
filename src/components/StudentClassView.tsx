// src/components/StudentClassView.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    query, collection, where, onSnapshot, orderBy, limit, addDoc,
    doc, updateDoc, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { auth, db, storage, appId } from '../config/firebase';
import { 
    MessageSquare, Send, ArrowLeft, BookOpen, CheckCircle2, 
    Lock, Play, ChevronRight, Monitor, FileText, ChevronDown, 
    ChevronUp, Trophy, Zap, Flame, Plus, User, Heart,
    Mic, Square, Volume2, Loader2, Shield, Map, Gamepad2,
    Triangle, Circle, XCircle, X, ArrowDownCircle
} from 'lucide-react';

import StudentGradebook from './StudentGradebook';
import LeaderboardView from './LeaderboardView';
import StudentSlipstreamView from './StudentSlipstreamView';

// --- THEME HELPER (Dark Mode Upgraded) ---
const getSubjectTheme = (subject: string) => {
    const sub = subject?.toLowerCase() || '';
    if (sub.includes('math')) return { color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500 dark:bg-rose-600', light: 'bg-rose-100 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20' };
    if (sub.includes('science') || sub.includes('bio')) return { color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500 dark:bg-emerald-600', light: 'bg-emerald-100 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' };
    if (sub.includes('social') || sub.includes('history')) return { color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500 dark:bg-amber-600', light: 'bg-amber-100 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' };
    if (sub.includes('read') || sub.includes('english')) return { color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500 dark:bg-cyan-600', light: 'bg-cyan-100 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/20' };
    return { color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500 dark:bg-indigo-600', light: 'bg-indigo-100 dark:bg-indigo-500/10', border: 'border-indigo-200 dark:border-indigo-500/20' };
};

// ============================================================================
//  SUB-COMPONENT: FORUM AVATAR
// ============================================================================
const ForumAvatar = ({ url, name, role, size = "md" }: any) => {
    const initials = name?.split(' ').map((n:any) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';
    const sizeClasses: any = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[35%] overflow-hidden flex items-center justify-center font-black transition-all shadow-sm ${url ? 'bg-white dark:bg-slate-800' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'}`}>
                {url ? <img src={url} alt={`${name}'s avatar`} className="w-full h-full object-cover" /> : <span aria-hidden="true">{initials}</span>}
            </div>
            {role === 'instructor' && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900 p-0.5 shadow-md">
                    <Shield size={size === 'xs' ? 8 : 10} className="text-white" fill="currentColor" />
                </div>
            )}
        </div>
    );
};

// ============================================================================
//  VOICE RECORDER COMPONENT
// ============================================================================
const VoiceRecorder = ({ onRecordingComplete, onCancel }: any) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        onRecordingComplete(blob); 
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) { alert("Microphone access denied."); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };
  
  return (
    <div className="bg-slate-50 dark:bg-slate-950/50 p-2 pl-4 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors duration-300">
      {!audioUrl ? (
        <div className="flex items-center gap-4 w-full">
          <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-slate-300 dark:bg-slate-700'}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest flex-1 ${isRecording ? 'text-rose-500' : 'text-slate-400'}`}>
              {isRecording ? "Recording Transmission..." : "Attach Voice Memo"}
          </span>
          <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${isRecording ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'}`}>
            {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full animate-in fade-in">
          <div className="w-8 h-8 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <Mic size={14} />
          </div>
          <audio src={audioUrl} controls className="h-8 flex-1 opacity-90 grayscale" />
          <button type="button" onClick={() => { setAudioUrl(null); onCancel(); }} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 w-8 h-8 flex items-center justify-center rounded-full transition-colors"><X size={16} strokeWidth={3} /></button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
//  INTERNAL FORUM COMPONENT (🔥 UPGRADED TACTICAL UI)
// ============================================================================
const ClassForum = ({ classId, userData }: { classId: string, userData: any }) => {
  const [view, setView] = useState<'list' | 'thread'>('list');
  const [activeTopic, setActiveTopic] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null);

  const isInstructor = userData?.role === 'instructor' || userData?.role === 'admin';
  const currentAvatar = userData?.profile?.main?.avatarUrl || null;

  useEffect(() => {
    if (!classId) return;
    const q = query(collection(db, 'artifacts', appId, 'classes', classId, 'forum_topics'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [classId]);

  useEffect(() => {
    if (!activeTopic) return;
    const q = query(collection(db, 'artifacts', appId, 'classes', classId, 'forum_topics', activeTopic.id, 'responses'), orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snap) => setResponses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [classId, activeTopic]);

  const handleToggleLike = async (responseId: string, currentLikes: string[] = [], authorId: string) => {
    if (!auth.currentUser || auth.currentUser.uid === authorId) return;
    const isLiked = currentLikes.includes(auth.currentUser.uid);
    const responseRef = doc(db, 'artifacts', appId, 'classes', classId, 'forum_topics', activeTopic.id, 'responses', responseId);
    await updateDoc(responseRef, { likes: isLiked ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid) });
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || (!newContent.trim() && !pendingAudio)) return;
    await addDoc(collection(db, 'artifacts', appId, 'classes', classId, 'forum_topics'), {
      title: newTitle, content: newContent, authorName: userData?.name || 'Magister',
      authorAvatarUrl: currentAvatar, authorId: auth.currentUser?.uid, role: userData?.role, timestamp: Date.now(), replyCount: 0
    });
    setNewTitle(""); setNewContent(""); setIsCreating(false);
  };

  const handlePostResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || (!newContent.trim() && !pendingAudio)) return;
    if (!activeTopic) return;
    setIsUploading(true);
    try {
      let audioUrl = "";
      if (pendingAudio) {
        const audioRef = ref(storage, `artifacts/${appId}/forum/${auth.currentUser?.uid}_${Date.now()}.webm`);
        const uploadResult = await uploadBytes(audioRef, pendingAudio);
        audioUrl = await getDownloadURL(uploadResult.ref);
      }
      await addDoc(collection(db, 'artifacts', appId, 'classes', classId, 'forum_topics', activeTopic.id, 'responses'), {
        title: newTitle, content: newContent || "", audioUrl,
        authorName: userData?.name || 'Scholar', authorAvatarUrl: currentAvatar,
        authorId: auth.currentUser?.uid, role: userData?.role, timestamp: Date.now(), comments: [], likes: []
      });
      setNewTitle(""); setNewContent(""); setPendingAudio(null); setIsCreating(false);
    } catch (err) { alert("Upload error."); }
    setIsUploading(false);
  };

  const handlePostComment = async (responseId: string) => {
    if (!commentText.trim()) return;
    const responseRef = doc(db, 'artifacts', appId, 'classes', classId, 'forum_topics', activeTopic.id, 'responses', responseId);
    await updateDoc(responseRef, {
      comments: arrayUnion({ text: commentText, authorName: userData?.name || 'Scholar', authorAvatarUrl: currentAvatar, authorId: auth.currentUser?.uid, role: userData?.role, timestamp: Date.now() })
    });
    setCommentText(""); setReplyingToId(null);
  };

  const formatDate = (ts: number) => {
      return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (view === 'list') {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner p-4 md:p-6 overflow-hidden animate-in fade-in duration-500 font-sans transition-colors duration-300">
        <header className="flex justify-between items-center mb-6 px-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                    <MessageSquare size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">Comms Link</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Discussions</p>
                </div>
            </div>
            {isInstructor && (
                <button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                  <Plus size={16} /> <span className="hidden sm:inline">New Directive</span>
                </button>
            )}
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-20">
            {isCreating && (
                <form onSubmit={handleCreateTopic} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-indigo-200 dark:border-indigo-500/30 shadow-xl mb-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Directive Title..." className="w-full bg-transparent text-xl font-black text-slate-800 dark:text-slate-100 outline-none mb-3 placeholder:text-slate-300 dark:placeholder:text-slate-700" />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Enter details..." className="w-full bg-transparent text-sm text-slate-600 dark:text-slate-400 outline-none min-h-[100px] resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700" />
                    <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-[10px] uppercase tracking-widest transition-colors">Cancel</button>
                        <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition-colors flex items-center gap-2">Broadcast <Send size={14}/></button>
                    </div>
                </form>
            )}

            {topics.length === 0 && !isCreating && (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center opacity-40">
                    <MessageSquare size={64} className="mb-4 text-slate-400" strokeWidth={1.5} />
                    <p className="font-black uppercase tracking-[0.2em] text-slate-500 text-sm">No Comms Active</p>
                    <p className="text-xs font-bold text-slate-400 mt-2 max-w-xs">Waiting for instructor directives to initiate communication.</p>
                </div>
            )}

            {topics.map(t => (
                <button key={t.id} onClick={() => { setActiveTopic(t); setView('thread'); }} className="w-full bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all text-left relative overflow-hidden group">
                    <div className="absolute left-0 top-0 w-1.5 h-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500 transition-colors" />
                    <div className="flex justify-between items-start gap-4 mb-3">
                        <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">{t.title}</h4>
                        <span className="shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><ChevronRight size={12} /> Enter</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 font-medium leading-relaxed">{t.content}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                        <div className="flex items-center gap-3 text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
                            <ForumAvatar url={t.authorAvatarUrl} name={t.authorName} role={t.role} size="xs" />
                            <span className="truncate max-w-[120px]">{t.authorName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{formatDate(t.timestamp)}</span>
                    </div>
                </button>
            ))}
        </div>
      </div>
    );
  }

  // --- THREAD VIEW ---
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden animate-in slide-in-from-right-8 duration-500 font-sans transition-colors duration-300">
        <header className="bg-white dark:bg-slate-900/80 backdrop-blur-md p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm z-30 transition-colors duration-300 shrink-0">
            <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-black text-xs uppercase hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors active:scale-95"><ArrowLeft size={16} /> Retreat</button>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Live Thread
            </span>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {/* HERO PROMPT CARD */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-black text-white px-6 py-10 md:p-12 relative overflow-hidden shrink-0 border-b-4 border-indigo-500">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Zap size={120} /></div>
                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <ForumAvatar url={activeTopic.authorAvatarUrl} name={activeTopic.authorName} role={activeTopic.role} size="md" />
                        <div>
                            <span className="block text-sm font-black tracking-widest uppercase text-indigo-300">{activeTopic.authorName}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(activeTopic.timestamp)}</span>
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight tracking-tight drop-shadow-md">{activeTopic.title}</h2>
                    <p className="text-slate-300 font-medium leading-relaxed text-lg mb-8 max-w-2xl">{activeTopic.content}</p>
                    
                    {!isCreating && (
                        <button onClick={() => setIsCreating(true)} className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                            <Send size={16} /> Transmit Reply
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">
                
                {/* NEW RESPONSE FORM */}
                {isCreating && (
                    <form onSubmit={handlePostResponse} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border-2 border-indigo-200 dark:border-indigo-500/30 shadow-xl mb-10 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-400" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">New Transmission</h4>
                        
                        <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Transmission Header..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-black text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 mb-3" />
                        <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write data..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-400 outline-none focus:border-indigo-500 min-h-[100px] resize-none mb-4" />
                        
                        <VoiceRecorder onRecordingComplete={setPendingAudio} onCancel={() => setPendingAudio(null)} />
                        
                        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-[10px] uppercase tracking-widest transition-colors">Cancel</button>
                            <button type="submit" disabled={isUploading} className="px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors">
                                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14}/> Send</>}
                            </button>
                        </div>
                    </form>
                )}

                {/* RESPONSES FEED */}
                <div className="space-y-8">
                    {responses.length === 0 && !isCreating ? (
                        <div className="text-center py-12 opacity-40">
                            <Zap size={48} className="mx-auto mb-4 text-slate-400" />
                            <p className="font-black uppercase tracking-[0.2em] text-slate-500 text-xs">No Transmissions Received</p>
                        </div>
                    ) : (
                        responses.map((res) => (
                            <article key={res.id} className="relative">
                                {/* The Response Card */}
                                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 transition-colors duration-300">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <ForumAvatar url={res.authorAvatarUrl} name={res.authorName} role={res.role} size="md" />
                                            <div>
                                                <span className="block text-sm font-black text-slate-800 dark:text-slate-100 leading-none mb-1">{res.authorName}</span>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{formatDate(res.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{res.title}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium mb-6 whitespace-pre-wrap">{res.content}</p>
                                    
                                    {res.audioUrl && (
                                        <div className="mb-6 p-2 pl-4 pr-2 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center gap-3 border border-slate-200 dark:border-slate-800">
                                            <div className="w-6 h-6 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center shrink-0"><Volume2 size={12} /></div>
                                            <audio src={res.audioUrl} controls className="h-8 flex-1 opacity-80 scale-95 origin-left grayscale" />
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                                        <button onClick={() => handleToggleLike(res.id, res.likes || [], res.authorId)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${res.likes?.includes(auth.currentUser?.uid) ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-rose-400'}`}>
                                            <Heart size={14} className={res.likes?.includes(auth.currentUser?.uid) ? 'fill-rose-500 dark:fill-rose-400' : ''} /> 
                                            <span className="text-[10px] font-black uppercase tracking-widest">{res.likes?.length || 0}</span>
                                        </button>
                                        <button onClick={() => setReplyingToId(replyingToId === res.id ? null : res.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border text-[10px] font-black uppercase tracking-widest ${replyingToId === res.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-400'}`}>
                                            <MessageSquare size={14} /> Reply
                                        </button>
                                    </div>
                                </div>

                                {/* Threaded Comments Section */}
                                {(res.comments?.length > 0 || replyingToId === res.id) && (
                                    <div className="ml-8 md:ml-12 mt-4 space-y-3 relative before:absolute before:-left-6 before:top-0 before:bottom-6 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                                        {res.comments?.map((comment: any, idx: number) => (
                                            <div key={idx} className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800/80 transition-colors relative before:absolute before:-left-6 before:top-6 before:w-6 before:h-px before:bg-slate-200 dark:before:bg-slate-800">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <ForumAvatar url={comment.authorAvatarUrl} name={comment.authorName} role={comment.role} size="xs" />
                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{comment.authorName}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-auto">{formatDate(comment.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed pl-9">{comment.text}</p>
                                            </div>
                                        ))}
                                        
                                        {/* Active Reply Terminal */}
                                        {replyingToId === res.id && (
                                            <div className="relative flex items-center animate-in slide-in-from-top-2 before:absolute before:-left-6 before:top-1/2 before:w-6 before:h-px before:bg-indigo-300 dark:before:bg-indigo-500/50">
                                                <div className="absolute left-4 text-indigo-400 font-mono font-black text-xs">&gt;</div>
                                                <input 
                                                    autoFocus 
                                                    value={commentText} 
                                                    onChange={e => setCommentText(e.target.value)} 
                                                    placeholder="Enter command to reply..." 
                                                    className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-500/50 text-slate-800 dark:text-slate-100 rounded-2xl pl-10 pr-14 py-4 text-xs font-mono font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors shadow-sm" 
                                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(res.id)} 
                                                />
                                                <button 
                                                    onClick={() => handlePostComment(res.id)} 
                                                    disabled={!commentText.trim()}
                                                    className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-all"
                                                >
                                                    <Send size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </article>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

// ============================================================================
//  THE MONOCHROMATIC (PSX / SQUID GAME) LIVE TRIVIA REMOTE
// ============================================================================
const SHAPE_THEMES = [
    { color: 'bg-slate-800 hover:bg-slate-900 active:bg-black', shadow: 'shadow-[0_8px_0_rgb(15,23,42)]', icon: Triangle },
    { color: 'bg-slate-800 hover:bg-slate-900 active:bg-black', shadow: 'shadow-[0_8px_0_rgb(15,23,42)]', icon: Square },
    { color: 'bg-slate-800 hover:bg-slate-900 active:bg-black', shadow: 'shadow-[0_8px_0_rgb(15,23,42)]', icon: Circle },
    { color: 'bg-slate-800 hover:bg-slate-900 active:bg-black', shadow: 'shadow-[0_8px_0_rgb(15,23,42)]', icon: X }
];

const LiveTriviaRemote = ({ liveSession, lessons, studentEmail, classId, onLogActivity, userData }: any) => {
    const activeLesson = lessons.find((l: any) => l.id === liveSession?.lessonId);
    const pages = useMemo(() => {
        if (!activeLesson?.blocks) return [];
        const grouped: any[] = [];
        let buffer: any[] = [];
        activeLesson.blocks.forEach((b: any) => {
            if (['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game'].includes(b.type)) {
                if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
                grouped.push({ type: 'interact', blocks: [b] });
                buffer = [];
            } else { buffer.push(b); }
        });
        if (buffer.length > 0) grouped.push({ type: 'read', blocks: [...buffer] });
        return grouped;
    }, [activeLesson]);

    const currentPage = pages[liveSession?.currentBlockIndex || 0];
    const currentBlock = liveSession?.currentQuestion || currentPage?.blocks?.[0]; 
    const isQuiz = !!liveSession?.currentQuestion || currentBlock?.type === 'quiz';
    const safeEmail = (studentEmail || 'unknown@student').replace(/\./g, ',');
    
    const myAnswer = liveSession?.answers?.[safeEmail];
    const isRevealed = liveSession?.quizState === 'revealed';
    const isFinished = liveSession?.quizState === 'finished';

    const quizQuestion = currentBlock?.question || currentBlock?.content?.question || "Loading Question...";
    const quizOptions = currentBlock?.options || currentBlock?.content?.options || [];
    const quizCorrectId = currentBlock?.correctId || currentBlock?.content?.correctId;

    const xpEarned = liveSession?.finalScores?.[safeEmail] || 0;
    const pointsThisRound = liveSession?.roundPoints?.[safeEmail] || 0;
    const [xpLogged, setXpLogged] = useState(false);

    // 🔥 THIS IS WHERE WE INJECT THE EQUIPPED DATA WHEN THEY JOIN
    useEffect(() => {
        if (!classId || !studentEmail || !liveSession) return;
        if (liveSession.quizState === 'waiting' && !liveSession.joined?.[safeEmail]) {
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, { 
                [`joined.${safeEmail}`]: {
                    name: userData?.name || studentEmail,
                    equipped: userData?.equipped || {} // BROADCAST LOADOUT!
                } 
            }).catch(e => console.log("Could not ping lobby arrival:", e));
        }
    }, [classId, studentEmail, liveSession?.quizState, liveSession?.joined, safeEmail, userData]);

    useEffect(() => {
        if (isFinished && !xpLogged && xpEarned > 0) {
            const syncArenaXP = async () => {
                if (onLogActivity) {
                    await onLogActivity(
                        `arena_run_${classId}_${Date.now()}`,
                        xpEarned,
                        'Live Arena Protocol'
                    );
                }
                setXpLogged(true);
            };
            syncArenaXP();
        }
    }, [isFinished, xpLogged, xpEarned, classId, onLogActivity]);

    const submitAnswer = async (optionId: string) => {
        if (liveSession?.quizState !== 'active' || myAnswer) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        
        await updateDoc(sessionRef, { 
            [`answers.${safeEmail}`]: optionId,
            [`answerTimes.${safeEmail}`]: Date.now()
        });
    };

    if (!isQuiz || liveSession?.quizState === 'waiting') {
        return (
            <div className="h-full bg-black rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500 border-4 border-slate-800 shadow-[inset_0_0_100px_rgba(255,255,255,0.05)]">
                <div className="relative w-32 h-32 mb-8">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                    <Monitor size={128} className="text-emerald-400 relative z-10 animate-bounce-slow" strokeWidth={1} />
                </div>
                <h2 className="text-3xl font-black text-white mb-3 tracking-widest uppercase">Connection Secured</h2>
                <p className="text-slate-400 font-bold text-sm max-w-[250px] uppercase tracking-widest leading-loose">Awaiting protocol launch...</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="h-full bg-slate-950 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500 border-[4px] border-slate-800 shadow-[inset_0_0_100px_rgba(79,70,229,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
                    <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.3)] animate-bounce-slow" strokeWidth={1.5} />
                    <h2 className="text-3xl font-black text-white mb-2 tracking-widest uppercase">Protocol Complete</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">Simulation Terminated</p>
                    <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-6 w-full mb-8 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Total XP Earned</span>
                            <span className="text-4xl font-black text-indigo-400">+{xpEarned.toLocaleString()}</span> 
                        </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        {xpLogged || xpEarned === 0 ? <><CheckCircle2 size={12} className="text-emerald-500" /> XP Synced to Profile</> : <><Loader2 size={12} className="animate-spin text-indigo-400" /> Syncing XP...</>}
                    </div>
                </div>
            </div>
        );
    }

    if (isRevealed) {
        const isCorrect = myAnswer === quizCorrectId;
        return (
            <div className={`h-full rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500 border-[8px] ${isCorrect ? 'bg-slate-900 border-emerald-500/50 shadow-[inset_0_0_100px_rgba(16,185,129,0.2)]' : 'bg-black border-slate-800'}`}>
                {isCorrect ? <CheckCircle2 size={120} className="text-emerald-400 mb-6 animate-bounce" strokeWidth={3} /> : <XCircle size={120} className="text-slate-700 mb-6" strokeWidth={2} />}
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter drop-shadow-md">{isCorrect ? 'VALID' : 'ELIMINATED'}</h2>
                
                {isCorrect ? (
                    <div className="flex flex-col items-center gap-2 mt-4 animate-in slide-in-from-bottom-4 duration-700">
                        <span className="text-emerald-400 font-black text-4xl tabular-nums">+{pointsThisRound}</span>
                        {pointsThisRound > 850 && <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-1"><Zap size={12}/> Lightning Speed!</span>}
                    </div>
                ) : (
                    <p className="text-slate-500 font-black text-xl uppercase tracking-widest mt-4">0 XP</p>
                )}
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-950 rounded-[2.5rem] p-4 flex flex-col border-[4px] border-slate-800 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
            <div className="bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-800 mb-4 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-black px-3 py-1 rounded-lg inline-block mb-3 border border-slate-700">Target {liveSession.currentBlockIndex + 1}</span>
                <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{quizQuestion}</h2>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 pb-2">
                {quizOptions.map((opt: any, idx: number) => {
                    const Theme = SHAPE_THEMES[idx % 4];
                    const isSelected = myAnswer === opt.id;
                    return (
                        <button
                            key={opt.id} disabled={!!myAnswer} onClick={() => submitAnswer(opt.id)} style={{ WebkitTapHighlightColor: 'transparent' }}
                            className={`relative rounded-[2rem] flex flex-col items-center justify-center p-4 transition-all duration-150 focus:outline-none border-4 ${Theme.color} ${myAnswer && !isSelected ? 'opacity-20 grayscale translate-y-2 shadow-none border-transparent' : 'border-slate-700 ' + Theme.shadow} ${isSelected ? 'ring-4 ring-slate-400 scale-95 translate-y-2 shadow-none bg-black border-slate-500' : 'hover:-translate-y-1 active:translate-y-2 active:shadow-none'}`}
                        >
                            <Theme.icon size={64} strokeWidth={2.5} className="text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                            <span className="text-white font-bold text-sm md:text-base leading-tight px-2 break-words text-center tracking-wide opacity-90">{opt.text}</span>
                            {isSelected && <div className="absolute top-4 right-4 bg-white rounded-full p-1 shadow-[0_0_15px_rgba(255,255,255,0.8)]"><CheckCircle2 size={16} className="text-black" strokeWidth={3} /></div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
//  CONNECT FOUR: STUDENT REMOTE
// ============================================================================
const ConnectFourRemote = ({ liveSession, classId, studentEmail, onLogActivity, userData }: any) => {
    const safeEmail = (studentEmail || 'scholar@magister').replace(/\./g, ',');
    const myTeam = liveSession?.teams?.[safeEmail]; 
    const isMyTurn = liveSession?.currentTurn === myTeam;
    const isFinished = liveSession?.quizState === 'finished';

    const currentQ = liveSession?.currentQuestion;
    const myAnswer = liveSession?.answers?.[safeEmail];
    const iHaveUnlockedDrop = myAnswer === currentQ?.correctId;
    const [xpLogged, setXpLogged] = useState(false);

    // 🔥 INJECT EQUIPPED DATA WHEN JOINING
    useEffect(() => {
        if (!classId || !studentEmail || !liveSession) return;
        if (liveSession.quizState === 'waiting' && !liveSession.joined?.[safeEmail]) {
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, { 
                [`joined.${safeEmail}`]: {
                    name: userData?.name || studentEmail,
                    equipped: userData?.equipped || {} // BROADCAST LOADOUT
                }
            }).catch(e => console.log("Could not ping lobby arrival:", e));
        }
    }, [classId, studentEmail, liveSession?.quizState, liveSession?.joined, safeEmail, userData]);

    useEffect(() => {
        if (isFinished && liveSession?.winningTeam === myTeam && !xpLogged) {
            const handleVictory = async () => {
                if (onLogActivity) {
                    await onLogActivity(
                        `c4_victory_${classId}_${Date.now()}`, 
                        100, 
                        'Connect Four: Squad Victory'
                    );
                }
                setXpLogged(true);
            };
            handleVictory();
        }
    }, [isFinished, liveSession?.winningTeam, myTeam, xpLogged, classId, onLogActivity]);

    const submitAnswer = async (optionId: string) => {
        if (!isMyTurn || myAnswer) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, { [`answers.${safeEmail}`]: optionId });
    };

    const handleDrop = async (colIndex: number) => {
        if (!isMyTurn || !iHaveUnlockedDrop) return;
        
        const currentGrid = liveSession.grid || Array(7).fill([]);
        const currentColumn = currentGrid[colIndex] || [];
        if (currentColumn.length >= 6) return;

        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, { 
            lastMove: { 
                col: colIndex, 
                row: currentColumn.length, 
                team: myTeam,
                player: safeEmail, // 🔥 Tells the projector WHO dropped the piece!
                timestamp: Date.now() 
            } 
        });
    };

    if (isFinished) {
        const iWon = liveSession.winningTeam === myTeam;
        return (
            <div className={`h-full rounded-[3rem] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500 border-[12px] ${iWon ? 'bg-slate-900 border-emerald-500' : 'bg-black border-rose-900'}`}>
                {iWon ? <Trophy size={120} className="text-emerald-400 mb-6 animate-bounce" /> : <XCircle size={120} className="text-rose-900 mb-6" />}
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">{iWon ? 'VICTORY' : 'DEFEATED'}</h2>
                <p className="text-white/60 font-black uppercase tracking-widest">{iWon ? 'Squad Superiority Established' : 'Tactical Withdrawal Required'}</p>
                {iWon && (
                    <div className="mt-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        {xpLogged ? <><CheckCircle2 size={14} /> 100 XP Synced to Profile</> : <><Loader2 size={14} className="animate-spin" /> Syncing XP...</>}
                    </div>
                )}
            </div>
        );
    }

    if (!isMyTurn) {
        return (
            <div className="h-full bg-black rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center border-4 border-slate-900 shadow-inner">
                <div className="relative w-32 h-32 mb-8 opacity-20"><Shield size={128} className="text-slate-500 animate-pulse" /></div>
                <h2 className="text-2xl font-black text-slate-700 mb-2 tracking-widest uppercase">Enemy Squad Engaging...</h2>
                <p className="text-slate-800 font-bold text-xs uppercase tracking-widest">Hold your position</p>
            </div>
        );
    }

    if (iHaveUnlockedDrop) {
        return (
            <div className="h-full bg-slate-950 rounded-[2.5rem] p-4 flex flex-col border-4 border-slate-800 shadow-2xl">
                <div className={`p-6 rounded-[2rem] mb-6 text-center shadow-lg border-b-8 ${myTeam === 1 ? 'bg-rose-600 border-rose-800' : 'bg-indigo-600 border-indigo-800'}`}>
                    <Zap size={32} fill="white" className="mx-auto mb-2 text-white" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Access Granted</h2>
                    <p className="text-white/80 font-bold text-[10px] uppercase tracking-[0.2em]">Select Deployment Zone</p>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-3 pb-4">
                    {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                        <button key={col} onClick={() => handleDrop(col)} className={`rounded-2xl flex flex-col items-center justify-center font-black text-2xl transition-all active:scale-90 border-b-4 ${myTeam === 1 ? 'bg-rose-500 border-rose-700 text-white' : 'bg-indigo-500 border-indigo-700 text-white'}`}>
                            <ArrowDownCircle size={24} className="mb-2" /> {col + 1}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-950 rounded-[2.5rem] p-4 flex flex-col border-4 border-slate-800">
            <div className={`p-6 rounded-[2rem] mb-4 text-center border-b-4 ${myTeam === 1 ? 'bg-rose-900/50 border-rose-500' : 'bg-indigo-900/50 border-indigo-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Squad Intelligence Task</span>
                <h2 className="text-xl font-bold text-white leading-tight">"{currentQ?.question}"</h2>
            </div>
            <div className="flex-1 flex flex-col gap-3">
                {currentQ?.options.map((opt: any) => (
                    <button key={opt.id} onClick={() => submitAnswer(opt.id)} className={`flex-1 rounded-2xl p-4 font-black text-sm uppercase tracking-widest transition-all border-2 ${myAnswer === opt.id ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-400 border-slate-800 active:bg-slate-800'}`}>
                        {opt.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
//  MAIN STUDENT CLASS VIEW (ENTRY POINT)
// ============================================================================
export default function StudentClassView({ 
    classData, lessons = [], curriculums = [], onBack, 
    onSelectLesson, userData, setActiveTab, setSelectedLessonId, ExamPlayerView, onLogActivity 
}: any) {
  const [activeSubTab, setActiveSubTab] = useState<'lessons' | 'leaderboard' | 'exams' | 'forum' | 'grades' | 'live'>('lessons');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [liveSession, setLiveSession] = useState<any>(null);
  
  // 🔥 FETCH DECK DATA FOR SLIPSTREAM
  const [activeDeck, setActiveDeck] = useState<any>(null);

  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Record<string, boolean>>({ 
      [classData?.assignedCurriculums?.[0]]: true 
  });
  const [isScrolled, setIsScrolled] = useState(false);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setIsScrolled(e.currentTarget.scrollTop > 40);
  };
  const theme = getSubjectTheme(classData?.subject);
  const safeEmail = (userData?.email || auth?.currentUser?.email || 'unknown').replace(/\./g, ',');

  useEffect(() => {
    if (!classData || !userData?.email) return;
    const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('studentEmail', '==', userData.email), where('type', '==', 'completion'));
    return onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.flatMap(d => [d.data().itemId, d.data().originalId, d.data().itemTitle].filter(Boolean));
      setCompletedItems(ids);
    });
  }, [classData, userData]);

  useEffect(() => {
    if (!classData?.id) return;
    const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classData.id);
    return onSnapshot(sessionRef, async (docSnap) => {
        if (docSnap.exists()) {
            const sessionData = docSnap.data();
            setLiveSession(sessionData);
            
            if (sessionData.type === 'slipstream' && sessionData.lessonId) {
                const deckQuery = query(collection(db, 'artifacts', appId, 'published_decks'), where('id', '==', sessionData.lessonId));
                onSnapshot(deckQuery, (snap) => {
                   if (!snap.empty) {
                       setActiveDeck(snap.docs[0].data());
                   }
                });
            }
        } else {
            setLiveSession(null);
            setActiveDeck(null);
            if (activeSubTab === 'live') setActiveSubTab('lessons');
        }
    });
  }, [classData.id, activeSubTab]);

  const toggleRoadmap = (currId: string) => setExpandedRoadmaps(prev => ({ ...prev, [currId]: !prev[currId] }));

  const rawAssignments = Array.isArray(classData?.assignments) ? classData.assignments : [];
  const rawCurriculums = Array.isArray(classData?.assignedCurriculums) ? classData.assignedCurriculums : [];
  const populatedAssignments = rawAssignments.map((assignment: any) => typeof assignment === 'string' ? lessons.find((l: any) => l.id === assignment) : assignment).filter(Boolean);
  const assignedCurriculums = rawCurriculums.map((id: string) => curriculums.find((c: any) => c.id === id)).filter(Boolean);
  const standaloneLessons = populatedAssignments.filter((a: any) => !(a.contentType === 'exam' || a.contentType === 'test') && !assignedCurriculums.some((c: any) => c.lessonIds?.includes(a.id)));
  const examList = populatedAssignments.filter((a: any) => a.contentType === 'exam' || a.contentType === 'test');

  const isImmersiveLiveMode = activeSubTab === 'live' && liveSession;

  if (isImmersiveLiveMode) {
      return (
          <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in slide-in-from-bottom-8 duration-500 font-sans">
              <button onClick={() => setActiveSubTab('lessons')} className="absolute top-6 left-6 z-50 p-2 text-slate-500 hover:text-white rounded-full bg-slate-900 border border-slate-800"><X size={20} /></button>
              
              {/* 🔥 LIVE ARENA ROUTING HUB */}
              <div className="flex-1 w-full h-full p-4 md:p-8 pt-20">
                  {liveSession.type === 'slipstream' ? (
                      <StudentSlipstreamView 
                          user={userData || auth?.currentUser}
                          classId={classData.id}
                          deck={activeDeck || { cards: [] }} // Fallback while deck loads
                          liveState={liveSession}
                          onExit={() => setActiveSubTab('lessons')}
                      />
                  ) : liveSession.type === 'connect_four' ? (
                    <ConnectFourRemote 
                        liveSession={liveSession} 
                        classId={classData.id} 
                        studentEmail={userData?.email || auth?.currentUser?.email} 
                        onLogActivity={onLogActivity}
                        userData={userData} // Pass userData for payload injection
                    />
                  ) : (
                    <LiveTriviaRemote 
                        liveSession={liveSession} 
                        lessons={lessons} 
                        classId={classData.id} 
                        studentEmail={userData?.email || auth?.currentUser?.email} 
                        onLogActivity={onLogActivity}
                        userData={userData} // Pass userData for payload injection
                    />                  
                  )}
              </div>
          </div>
      );
  }

return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500 font-sans relative transition-colors duration-300">
      
      {/* 🔥 UPGRADED DYNAMIC HEADER */}
      <header className={`shrink-0 z-10 relative shadow-xl transition-all duration-500 ease-in-out overflow-hidden ${theme.bg} ${isScrolled ? 'rounded-b-3xl p-5 md:p-6' : 'rounded-b-[3rem] p-6 md:p-10 pt-10 md:pt-16'}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        {/* Top Bar: Always Visible */}
        <div className="flex items-center justify-between relative z-20">
            <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-xs font-black uppercase tracking-widest active:scale-95">
                <ArrowLeft size={16} /> BACK TO HUB
            </button>

            {/* Mini Title: Fades in when the big banner collapses */}
            <span className={`text-white font-black text-xs uppercase tracking-widest truncate max-w-[150px] md:max-w-xs transition-all duration-500 ${isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                {classData.name}
            </span>
        </div>

        {/* The Collapsible Banner Content */}
        <div className={`relative z-10 transition-all duration-500 ease-in-out origin-top ${isScrolled ? 'max-h-0 opacity-0 scale-95' : 'max-h-[500px] opacity-100 scale-100 mt-6'}`}>
            <span className="inline-block px-3 py-1.5 bg-black/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 shadow-inner">
                {classData?.grade || 'General'} • {classData?.subject || 'Subject'}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-tighter drop-shadow-sm">
                {classData.name}
            </h2>
            <div className="flex items-center gap-2 mt-4">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <p className="text-white/90 font-bold text-sm md:text-base line-clamp-1">
                    {classData.description || "Your learning adventure starts here."}
                </p>
            </div>
        </div>
      </header>

      {/* 🔥 ATTACH THE SCROLL LISTENER HERE */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative px-2 md:px-6 pb-48 pt-6" onScroll={handleScroll}>

        {liveSession && activeSubTab !== 'live' && (
            <div className="px-4 mb-6 animate-in slide-in-from-top-4 fade-in duration-500">
                <button onClick={() => setActiveSubTab('live')} className="w-full bg-black rounded-[2rem] p-1 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white opacity-10 animate-pulse" />
                    <div className="relative bg-slate-950 rounded-[1.8rem] p-4 flex items-center justify-between border border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-bounce-slow"><Zap size={24} className="text-black" fill="currentColor" /></div>
                            <div className="text-left"><h4 className="text-white font-black text-lg tracking-widest uppercase">LIVE PROTOCOL ACTIVE!</h4><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Join the classroom engage now</p></div>
                        </div>
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white"><ChevronRight size={20} strokeWidth={3} /></div>
                    </div>
                </button>
            </div>
        )}

        {activeSubTab === 'lessons' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
             {assignedCurriculums.length > 0 ? (
                 <section className="space-y-8 mb-10 max-w-lg mx-auto">
                     {assignedCurriculums.map((curr: any) => (
                         <CurriculumPathway key={curr.id} curr={curr} lessons={lessons} completedItems={completedItems} isExpanded={!!expandedRoadmaps[curr.id]} onToggle={() => toggleRoadmap(curr.id)} onSelectLesson={onSelectLesson} theme={theme} />
                     ))}
                 </section>
             ) : (
                <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 m-4 transition-colors duration-300">
                    <Map size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Map Loading...</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">Your instructor hasn't drawn the path yet.</p>
                </div>
             )}
             {standaloneLessons.length > 0 && (
                 <section className="space-y-4 mb-10 px-4 max-w-lg mx-auto">
                     <div className="flex items-center gap-3 ml-2 mb-6"><div className="h-1 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full" /><h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bonus Quests</h3><div className="h-1 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full" /></div>
                     {standaloneLessons.map((item: any) => (<StandaloneAssignmentCard key={item.id} item={item} isCompleted={completedItems.includes(item.id)} onSelectLesson={onSelectLesson} theme={theme} />))}
                 </section>
             )}
          </div>
        )}

        {activeSubTab === 'leaderboard' && <LeaderboardView studentEmails={classData.studentEmails} currentUserEmail={userData.email} />}
        {activeSubTab === 'exams' && (
          <section className="space-y-4 px-4 max-w-lg mx-auto">
            {examList.length === 0 ? <div className="text-center py-20 opacity-40"><FileText size={48} className="mx-auto mb-4 text-slate-800 dark:text-slate-100" /><p className="font-black text-xs uppercase tracking-widest leading-loose text-slate-800 dark:text-slate-100">No active exams assigned.</p></div> : examList.map((item: any) => <ExamCard key={item.id} item={item} onSelectLesson={onSelectLesson} />)}
          </section>
        )}
        {activeSubTab === 'forum' && <div className="h-[70vh]"><ClassForum classId={classData.id} userData={userData} /></div>}
        {activeSubTab === 'grades' && <StudentGradebook classData={classData} user={userData} />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[550px] z-[100] px-2">
          <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-2xl p-2 rounded-full shadow-2xl border border-white/10 flex items-center justify-between gap-1 transition-colors duration-300">
            {[
              { id: 'lessons', label: 'Roadmap', icon: <BookOpen size={18} /> },
              { id: 'leaderboard', label: 'Rankings', icon: <Trophy size={18} /> },
              { id: 'exams', label: 'Exams', icon: <FileText size={18} /> },
              { id: 'forum', label: 'Forum', icon: <MessageSquare size={18} /> },
              { id: 'grades', label: 'Grades', icon: <CheckCircle2 size={18} /> }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`flex flex-1 items-center justify-center gap-2 py-3.5 px-4 rounded-full transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                  {tab.icon}
                  {isActive && <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">{tab.label}</span>}
                </button>
              );
            })}
          </div>
      </nav>
    </div>
  );
}

const CurriculumPathway = ({ curr, lessons, completedItems, isExpanded, onToggle, onSelectLesson, theme }: any) => {
    const currLessons = (curr.lessonIds || []).map((id: string) => lessons.find((l: any) => l.id === id)).filter(Boolean);
    const completedCountInCurr = currLessons.filter((l: any) => completedItems.includes(l.id)).length;
    const progressPercent = currLessons.length > 0 ? Math.round((completedCountInCurr / currLessons.length) * 100) : 0;
    const activeNodeIndex = currLessons.findIndex((l: any) => !completedItems.includes(l.id));
    const normalizedActiveIndex = activeNodeIndex === -1 ? currLessons.length - 1 : activeNodeIndex;
    const headerAccent = curr.themeColor || '#6366f1';
    return (
        <article className="bg-transparent relative pb-8">
            <button className="w-full text-left bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden group transition-colors duration-300" onClick={onToggle}>
                <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{ backgroundColor: headerAccent }} />
                <div className="relative z-10 flex items-center justify-between mb-6">
                    <div>
                        <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase mb-3 inline-block transition-colors duration-300">{curr.grade || 'Pathway'}</span>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 pr-4 leading-tight">{curr.title}</h3>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors duration-300"><ChevronUp size={24} className={isExpanded ? '' : 'rotate-180 transition-transform'} /></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner dark:shadow-none flex-1 transition-colors duration-300">
                        <div className="h-full transition-all duration-1000" style={{ width: `${progressPercent}%`, backgroundColor: headerAccent }} />
                    </div>
                    <span className="text-sm font-black text-slate-400 dark:text-slate-500 shrink-0">{progressPercent}%</span>
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-700 ${isExpanded ? 'max-h-[5000px] opacity-100 mt-[-2rem]' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="pt-16 pb-12 px-1 sm:px-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-b-[3rem] border-2 border-t-0 border-slate-100 dark:border-slate-800 relative transition-colors duration-300">
                    <div className="relative max-w-sm mx-auto w-full">
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 bg-slate-200/60 dark:bg-slate-800/60 rounded-full z-0 transition-colors duration-300" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 rounded-full transition-all duration-1000 z-0 shadow-inner dark:shadow-none" style={{ height: `${currLessons.length > 1 ? (normalizedActiveIndex / (currLessons.length - 1)) * 100 : 100}%`, backgroundColor: headerAccent }} />
                        <div className="relative z-10 flex flex-col gap-8 sm:gap-12 py-8">
                            {currLessons.map((item: any, index: number) => {
                                const isCompleted = completedItems.includes(item.id);
                                const isCurrent = index === normalizedActiveIndex;
                                const isLocked = index > normalizedActiveIndex;
                                const isExam = item.contentType === 'exam' || item.contentType === 'test';
                                const isLeft = index % 2 === 0;
                                return (
                                    <div key={item.id} className={`relative flex w-full items-center min-h-[90px] ${isLocked ? 'opacity-60' : ''}`}>
                                        <div className={`w-1/2 flex justify-end pr-10 sm:pr-14 z-10 ${!isLeft ? 'invisible' : ''}`}>
                                            <div className={`bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border-2 ${isCurrent ? 'border-indigo-300 dark:border-indigo-500/50 scale-105' : 'border-slate-100 dark:border-slate-800'} w-full max-w-[150px] text-right transition-colors duration-300`}>
                                                <span className={`text-[9px] font-black uppercase mb-1 ${isCurrent ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{isExam ? 'Checkpoint' : `Module ${index + 1}`}</span>
                                                <h4 className="font-black text-[11px] sm:text-sm text-slate-800 dark:text-slate-100 leading-tight">{item.title}</h4>
                                            </div>
                                        </div>
                                        <div className={`absolute left-1/2 top-1/2 -translate-y-1/2 z-20 ${isLeft ? '-translate-x-[30%]' : '-translate-x-[70%]'}`}>
                                            <button disabled={isLocked} onClick={() => onSelectLesson(item)} className={`relative w-16 h-16 sm:w-20 rounded-full flex items-center justify-center border-[6px] transition-all shadow-xl ${isCompleted ? 'bg-emerald-500 border-white dark:border-slate-900 text-white' : isCurrent ? `bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 scale-110 animate-bounce-slow shadow-2xl` : 'bg-slate-100 dark:bg-slate-800 border-white dark:border-slate-900 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`} style={{ ...(isCurrent && !isExam ? { borderColor: headerAccent, color: headerAccent } : {}) }}>
                                                {isCompleted ? <CheckCircle2 size={24} strokeWidth={3} /> : isLocked ? <Lock size={20} /> : isExam ? <Trophy size={24} fill={isCurrent ? "currentColor" : "none"} /> : <Play size={24} className="ml-1" fill={isCurrent ? "currentColor" : "none"} />}
                                                {isCurrent && <div className="absolute inset-0 -m-3 border-4 rounded-full animate-ping opacity-40" style={{ borderColor: isExam ? '#f43f5e' : headerAccent }} />}
                                            </button>
                                        </div>
                                        <div className={`w-1/2 flex justify-start pl-10 sm:pl-14 z-10 ${isLeft ? 'invisible' : ''}`}>
                                            <div className={`bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border-2 ${isCurrent ? 'border-indigo-300 dark:border-indigo-500/50 scale-105' : 'border-slate-100 dark:border-slate-800'} w-full max-w-[150px] text-left transition-colors duration-300`}>
                                                <span className={`text-[9px] font-black uppercase mb-1 ${isCurrent ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{isExam ? 'Checkpoint' : `Module ${index + 1}`}</span>
                                                <h4 className="font-black text-[11px] sm:text-sm text-slate-800 dark:text-slate-100 leading-tight">{item.title}</h4>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};

const StandaloneAssignmentCard = ({ item, isCompleted, onSelectLesson, theme }: any) => (
    <button className={`w-full text-left p-5 border-4 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center gap-4 transition-all group ${isCompleted ? 'border-emerald-100 dark:border-emerald-500/20' : 'border-slate-100 dark:border-slate-800 shadow-md hover:border-indigo-100 dark:hover:border-indigo-500/30'}`} onClick={() => onSelectLesson(item)}>
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-inner dark:shadow-none transition-colors shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' : `${theme.bg} text-white`}`}>{isCompleted ? <CheckCircle2 size={28} strokeWidth={3} /> : item.type === 'arcade_game' ? <Gamepad2 size={28} /> : <Play size={28} className="ml-1" fill="currentColor" />}</div>
        <div className="flex-1 pr-2"><span className={`text-[10px] font-black uppercase mb-1 block ${isCompleted ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{isCompleted ? 'Completed' : 'Special Assignment'}</span><h4 className="font-black text-slate-800 dark:text-slate-100 text-xl leading-tight transition-colors">{item.title}</h4></div>
    </button>
);

const ExamCard = ({ item, onSelectLesson }: any) => (
    <button className="w-full text-left p-6 border-4 border-rose-100 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/10 rounded-[3rem] flex items-center gap-5 transition-all group duration-300" onClick={() => onSelectLesson(item)}>
      <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 shadow-lg border-4 border-rose-100 dark:border-rose-500/20 shrink-0 transition-colors duration-300"><Trophy size={36} fill="currentColor" /></div>
      <div><span className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-400 tracking-widest bg-rose-100 dark:bg-rose-500/20 px-3 py-1 rounded-lg mb-2 inline-block transition-colors duration-300">High-Stakes Assessment</span><h4 className="font-black text-slate-900 dark:text-white text-2xl leading-tight transition-colors">{item.title}</h4></div>
    </button>
);
