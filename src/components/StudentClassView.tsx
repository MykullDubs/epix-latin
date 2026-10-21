// src/components/StudentClassView.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    query, collection, where, onSnapshot, orderBy, limit, addDoc,
    doc, updateDoc, arrayUnion, arrayRemove, setDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { auth, db, storage, appId } from '../config/firebase';
import { 
    MessageSquare, Send, ArrowLeft, BookOpen, CheckCircle2, 
    Lock, Play, ChevronRight, Monitor, FileText, ChevronDown, 
    ChevronUp, Trophy, Zap, Flame, Plus, User, Heart,
    Mic, Square, Volume2, Loader2, Shield, Map, Gamepad2,
    Triangle, Circle, XCircle, X, ArrowDownCircle, Settings, Sparkles,
    Layers, HelpCircle, PlayCircle
} from 'lucide-react';
import StudentGradebook from './StudentGradebook';
import LeaderboardView from './LeaderboardView';
import StudentSlipstreamView from './StudentSlipstreamView';
import HoloAvatar from './HoloAvatar';
import AvatarForge from './AvatarForge';
import MarbleScrabble from './MarbleScrabble';

// --- THEME HELPER (Strict Flat UI) ---
const getSubjectTheme = (subject: string) => {
    const sub = subject?.toLowerCase() || '';
    if (sub.includes('math')) return { color: 'text-rose-600 dark:text-rose-500', bg: 'bg-rose-600', textWhite: 'text-white', border: 'border-rose-600 dark:border-rose-500' };
    if (sub.includes('science') || sub.includes('bio')) return { color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-600', textWhite: 'text-white', border: 'border-emerald-600 dark:border-emerald-500' };
    if (sub.includes('social') || sub.includes('history')) return { color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500', textWhite: 'text-black', border: 'border-amber-500 dark:border-amber-400' };
    if (sub.includes('read') || sub.includes('english')) return { color: 'text-cyan-500 dark:text-cyan-400', bg: 'bg-cyan-500', textWhite: 'text-black', border: 'border-cyan-500 dark:border-cyan-400' };
    return { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-600', textWhite: 'text-white', border: 'border-indigo-600 dark:border-indigo-500' };
};

// ============================================================================
//  SUB-COMPONENT: FORUM AVATAR (Flat)
// ============================================================================
const ForumAvatar = ({ url, name, role, size = "md" }: any) => {
    const initials = name?.split(' ').map((n:any) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';
    const sizeClasses: any = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
    
    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full border-2 border-zinc-900 dark:border-zinc-200 flex items-center justify-center font-black overflow-hidden ${url ? 'bg-white dark:bg-black' : 'bg-indigo-600 text-white border-indigo-600'}`}>
                {url ? <img src={url} alt={`${name}'s avatar`} className="w-full h-full object-cover" /> : <span aria-hidden="true">{initials}</span>}
            </div>
            {role === 'instructor' && (
                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 border-2 border-zinc-900 dark:border-zinc-100 p-0.5">
                    <Shield size={size === 'xs' ? 8 : 10} className="text-black" fill="currentColor" />
                </div>
            )}
        </div>
    );
};

// ============================================================================
//  VOICE RECORDER COMPONENT (Flat)
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
    <div className="bg-zinc-100 dark:bg-zinc-900 p-2 pl-4 border-2 border-zinc-900 dark:border-zinc-200 flex items-center justify-between">
      {!audioUrl ? (
        <div className="flex items-center gap-4 w-full">
          <div className={`w-3 h-3 ${isRecording ? 'bg-rose-600 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
          <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex-1 ${isRecording ? 'text-rose-600' : 'text-zinc-500'}`}>
            {isRecording ? "Recording Transmission..." : "Attach Voice Memo"}
          </span>
          <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`w-10 h-10 flex items-center justify-center border-2 border-zinc-900 dark:border-zinc-200 transition-colors ${isRecording ? 'bg-rose-600 text-white border-rose-600' : 'bg-white dark:bg-black hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>
            {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={16} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full animate-in fade-in">
          <div className="w-8 h-8 bg-emerald-500 text-black flex items-center justify-center shrink-0">
              <Mic size={14} />
          </div>
          <audio src={audioUrl} controls className="h-8 flex-1 opacity-90 grayscale" />
          <button type="button" onClick={() => { setAudioUrl(null); onCancel(); }} className="text-white bg-rose-600 w-8 h-8 flex items-center justify-center hover:bg-rose-500 transition-colors"><X size={16} strokeWidth={3} /></button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
//  INTERNAL FORUM COMPONENT (Flat)
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
      return new Date(ts).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (view === 'list') {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 p-4 md:p-6 overflow-hidden animate-in fade-in duration-300">
        <header className="flex justify-between items-center mb-6 pb-4 border-b-2 border-zinc-900 dark:border-zinc-200">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-zinc-950 dark:text-white uppercase tracking-tight leading-none">Comms Link</h3>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Active Discussions</p>
                </div>
            </div>
            {isInstructor && (
                <button onClick={() => setIsCreating(true)} className="bg-zinc-950 dark:bg-white text-white dark:text-black px-5 py-3 font-black text-[10px] uppercase flex items-center gap-2 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-colors">
                  <Plus size={16} strokeWidth={3} /> <span className="hidden sm:inline">New Directive</span>
                </button>
            )}
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-20">
            {isCreating && (
                <form onSubmit={handleCreateTopic} className="bg-zinc-100 dark:bg-zinc-900 p-6 border-2 border-indigo-600 mb-8 relative">
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Directive Title..." className="w-full bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 text-lg font-black text-zinc-900 dark:text-white outline-none px-4 py-3 mb-3" />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Enter details..." className="w-full bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none px-4 py-3 min-h-[100px] resize-none" />
                    <div className="flex gap-3 justify-end mt-4 pt-4 border-t-2 border-zinc-200 dark:border-zinc-800">
                        <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 text-zinc-500 hover:text-black dark:hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-colors">Cancel</button>
                        <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-colors flex items-center gap-2">Broadcast <Send size={14}/></button>
                    </div>
                </form>
            )}

            {topics.length === 0 && !isCreating && (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center opacity-50">
                    <MessageSquare size={48} className="mb-4 text-zinc-400" strokeWidth={2} />
                    <p className="font-black uppercase tracking-[0.2em] text-zinc-500 text-xs">No Comms Active</p>
                </div>
            )}

            {topics.map(t => (
                <button key={t.id} onClick={() => { setActiveTopic(t); setView('thread'); }} className="w-full bg-white dark:bg-black p-6 border-2 border-zinc-900 dark:border-zinc-200 hover:border-indigo-600 transition-colors text-left flex flex-col">
                    <div className="flex justify-between items-start gap-4 mb-3 w-full">
                        <h4 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white leading-tight">{t.title}</h4>
                        <span className="shrink-0 bg-zinc-950 dark:bg-white text-white dark:text-black px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1"><ChevronRight size={12} strokeWidth={3} /> Enter</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-6 font-bold leading-relaxed">{t.content}</p>
                    <div className="flex items-center justify-between pt-4 border-t-2 border-zinc-100 dark:border-zinc-900 w-full">
                        <div className="flex items-center gap-3 text-xs font-black uppercase text-zinc-500 tracking-[0.1em]">
                            <ForumAvatar url={t.authorAvatarUrl} name={t.authorName} role={t.role} size="xs" />
                            <span className="truncate max-w-[120px] text-zinc-900 dark:text-zinc-100">{t.authorName}</span>
                        </div>
                        <span className="text-[10px] font-black tabular-nums text-zinc-400 uppercase tracking-widest">{formatDate(t.timestamp)}</span>
                    </div>
                </button>
            ))}
        </div>
      </div>
    );
  }

  // --- THREAD VIEW (Terminal Style) ---
  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 overflow-hidden animate-in slide-in-from-right-8 duration-300">
        <header className="bg-zinc-100 dark:bg-zinc-900 p-4 border-b-2 border-zinc-900 dark:border-zinc-200 flex items-center justify-between shrink-0">
            <button onClick={() => setView('list')} className="flex items-center gap-2 text-zinc-950 dark:text-white font-black text-[10px] tracking-[0.2em] uppercase hover:text-indigo-600 transition-colors"><ArrowLeft size={14} strokeWidth={3} /> Retreat</button>
            <span className="text-[10px] font-black text-white bg-indigo-600 uppercase tracking-[0.2em] px-3 py-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white" /> Live Thread
            </span>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="bg-zinc-950 text-white px-4 py-8 md:p-10 border-b-4 border-indigo-600 shrink-0">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <ForumAvatar url={activeTopic.authorAvatarUrl} name={activeTopic.authorName} role={activeTopic.role} size="md" />
                        <div>
                            <span className="block text-xs font-black tracking-[0.2em] uppercase text-indigo-400 mb-1">{activeTopic.authorName}</span>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest tabular-nums">{formatDate(activeTopic.timestamp)}</span>
                        </div>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black mb-4 leading-tight tracking-tighter uppercase">{activeTopic.title}</h2>
                    <p className="text-zinc-300 font-bold leading-relaxed text-sm sm:text-base mb-8 whitespace-pre-wrap">{activeTopic.content}</p>
                    
                    {!isCreating && (
                        <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2">
                            <Send size={14} strokeWidth={3} /> Transmit Reply
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">
                {isCreating && (
                    <form onSubmit={handlePostResponse} className="bg-zinc-100 dark:bg-zinc-900 p-6 border-2 border-indigo-600 mb-8 animate-in fade-in">
                        <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4">New Transmission</h4>
                        
                        <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Transmission Header..." className="w-full bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 px-4 py-3 text-sm font-black text-zinc-900 dark:text-white outline-none focus:border-indigo-600 mb-3" />
                        <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write data..." className="w-full bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-600 min-h-[100px] resize-none mb-4" />
                        
                        <VoiceRecorder onRecordingComplete={setPendingAudio} onCancel={() => setPendingAudio(null)} />
                        
                        <div className="flex gap-3 justify-end mt-6 pt-4 border-t-2 border-zinc-300 dark:border-zinc-800">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 text-zinc-500 hover:text-black dark:hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-colors">Cancel</button>
                            <button type="submit" disabled={isUploading} className="px-8 py-3 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors">
                                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} strokeWidth={3}/> Send</>}
                            </button>
                        </div>
                    </form>
                )}

                <div className="space-y-6">
                    {responses.length === 0 && !isCreating ? (
                        <div className="text-center py-12 opacity-50">
                            <Zap size={40} className="mx-auto mb-4 text-zinc-400" />
                            <p className="font-black uppercase tracking-[0.2em] text-zinc-500 text-xs">No Transmissions Received</p>
                        </div>
                    ) : (
                        responses.map((res) => (
                            <article key={res.id} className="bg-white dark:bg-black border-2 border-zinc-900 dark:border-zinc-200 p-5 md:p-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <ForumAvatar url={res.authorAvatarUrl} name={res.authorName} role={res.role} size="md" />
                                    <div>
                                        <span className="block text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest leading-none mb-1">{res.authorName}</span>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest tabular-nums">{formatDate(res.timestamp)}</span>
                                    </div>
                                </div>
                                
                                <h4 className="text-xl font-black text-zinc-950 dark:text-white mb-2 uppercase tracking-tight">{res.title}</h4>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-bold leading-relaxed mb-6 whitespace-pre-wrap">{res.content}</p>
                                
                                {res.audioUrl && (
                                    <div className="mb-6 p-2 pl-4 pr-2 bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-200 flex items-center gap-3">
                                        <div className="w-6 h-6 bg-indigo-600 text-white flex items-center justify-center shrink-0"><Volume2 size={12} strokeWidth={3} /></div>
                                        <audio src={res.audioUrl} controls className="h-8 flex-1 opacity-90 grayscale" />
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-4 pt-4 border-t-2 border-zinc-100 dark:border-zinc-800">
                                    <button onClick={() => handleToggleLike(res.id, res.likes || [], res.authorId)} className={`flex items-center gap-2 px-4 py-2 border-2 transition-colors ${res.likes?.includes(auth.currentUser?.uid) ? 'bg-rose-600 border-rose-600 text-white' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-rose-600 hover:text-rose-600'}`}>
                                        <Heart size={14} strokeWidth={3} className={res.likes?.includes(auth.currentUser?.uid) ? 'fill-white' : ''} /> 
                                        <span className="text-[10px] font-black uppercase tracking-widest tabular-nums">{res.likes?.length || 0}</span>
                                    </button>
                                    <button onClick={() => setReplyingToId(replyingToId === res.id ? null : res.id)} className={`flex items-center gap-2 px-4 py-2 border-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${replyingToId === res.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-indigo-600 hover:text-indigo-600'}`}>
                                        <MessageSquare size={14} strokeWidth={3} /> Reply
                                    </button>
                                </div>

                                {(res.comments?.length > 0 || replyingToId === res.id) && (
                                    <div className="mt-4 pl-4 sm:pl-6 space-y-3 border-l-4 border-zinc-200 dark:border-zinc-800">
                                        {res.comments?.map((comment: any, idx: number) => (
                                            <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 p-4 border-2 border-zinc-200 dark:border-zinc-800">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <ForumAvatar url={comment.authorAvatarUrl} name={comment.authorName} role={comment.role} size="xs" />
                                                    <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-[0.2em]">{comment.authorName}</span>
                                                    <span className="text-[9px] font-black text-zinc-400 tabular-nums ml-auto uppercase">{formatDate(comment.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-zinc-800 dark:text-zinc-200 font-bold leading-relaxed pl-9">{comment.text}</p>
                                            </div>
                                        ))}
                                        
                                        {replyingToId === res.id && (
                                            <div className="relative flex items-stretch mt-4">
                                                <div className="bg-indigo-600 text-white px-3 flex items-center justify-center font-black text-sm">&gt;</div>
                                                <input 
                                                    autoFocus 
                                                    value={commentText} 
                                                    onChange={e => setCommentText(e.target.value)} 
                                                    placeholder="Enter command to reply..." 
                                                    className="w-full bg-white dark:bg-black border-y-2 border-r-2 border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100 px-4 py-3 text-xs font-bold outline-none focus:border-indigo-600" 
                                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(res.id)} 
                                                />
                                                <button 
                                                    onClick={() => handlePostComment(res.id)} 
                                                    disabled={!commentText.trim()}
                                                    className="px-4 bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors"
                                                >
                                                    <Send size={14} strokeWidth={3} />
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
//  THE MONOCHROMATIC (PSX / SQUID GAME) LIVE TRIVIA REMOTE (Flat)
// ============================================================================
const SHAPE_THEMES = [
    { bg: 'bg-rose-600', active: 'bg-rose-500 text-black', icon: Triangle },
    { bg: 'bg-emerald-600', active: 'bg-emerald-500 text-black', icon: Square },
    { bg: 'bg-amber-500', active: 'bg-amber-400 text-black', icon: Circle },
    { bg: 'bg-cyan-500', active: 'bg-cyan-400 text-black', icon: X }
];

const LiveTriviaRemote = ({ liveSession, lessons, allDecks, studentEmail, classId, onLogActivity, userData }: any) => {
    const [showForge, setShowForge] = useState(false);

    const activeLesson = useMemo(() => {
        if (!liveSession?.lessonId) return null;
        let node = lessons.find((l: any) => l.id === liveSession.lessonId);
        if (node) return node;

        let deck = allDecks?.[liveSession.lessonId] || Object.values(allDecks || {}).find((d: any) => d.id === liveSession.lessonId);
        if (deck) {
            return {
                id: deck.id,
                title: deck.title || deck.name,
                blocks: [{ type: 'deck', cards: deck.cards || [] }]
            };
        }
        return null;
    }, [lessons, allDecks, liveSession?.lessonId]);

    const pages = useMemo(() => {
        if (!activeLesson?.blocks) return [];
        const grouped: any[] = [];
        let buffer: any[] = [];
        activeLesson.blocks.forEach((b: any) => {
            if (['quiz', 'flashcard', 'scenario', 'fill-blank', 'discussion', 'game', 'deck'].includes(b.type)) {
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

    useEffect(() => {
        if (!classId || !studentEmail || !liveSession) return;
        if (!liveSession.joined?.[safeEmail]) {
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, { 
                [`joined.${safeEmail}`]: {
                    name: userData?.name || studentEmail,
                    equipped: userData?.equipped || {},
                    avatarUrl: userData?.profile?.main?.avatarUrl || userData?.avatarUrl || '' 
                } 
            }).catch(e => console.log("Could not ping lobby arrival:", e));
        }
    }, [classId, studentEmail, liveSession?.joined, safeEmail, userData]);

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

    const handleSaveAvatar = async (finalUrl: string, config: any) => {
        if (!auth.currentUser?.uid) return;
        try {
            const userRef = doc(db, 'artifacts', appId, 'users', auth.currentUser.uid);
            const newEquipped = { ...(userData?.equipped || {}) };
            delete newEquipped.avatars;

            await updateDoc(userRef, {
                'profile.main.avatarUrl': finalUrl,
                'customAvatarConfig': config,
                'equipped': newEquipped
            });

            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            await updateDoc(sessionRef, {
                [`joined.${safeEmail}.avatarUrl`]: finalUrl,
                [`joined.${safeEmail}.equipped`]: newEquipped
            });

            setShowForge(false);
        } catch (err) {
            console.error("Avatar live sync failed:", err);
        }
    };

    if (!isQuiz || liveSession?.quizState === 'waiting') {
        const studentData = {
            name: userData?.name || studentEmail,
            equipped: liveSession?.joined?.[safeEmail]?.equipped || userData?.equipped || {},
            avatarUrl: liveSession?.joined?.[safeEmail]?.avatarUrl || userData?.profile?.main?.avatarUrl
        };

        return (
            <div className="h-full bg-black flex flex-col items-center justify-center p-8 text-center border-4 border-zinc-800 animate-in fade-in">
                {showForge && (
                    <AvatarForge
                        currentConfig={userData?.customAvatarConfig}
                        onSave={handleSaveAvatar}
                        onClose={() => setShowForge(false)}
                    />
                )}

                <div className="relative w-40 h-40 mb-8 cursor-pointer group border-4 border-zinc-800" onClick={() => setShowForge(true)}>
                    <HoloAvatar student={studentData} size="hero" className="relative z-10 w-full h-full" />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-20">
                        <Settings className="text-white mb-1" size={24} strokeWidth={2.5}/>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Tune</span>
                    </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-2 tracking-[0.2em] uppercase">Connection Secured</h2>
                <p className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em] mb-8">Awaiting Protocol Launch</p>
                
                <button onClick={() => setShowForge(true)} className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-4 font-black text-[10px] uppercase tracking-[0.2em] transition-colors flex items-center gap-2 border-2 border-zinc-700">
                   <Settings size={14} strokeWidth={3}/> Tune Avatar
                </button>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="h-full bg-black flex flex-col items-center justify-center p-8 text-center border-[8px] border-zinc-800 animate-in zoom-in duration-300">
                <Trophy size={80} className="text-amber-400 mb-6" strokeWidth={2.5} />
                <h2 className="text-3xl font-black text-white mb-2 tracking-[0.2em] uppercase">Protocol Complete</h2>
                <p className="text-rose-500 font-black text-xs uppercase tracking-[0.2em] mb-10">Simulation Terminated</p>
                
                <div className="bg-zinc-900 border-4 border-zinc-800 p-6 w-full max-w-sm mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Total XP Earned</span>
                        <span className="text-4xl font-black text-emerald-400 tabular-nums">+{xpEarned}</span> 
                    </div>
                </div>
                
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    {xpLogged || xpEarned === 0 ? <><CheckCircle2 size={14} className="text-emerald-500" strokeWidth={3}/> XP Synced to Profile</> : <><Loader2 size={14} className="animate-spin text-indigo-400" /> Syncing XP...</>}
                </div>
            </div>
        );
    }

    if (isRevealed) {
        const isCorrect = myAnswer === quizCorrectId;

        return (
            <div className={`h-full flex flex-col items-center justify-center p-8 text-center border-[12px] animate-in zoom-in duration-300 ${isCorrect ? 'bg-black border-emerald-500' : 'bg-black border-rose-600'}`}>
                {isCorrect ? <CheckCircle2 size={120} className="text-emerald-500 mb-6" strokeWidth={4} /> : <XCircle size={120} className="text-rose-600 mb-6" strokeWidth={4} />}
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">{isCorrect ? 'Valid' : 'Eliminated'}</h2>
                
                {isCorrect ? (
                    <div className="flex flex-col items-center gap-2 mt-4 animate-in slide-in-from-bottom-4">
                        <span className="text-emerald-500 font-black text-4xl tabular-nums">+{pointsThisRound}</span>
                        {pointsThisRound > 850 && <span className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5"><Zap size={14} strokeWidth={3}/> Lightning Speed</span>}
                    </div>
                ) : (
                    <p className="text-zinc-600 font-black text-xl uppercase tracking-[0.2em] mt-4 tabular-nums">0 XP</p>
                )}
            </div>
        );
    }

    return (
        <div className="h-full bg-black p-4 md:p-6 flex flex-col border-4 border-zinc-800">
            <div className="bg-zinc-900 p-6 border-4 border-zinc-800 mb-4 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white bg-black px-3 py-1.5 inline-block mb-4 border-2 border-zinc-800 tabular-nums">
                    Target {String(liveSession.currentBlockIndex + 1).padStart(2, '0')}
                </span>
                <h2 className="text-xl md:text-3xl font-black text-white leading-tight uppercase tracking-tight">{quizQuestion}</h2>
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-4 pb-2">
                {quizOptions.map((opt: any, idx: number) => {
                    const Theme = SHAPE_THEMES[idx % 4];
                    const isSelected = myAnswer === opt.id;
                    
                    return (
                        <button
                            key={opt.id} disabled={!!myAnswer} onClick={() => submitAnswer(opt.id)} style={{ WebkitTapHighlightColor: 'transparent' }}
                            className={`relative flex flex-col items-center justify-center p-4 focus:outline-none transition-colors border-4 min-h-[140px] ${myAnswer && !isSelected ? 'opacity-20 border-zinc-800 bg-black' : isSelected ? `border-white ${Theme.active}` : `border-zinc-800 hover:border-white ${Theme.bg}`}`}
                        >
                            <Theme.icon size={48} strokeWidth={3} className={isSelected ? 'text-black mb-4' : 'text-white mb-4'} />
                            <span className={`font-black text-sm md:text-lg leading-tight px-2 break-words text-center tracking-tight uppercase ${isSelected ? 'text-black' : 'text-white'}`}>{opt.text}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
//  CONNECT FOUR: STUDENT REMOTE (Flat)
// ============================================================================
const ConnectFourRemote = ({ liveSession, classId, studentEmail, onLogActivity, userData }: any) => {
    const [showForge, setShowForge] = useState(false);
    const safeEmail = (studentEmail || 'scholar@magister').replace(/\./g, ',');
    const myTeam = liveSession?.teams?.[safeEmail]; 
    const isMyTurn = liveSession?.currentTurn === myTeam;
    const isFinished = liveSession?.quizState === 'finished';

    const currentQ = liveSession?.currentQuestion;
    const myAnswer = liveSession?.answers?.[safeEmail];
    const iHaveUnlockedDrop = myAnswer === currentQ?.correctId;
    const [xpLogged, setXpLogged] = useState(false);

    useEffect(() => {
        if (!classId || !studentEmail || !liveSession) return;
        if (!liveSession.joined?.[safeEmail]) {
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, { 
                [`joined.${safeEmail}`]: {
                    name: userData?.name || studentEmail,
                    equipped: userData?.equipped || {},
                    avatarUrl: userData?.profile?.main?.avatarUrl || userData?.avatarUrl || ''
                }
            }).catch(e => console.log("Could not ping lobby arrival:", e));
        }
    }, [classId, studentEmail, liveSession?.joined, safeEmail, userData]);

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
                player: safeEmail,
                timestamp: Date.now() 
            } 
        });
    };

    if (liveSession?.quizState === 'waiting') {
        // Render same as Trivia waiting room but with solid Flat UI
        return <LiveTriviaRemote liveSession={liveSession} studentEmail={studentEmail} classId={classId} onLogActivity={onLogActivity} userData={userData} />;
    }

    if (isFinished) {
        const iWon = liveSession.winningTeam === myTeam;
        return (
            <div className={`h-full flex flex-col items-center justify-center p-8 text-center border-[12px] ${iWon ? 'bg-black border-emerald-500' : 'bg-black border-rose-600'}`}>
                {iWon ? <Trophy size={120} className="text-emerald-500 mb-6" strokeWidth={3}/> : <XCircle size={120} className="text-rose-600 mb-6" strokeWidth={3}/>}
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">{iWon ? 'Victory' : 'Defeated'}</h2>
                <p className="text-zinc-400 font-black uppercase tracking-[0.2em]">{iWon ? 'Squad Superiority Established' : 'Tactical Withdrawal Required'}</p>
                {iWon && (
                    <div className="mt-8 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        {xpLogged ? <><CheckCircle2 size={16} strokeWidth={3}/> 100 XP Synced</> : <><Loader2 size={16} className="animate-spin" strokeWidth={3}/> Syncing XP...</>}
                    </div>
                )}
            </div>
        );
    }

    if (!isMyTurn) {
        return (
            <div className="h-full bg-black flex flex-col items-center justify-center p-8 text-center border-4 border-zinc-800">
                <Shield size={120} strokeWidth={2} className="text-zinc-800 mb-8" />
                <h2 className="text-2xl md:text-3xl font-black text-zinc-500 mb-2 tracking-tight uppercase">Enemy Squad Engaging</h2>
                <p className="text-rose-600 font-black text-xs uppercase tracking-[0.2em]">Hold your position</p>
            </div>
        );
    }

    if (iHaveUnlockedDrop) {
        return (
            <div className="h-full bg-black p-4 flex flex-col border-4 border-zinc-800">
                <div className={`p-6 mb-6 text-center border-4 ${myTeam === 1 ? 'bg-rose-600 border-rose-600' : 'bg-indigo-600 border-indigo-600'}`}>
                    <Zap size={32} strokeWidth={3} className="mx-auto mb-2 text-white" />
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Access Granted</h2>
                    <p className="text-black font-black text-[10px] uppercase tracking-[0.2em] mt-2">Select Deployment Zone</p>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-3 pb-4">
                    {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                        <button key={col} onClick={() => handleDrop(col)} className={`flex flex-col items-center justify-center font-black text-2xl border-4 transition-colors ${myTeam === 1 ? 'bg-black border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-black border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}>
                            <ArrowDownCircle size={28} strokeWidth={3} className="mb-2" /> {col + 1}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-black p-4 md:p-6 flex flex-col border-4 border-zinc-800">
            <div className={`p-6 border-4 mb-4 text-center ${myTeam === 1 ? 'bg-black border-rose-600' : 'bg-black border-indigo-600'}`}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block">Squad Intelligence Task</span>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tight">"{currentQ?.question}"</h2>
            </div>
            <div className="flex-1 flex flex-col gap-3">
                {currentQ?.options.map((opt: any) => (
                    <button key={opt.id} onClick={() => submitAnswer(opt.id)} className={`flex-1 p-4 font-black text-sm uppercase tracking-[0.1em] transition-colors border-4 ${myAnswer === opt.id ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-white hover:text-white'}`}>
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
    classData, lessons = [], curriculums = [], allDecks = {}, onBack, 
    onSelectLesson, userData, setActiveTab, setSelectedLessonId, ExamPlayerView, onLogActivity 
}: any) {
  const [activeSubTab, setActiveSubTab] = useState<'lessons' | 'leaderboard' | 'exams' | 'forum' | 'grades' | 'live'>('lessons');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [liveSession, setLiveSession] = useState<any>(null);
  
  const [activeDeck, setActiveDeck] = useState<any>(null);
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Record<string, boolean>>({ 
      [classData?.assignedCurriculums?.[0]]: true 
  });
  
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
    const unsubSession = onSnapshot(sessionRef, async (docSnap) => {
        if (docSnap.exists()) {
            setLiveSession(docSnap.data());
        } else {
            setLiveSession(null);
            setActiveDeck(null);
        }
    });
    return () => unsubSession();
  }, [classData?.id]);

  useEffect(() => {
      if (liveSession?.type === 'slipstream' && liveSession?.lessonId) {
          const deckQuery = query(collection(db, 'artifacts', appId, 'decks'), where('id', '==', liveSession.lessonId));
          const unsubDeck = onSnapshot(deckQuery, (snap) => {
              if (!snap.empty) {
                  setActiveDeck(snap.docs[0].data());
              }
          });
          return () => unsubDeck();
      }
  }, [liveSession?.type, liveSession?.lessonId]);

  useEffect(() => {
      if (!liveSession && activeSubTab === 'live') {
          setActiveSubTab('lessons');
      }
  }, [liveSession, activeSubTab]);

  const toggleRoadmap = (currId: string) => setExpandedRoadmaps(prev => ({ ...prev, [currId]: !prev[currId] }));

  const rawAssignments = Array.isArray(classData?.assignments) ? classData.assignments : [];
  const rawCurriculums = Array.isArray(classData?.assignedCurriculums) ? classData.assignedCurriculums : [];

  const populatedAssignments = rawAssignments.map((assignment: any) => {
      if (typeof assignment !== 'string') return assignment;
      let node = lessons.find((l: any) => l.id === assignment);
      if (node) return node;
      
      let deck = allDecks?.[assignment] || Object.values(allDecks || {}).find((d: any) => d.id === assignment);
      if (deck) {
          return {
              id: deck.id,
              title: deck.title || deck.name,
              contentType: 'deck',
              type: 'deck', 
              blocks: [{ type: 'deck', title: deck.title || deck.name, items: deck.cards || [] }]
          };
      }
      return null;
  }).filter(Boolean);

  const assignedCurriculums = rawCurriculums.map((id: string) => curriculums.find((c: any) => c.id === id)).filter(Boolean);
  const standaloneLessons = populatedAssignments.filter((a: any) => !(a.contentType === 'exam' || a.contentType === 'test') && !assignedCurriculums.some((c: any) => c.lessonIds?.includes(a.id)));
  const examList = populatedAssignments.filter((a: any) => a.contentType === 'exam' || a.contentType === 'test');

  const allClassNodeIds = Array.from(new Set([
      ...populatedAssignments.map((a:any) => a.id),
      ...assignedCurriculums.flatMap((c:any) => c.lessonIds || [])
  ]));

  const totalNodesCount = allClassNodeIds.length;
  const completedClassNodes = allClassNodeIds.filter(id => completedItems.includes(id)).length;
  const overallProgress = totalNodesCount > 0 ? Math.round((completedClassNodes / totalNodesCount) * 100) : 0;

  const isImmersiveLiveMode = activeSubTab === 'live' && liveSession;

  if (isImmersiveLiveMode) {
      const handleStudentGameUpdate = async (updates: any) => {
          if (!classData?.id) return;
          try {
              const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classData.id);
              await setDoc(sessionRef, updates, { merge: true });
          } catch (err) { console.error("Failed to sync student move:", err); }
      };

      return (
          <div className="fixed inset-0 z-[9999] bg-black flex flex-col font-sans">
              <button onClick={() => setActiveSubTab('lessons')} className="absolute top-4 left-4 z-50 p-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] hover:bg-zinc-200 transition-colors flex items-center gap-2 border-2 border-transparent">
                  <X size={16} strokeWidth={3}/> Exit Arena
              </button>
              
              <div className="flex-1 w-full h-full p-4 md:p-8 pt-20">
                  {liveSession?.currentQuestion?.gameType === 'marble-scrabble' ? (
                      <MarbleScrabble 
                          block={liveSession.currentQuestion} 
                          isProjector={false} 
                          liveState={liveSession} 
                          studentId={safeEmail} 
                          onUpdateLiveState={handleStudentGameUpdate}
                      />
                  ) : liveSession.type === 'slipstream' ? (
                      <StudentSlipstreamView 
                          user={userData || auth?.currentUser}
                          classId={classData.id}
                          deck={activeDeck || { cards: [] }} 
                          liveState={liveSession}
                          onExit={() => setActiveSubTab('lessons')}
                      />
                  ) : liveSession.type === 'connect_four' ? (
                    <ConnectFourRemote 
                        liveSession={liveSession} 
                        classId={classData.id} 
                        studentEmail={userData?.email || auth?.currentUser?.email} 
                        onLogActivity={onLogActivity}
                        userData={userData} 
                    />
                  ) : (
                    <LiveTriviaRemote 
                        liveSession={liveSession} 
                        lessons={lessons} 
                        allDecks={allDecks} 
                        classId={classData.id} 
                        studentEmail={userData?.email || auth?.currentUser?.email} 
                        onLogActivity={onLogActivity}
                        userData={userData} 
                    />                  
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-white overflow-hidden animate-in fade-in duration-300 font-sans relative">
      
      {/* FLAT ARCHITECTURAL HEADER */}
      <header className={`shrink-0 z-10 border-b-4 border-zinc-900 dark:border-zinc-200 transition-colors duration-300 ${theme.bg}`}>
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 border-b-2 border-zinc-900/20 dark:border-zinc-100/20">
            <button onClick={onBack} className={`flex items-center gap-2 ${theme.textWhite} font-black uppercase text-[10px] tracking-[0.2em] hover:opacity-70 transition-opacity`}>
                <ArrowLeft size={16} strokeWidth={3}/> Hub
            </button>
            <span className={`${theme.textWhite} font-black text-[10px] uppercase tracking-[0.2em] truncate max-w-[200px]`}>
                {classData.name}
            </span>
        </div>

        {/* Hero Area */}
        <div className="px-4 sm:px-6 md:px-10 py-8 md:py-12">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
                
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`px-3 py-1.5 bg-black ${theme.color.split(' ')[0].replace('text-', 'text-')} text-[10px] font-black uppercase tracking-[0.2em] border-2 border-black`}>
                            {classData?.grade || 'General'}
                        </span>
                        <span className="px-3 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] border-2 border-white">
                            {classData?.subject || 'Subject'}
                        </span>
                    </div>
                    
                    <h2 className={`text-4xl md:text-5xl font-black ${theme.textWhite} leading-none tracking-tighter mb-4 uppercase`}>
                        {classData.name}
                    </h2>
                    
                    <p className={`${theme.textWhite} opacity-90 font-bold text-sm md:text-base leading-relaxed max-w-2xl`}>
                        {classData.description || "Course initialization complete. Awaiting student interaction."}
                    </p>
                </div>

                {/* Telemetry Block */}
                <div className="bg-black border-2 border-zinc-900 p-5 flex gap-6 shrink-0 text-white">
                    <div className="flex flex-col">
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Nodes</span>
                        <span className="font-black text-2xl leading-none tabular-nums">{String(totalNodesCount).padStart(2, '0')}</span>
                    </div>
                    <div className="w-0.5 bg-zinc-800" />
                    <div className="flex flex-col">
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Progress</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-emerald-400 font-black text-2xl leading-none tabular-nums">{overallProgress}</span>
                            <span className="text-emerald-600 font-black text-xs">%</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative px-4 sm:px-6 md:px-10 pb-32 z-0 pt-6 md:pt-10">

        {liveSession && activeSubTab !== 'live' && (
            <div className="max-w-4xl mx-auto mb-8">
                <button onClick={() => setActiveSubTab('live')} className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors border-4 border-zinc-900 dark:border-zinc-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white text-indigo-600 flex items-center justify-center border-4 border-zinc-900 dark:border-zinc-200 shrink-0">
                            <Zap size={28} strokeWidth={3} />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-xl md:text-2xl tracking-tight uppercase leading-none mb-2">Live Protocol Active</h4>
                            <p className="text-indigo-200 font-black text-[10px] uppercase tracking-[0.2em]">Join the classroom engage now</p>
                        </div>
                    </div>
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center shrink-0 border-2 border-black">
                        <ChevronRight size={24} strokeWidth={3} />
                    </div>
                </button>
            </div>
        )}

        {activeSubTab === 'lessons' && (
          <div>
             {assignedCurriculums.length > 0 ? (
                 <section className="space-y-8 mb-10 max-w-4xl mx-auto">
                     {assignedCurriculums.map((curr: any) => (
                         <CurriculumPathway key={curr.id} curr={curr} lessons={lessons} allDecks={allDecks} completedItems={completedItems} isExpanded={!!expandedRoadmaps[curr.id]} onToggle={() => toggleRoadmap(curr.id)} onSelectLesson={onSelectLesson} theme={theme} />
                     ))}
                 </section>
             ) : (
                <div className="text-center p-12 bg-white dark:bg-black border-4 border-dashed border-zinc-300 dark:border-zinc-800 max-w-2xl mx-auto my-8">
                    <Map size={48} className="mx-auto text-zinc-400 mb-4" strokeWidth={2}/>
                    <h3 className="text-2xl font-black text-zinc-950 dark:text-white uppercase tracking-tight mb-2">Map Loading</h3>
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em]">Instructor has not deployed the roadmap.</p>
                </div>
             )}
             
             {standaloneLessons.length > 0 && (
                 <section className="space-y-4 mb-10 max-w-4xl mx-auto">
                     <div className="flex items-center gap-4 mb-6">
                         <h3 className="text-[10px] font-black text-zinc-950 dark:text-white uppercase tracking-[0.2em] whitespace-nowrap bg-zinc-200 dark:bg-zinc-800 px-3 py-1">Bonus Quests</h3>
                         <div className="h-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800" />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {standaloneLessons.map((item: any) => (<StandaloneAssignmentCard key={item.id} item={item} isCompleted={completedItems.includes(item.id)} onSelectLesson={onSelectLesson} theme={theme} />))}
                     </div>
                 </section>
             )}
          </div>
        )}

        {activeSubTab === 'leaderboard' && <LeaderboardView studentEmails={classData.studentEmails} currentUserEmail={userData.email} />}
        {activeSubTab === 'exams' && (
          <section className="space-y-4 max-w-4xl mx-auto">
            {examList.length === 0 ? <div className="text-center py-20 opacity-50"><FileText size={48} strokeWidth={2} className="mx-auto mb-4 text-zinc-500" /><p className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-500">No active exams assigned.</p></div> : examList.map((item: any) => <ExamCard key={item.id} item={item} onSelectLesson={onSelectLesson} />)}
          </section>
        )}
        {activeSubTab === 'forum' && <div className="h-[75vh] max-w-5xl mx-auto"><ClassForum classId={classData.id} userData={userData} /></div>}
        {activeSubTab === 'grades' && <StudentGradebook classData={classData} user={userData} />}
      </main>

      {/* DOCKED FLAT BOTTOM NAV */}
      <nav className="border-t-2 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-black z-50 shrink-0">
          <div className="max-w-4xl mx-auto flex divide-x-2 divide-zinc-900 dark:divide-zinc-200 min-h-[64px]">
            {[
              { id: 'lessons', label: 'Roadmap', icon: <BookOpen size={18} strokeWidth={2.5}/> },
              { id: 'leaderboard', label: 'Ranks', icon: <Trophy size={18} strokeWidth={2.5}/> },
              { id: 'exams', label: 'Exams', icon: <FileText size={18} strokeWidth={2.5}/> },
              { id: 'forum', label: 'Forum', icon: <MessageSquare size={18} strokeWidth={2.5}/> },
              { id: 'grades', label: 'Grades', icon: <CheckCircle2 size={18} strokeWidth={2.5}/> }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'}`}>
                  <div className="mb-1">{tab.icon}</div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.15em] hidden sm:block ${isActive ? 'text-indigo-200' : ''}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
      </nav>
    </div>
  );
}

// 🔥 UPDATED CURRICULUM PATHWAY (Flat Architectural)
const CurriculumPathway = ({ curr, lessons, allDecks = {}, completedItems, isExpanded, onToggle, onSelectLesson, theme }: any) => {
    const currLessons = (curr.lessonIds || []).map((id: string) => {
        let node = lessons.find((l: any) => l.id === id);
        if (node) return node;
        
        let deck = allDecks?.[id] || Object.values(allDecks || {}).find((d: any) => d.id === id);
        if (deck) {
            return {
                id: deck.id,
                title: deck.title || deck.name,
                contentType: 'deck',
                type: 'deck',
                blocks: [{ type: 'deck', title: deck.title || deck.name, items: deck.cards || [] }]
            };
        }
        return null;
    }).filter(Boolean);

    const completedCountInCurr = currLessons.filter((l: any) => completedItems.includes(l.id)).length;
    const progressPercent = currLessons.length > 0 ? Math.round((completedCountInCurr / currLessons.length) * 100) : 0;
    const activeNodeIndex = currLessons.findIndex((l: any) => !completedItems.includes(l.id));
    const normalizedActiveIndex = activeNodeIndex === -1 ? currLessons.length - 1 : activeNodeIndex;
    
    // Convert hex to a known strict tailwind class if possible, or use inline strictly.
    const headerAccent = curr.themeColor || '#4f46e5';

    return (
        <article className="bg-transparent relative pb-8">
            <button className="w-full text-left bg-white dark:bg-black border-4 border-zinc-900 dark:border-zinc-200 flex flex-col transition-colors duration-300" onClick={onToggle}>
                
                <div className="flex items-center justify-between p-6 md:p-8 w-full">
                    <div>
                        <span className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase mb-3 inline-block tracking-[0.2em]">{curr.grade || 'Pathway'}</span>
                        <h3 className="text-2xl md:text-3xl font-black text-zinc-950 dark:text-white leading-tight tracking-tighter uppercase">{curr.title}</h3>
                    </div>
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-white border-2 border-zinc-900 dark:border-zinc-200 shrink-0">
                        <ChevronUp size={24} strokeWidth={3} className={isExpanded ? '' : 'rotate-180 transition-transform'} />
                    </div>
                </div>
                
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 border-t-4 border-zinc-900 dark:border-zinc-200 px-6 py-4 flex items-center gap-4">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] shrink-0">Progress</span>
                    <div className="h-4 w-full bg-zinc-300 dark:bg-zinc-800 flex-1 border-2 border-zinc-900 dark:border-zinc-200 overflow-hidden">
                        <div className="h-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: headerAccent }} />
                    </div>
                    <span className="text-sm font-black text-zinc-950 dark:text-white tabular-nums shrink-0">{progressPercent}%</span>
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 mt-6' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="py-8 px-2 sm:px-4 relative">
                    <div className="relative max-w-lg mx-auto w-full">
                        {/* Stark central track */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 bg-zinc-200 dark:bg-zinc-800 z-0" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 transition-all duration-700 z-0" style={{ height: `${currLessons.length > 1 ? (normalizedActiveIndex / (currLessons.length - 1)) * 100 : 100}%`, backgroundColor: headerAccent }} />
                        
                        <div className="relative z-10 flex flex-col gap-10 sm:gap-14 py-8">
                            {currLessons.map((item: any, index: number) => {
                                const isCompleted = completedItems.includes(item.id);
                                const isCurrent = index === normalizedActiveIndex;
                                const isLocked = index > normalizedActiveIndex;
                                const isLeft = index % 2 === 0;

                                return (
                                    <div key={item.id} className={`relative flex w-full items-center min-h-[100px] ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                                        
                                        {/* Left Side Content */}
                                        <div className={`w-1/2 flex justify-end pr-8 sm:pr-12 z-10 ${!isLeft ? 'invisible' : ''}`}>
                                            <div className={`bg-white dark:bg-black p-5 border-4 border-zinc-900 dark:border-zinc-200 w-full max-w-[200px] text-right transition-colors ${isCurrent ? 'border-indigo-600 dark:border-indigo-500' : ''} ${isLocked ? 'pointer-events-none' : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900'}`} onClick={() => !isLocked && onSelectLesson(item)}>
                                                <span className={`text-[10px] font-black uppercase mb-2 block tracking-[0.2em] ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                    {item.contentType === 'exam' || item.contentType === 'test' ? 'Checkpoint' : `Mod ${String(index + 1).padStart(2, '0')}`}
                                                </span>
                                                <h4 className="font-black text-sm sm:text-base text-zinc-950 dark:text-white leading-tight uppercase tracking-tight">{item.title}</h4>
                                            </div>
                                        </div>
                                        
                                        {/* Central Node */}
                                        <div className={`absolute left-1/2 top-1/2 -translate-y-1/2 z-20 ${isLeft ? '-translate-x-[25%]' : '-translate-x-[75%]'}`}>
                                            <button disabled={isLocked} onClick={() => onSelectLesson(item)} className={`relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border-4 transition-colors ${isCompleted ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white text-white dark:text-black' : isCurrent ? `bg-white dark:bg-black text-zinc-950 dark:text-white` : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400 cursor-not-allowed'}`} style={{ ...(isCurrent ? { borderColor: headerAccent } : {}) }}>
                                                {isCompleted ? (
                                                    <CheckCircle2 size={28} strokeWidth={4} />
                                                ) : isLocked ? (
                                                    <Lock size={24} strokeWidth={3} />
                                                ) : item.type === 'deck' ? (
                                                    <Layers size={28} strokeWidth={3} />
                                                ) : item.type === 'quiz' || item.contentType === 'exam' || item.contentType === 'test' ? (
                                                    <HelpCircle size={28} strokeWidth={3} />
                                                ) : (
                                                    <Play size={28} strokeWidth={3} className="ml-1" fill={isCurrent ? "currentColor" : "none"} />
                                                )}
                                                
                                                {/* Hard flat indicator ring for active node */}
                                                {isCurrent && (
                                                    <div className="absolute inset-0 -m-2 border-2" style={{ borderColor: headerAccent }} />
                                                )}
                                            </button>
                                        </div>
                                        
                                        {/* Right Side Content */}
                                        <div className={`w-1/2 flex justify-start pl-8 sm:pl-12 z-10 ${isLeft ? 'invisible' : ''}`}>
                                            <div className={`bg-white dark:bg-black p-5 border-4 border-zinc-900 dark:border-zinc-200 w-full max-w-[200px] text-left transition-colors ${isCurrent ? 'border-indigo-600 dark:border-indigo-500' : ''} ${isLocked ? 'pointer-events-none' : 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900'}`} onClick={() => !isLocked && onSelectLesson(item)}>
                                                <span className={`text-[10px] font-black uppercase mb-2 block tracking-[0.2em] ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                    {item.contentType === 'exam' || item.contentType === 'test' ? 'Checkpoint' : `Mod ${String(index + 1).padStart(2, '0')}`}
                                                </span>
                                                <h4 className="font-black text-sm sm:text-base text-zinc-950 dark:text-white leading-tight uppercase tracking-tight">{item.title}</h4>
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
    <button className={`w-full text-left p-6 bg-white dark:bg-black border-4 flex items-center gap-6 transition-colors group ${isCompleted ? 'border-zinc-300 dark:border-zinc-800 opacity-60 grayscale' : 'border-zinc-900 dark:border-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`} onClick={() => onSelectLesson(item)}>
        <div className={`w-16 h-16 flex items-center justify-center border-4 border-zinc-900 dark:border-zinc-200 shrink-0 ${isCompleted ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500' : `${theme.bg} ${theme.textWhite}`}`}>
            {isCompleted ? <CheckCircle2 size={28} strokeWidth={3} /> : item.type === 'arcade_game' ? <Gamepad2 size={28} strokeWidth={2.5}/> : item.type === 'deck' ? <Layers size={28} strokeWidth={2.5}/> : <Play size={28} strokeWidth={2.5} className="ml-1" fill="currentColor" />}
        </div>
        <div className="flex-1 pr-2">
            <span className={`text-[10px] font-black uppercase mb-1.5 block tracking-[0.2em] ${isCompleted ? 'text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                {isCompleted ? 'Completed' : 'Special Assignment'}
            </span>
            <h4 className="font-black text-zinc-900 dark:text-white text-xl leading-tight uppercase tracking-tight">{item.title}</h4>
        </div>
    </button>
);

const ExamCard = ({ item, onSelectLesson }: any) => (
    <button className="w-full text-left p-6 md:p-8 border-4 border-rose-600 bg-white dark:bg-black flex items-center gap-6 transition-colors group hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => onSelectLesson(item)}>
      <div className="w-16 h-16 flex items-center justify-center bg-rose-600 text-white shrink-0 border-4 border-zinc-900 dark:border-zinc-100"><Trophy size={32} strokeWidth={2.5} /></div>
      <div>
          <span className="text-[10px] font-black uppercase text-white bg-rose-600 tracking-[0.2em] px-3 py-1.5 mb-3 inline-block">High-Stakes Assessment</span>
          <h4 className="font-black text-zinc-900 dark:text-white text-2xl md:text-3xl leading-tight uppercase tracking-tight">{item.title}</h4>
      </div>
    </button>
);
