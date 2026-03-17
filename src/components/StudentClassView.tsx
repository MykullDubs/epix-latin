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
    Triangle, Circle, XCircle, X
} from 'lucide-react';

import StudentGradebook from './StudentGradebook';
import LeaderboardView from './LeaderboardView';

// --- THEME HELPER ---
const getSubjectTheme = (subject: string) => {
    const sub = subject?.toLowerCase() || '';
    if (sub.includes('math')) return { color: 'text-rose-500', bg: 'bg-rose-500', light: 'bg-rose-100', border: 'border-rose-200' };
    if (sub.includes('science') || sub.includes('bio')) return { color: 'text-emerald-500', bg: 'bg-emerald-500', light: 'bg-emerald-100', border: 'border-emerald-200' };
    if (sub.includes('social') || sub.includes('history')) return { color: 'text-amber-500', bg: 'bg-amber-500', light: 'bg-amber-100', border: 'border-amber-200' };
    if (sub.includes('read') || sub.includes('english')) return { color: 'text-cyan-500', bg: 'bg-cyan-500', light: 'bg-cyan-100', border: 'border-cyan-200' };
    return { color: 'text-indigo-500', bg: 'bg-indigo-500', light: 'bg-indigo-100', border: 'border-indigo-200' };
};

// ============================================================================
//  SUB-COMPONENT: FORUM AVATAR
// ============================================================================
const ForumAvatar = ({ url, name, role, size = "md" }: any) => {
    const initials = name?.split(' ').map((n:any) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';
    const sizeClasses: any = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[35%] overflow-hidden flex items-center justify-center font-black transition-all shadow-sm ${url ? 'bg-white' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'}`}>
                {url ? <img src={url} alt={`${name}'s avatar`} className="w-full h-full object-cover" /> : <span aria-hidden="true">{initials}</span>}
            </div>
            {role === 'instructor' && (
                <div className="absolute -top-1 -right-1 bg-indigo-600 rounded-full border-2 border-white p-0.5 shadow-sm" aria-label="Instructor Badge">
                    <Shield size={size === 'xs' ? 8 : 10} className="text-white" aria-hidden="true" />
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
    <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100 flex items-center justify-between">
      {!audioUrl ? (
        <div className="flex items-center gap-4 w-full">
          <div className={`w-3 h-3 rounded-full bg-rose-500 ${isRecording ? 'animate-pulse' : 'opacity-30'}`} aria-hidden="true" />
          <span className="text-xs font-black text-indigo-900 uppercase tracking-widest flex-1">{isRecording ? "Recording..." : "Voice Response"}</span>
          <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-500 ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors'}`}>
            {isRecording ? <Square size={18} fill="white" aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full animate-in fade-in">
          <audio src={audioUrl} controls className="h-8 flex-1" aria-label="Audio playback preview" />
          <button type="button" onClick={() => { setAudioUrl(null); onCancel(); }} className="text-rose-500 text-xs font-black uppercase px-2 hover:bg-rose-50 rounded-lg py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500">Discard</button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
//  INTERNAL FORUM COMPONENT
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

  if (view === 'list') {
    return (
      <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-inner p-6 overflow-hidden animate-in fade-in duration-500 font-sans">
        <header className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Discussions</h3>
            {isInstructor && (
                <button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500">
                  <Plus size={16} aria-hidden="true"/> New Topic
                </button>
            )}
        </header>
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {isCreating && (
                <form onSubmit={handleCreateTopic} className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 shadow-xl mb-6">
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Topic Title..." className="w-full text-lg font-black text-slate-800 outline-none mb-2 focus:ring-2 focus:ring-indigo-100 rounded-md px-1" />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Prompt..." className="w-full text-sm text-slate-500 outline-none min-h-[100px] resize-none focus:ring-2 focus:ring-indigo-100 rounded-md px-1 py-1" />
                    <div className="flex gap-2 justify-end mt-4"><button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase focus:outline-none focus:ring-4 focus:ring-indigo-500 transition-colors">Post</button></div>
                </form>
            )}
            {topics.map(t => (
                <button key={t.id} onClick={() => { setActiveTopic(t); setView('thread'); }} className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-indigo-300 transition-all text-left focus:outline-none focus:ring-4 focus:ring-indigo-500">
                    <h4 className="text-lg font-black text-slate-800 mb-1">{t.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-1 mb-4 font-medium">{t.content}</p>
                    <div className="flex items-center gap-3 text-xs font-black uppercase text-slate-400 tracking-widest"><ForumAvatar url={t.authorAvatarUrl} name={t.authorName} role={t.role} size="xs" /><span>{t.authorName}</span></div>
                </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-inner overflow-hidden animate-in slide-in-from-right-8 duration-500 font-sans">
        <header className="bg-white p-6 border-b border-slate-100 flex items-center justify-between shadow-sm z-20">
            <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md px-2 py-1"><ArrowLeft size={16} aria-hidden="true"/> Back</button>
            <span className="text-xs font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg">Response Gallery</span>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <section className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10" aria-hidden="true"><Zap size={80} /></div>
                <div className="relative z-10">
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 block">Discussion Prompt</span>
                    <h2 className="text-3xl font-black mb-4 leading-tight">{activeTopic.title}</h2>
                    <p className="text-slate-300 font-medium leading-relaxed mb-6">{activeTopic.content}</p>
                    <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-black text-xs uppercase shadow-xl transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500">Respond</button>
                </div>
            </section>

            {isCreating && (
                <form onSubmit={handlePostResponse} className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl space-y-4">
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Response title..." className="w-full text-xl font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 rounded-md px-2" />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write thoughts..." className="w-full text-sm text-slate-500 outline-none min-h-[100px] resize-none focus:ring-2 focus:ring-indigo-100 rounded-md px-2 py-2" />
                    <VoiceRecorder onRecordingComplete={setPendingAudio} onCancel={() => setPendingAudio(null)} />
                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-50">
                        <button type="submit" disabled={isUploading} className="px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-500">
                            {isUploading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : 'Submit Response'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-10">
                {responses.map((res) => (
                    <article key={res.id} className="space-y-4">
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative group">
                            <div className="flex items-center gap-4 mb-6">
                                <ForumAvatar url={res.authorAvatarUrl} name={res.authorName} role={res.role} size="lg" />
                                <div><span className="block text-sm font-black text-slate-800 leading-none mb-1">{res.authorName}</span><span className="text-xs font-bold text-slate-400 uppercase">{new Date(res.timestamp).toLocaleDateString()}</span></div>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{res.title}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">{res.content}</p>
                            
                            {res.audioUrl && (
                                <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl flex items-center gap-4 border border-indigo-100">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white" aria-hidden="true"><Volume2 size={20} /></div>
                                    <audio src={res.audioUrl} controls className="h-8 flex-1 opacity-90" />
                                </div>
                            )}

                            <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                                <button onClick={() => handleToggleLike(res.id, res.likes || [], res.authorId)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-rose-200 ${res.likes?.includes(auth.currentUser?.uid) ? 'bg-rose-50 text-rose-500' : 'text-slate-400 hover:bg-slate-50 hover:text-rose-400'}`}>
                                    <Heart size={16} className={res.likes?.includes(auth.currentUser?.uid) ? 'fill-rose-500' : ''} aria-hidden="true" /> <span className="text-xs font-black uppercase tracking-widest">{res.likes?.length || 0} Appreciations</span>
                                </button>
                                <button onClick={() => setReplyingToId(replyingToId === res.id ? null : res.id)} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-lg px-2 py-1">
                                  <MessageSquare size={16} aria-hidden="true" /> Reply
                                </button>
                            </div>
                        </div>

                        <div className="ml-10 space-y-4">
                            {res.comments?.map((comment: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                    <div className="flex items-center gap-3 mb-2"><ForumAvatar url={comment.authorAvatarUrl} name={comment.authorName} role={comment.role} size="xs" /><span className="text-xs font-black text-slate-700 uppercase tracking-widest">{comment.authorName}</span></div>
                                    <p className="text-sm text-slate-600 font-bold leading-relaxed">{comment.text}</p>
                                </div>
                            ))}
                            {replyingToId === res.id && (
                                <div className="flex gap-2 animate-in slide-in-from-top-2">
                                    <input autoFocus value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Reply..." className="flex-1 bg-white border-2 border-indigo-100 rounded-2xl px-5 py-3 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" onKeyDown={(e) => e.key === 'Enter' && handlePostComment(res.id)} />
                                    <button onClick={() => handlePostComment(res.id)} className="p-4 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500"><Send size={18} aria-hidden="true" /></button>
                                </div>
                            )}
                        </div>
                    </article>
                ))}
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

const LiveTriviaRemote = ({ liveSession, lessons, studentEmail, classId }: any) => {
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

    // 🔥 NEW: Calculate final scores and XP on the student's end
    const finalCorrectCount = liveSession?.finalScores?.[safeEmail] || 0;
    const xpEarned = finalCorrectCount * 10; // 10 XP per correct target
    const [xpLogged, setXpLogged] = useState(false);

    useEffect(() => {
        if (!classId || !studentEmail || !liveSession) return;
        if (liveSession.quizState === 'waiting' && !liveSession.joined?.[safeEmail]) {
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            updateDoc(sessionRef, { [`joined.${safeEmail}`]: true }).catch(e => console.log("Could not ping lobby arrival:", e));
        }
    }, [classId, studentEmail, liveSession?.quizState, liveSession?.joined, safeEmail]);

    // 🔥 NEW: Silently log the XP to the student's profile when the game finishes
    useEffect(() => {
        if (isFinished && !xpLogged && xpEarned > 0) {
            const logActivity = async () => {
                try {
                    await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
                        studentEmail: studentEmail,
                        studentId: auth.currentUser?.uid || 'anonymous',
                        type: 'completion',
                        itemId: `arena_run_${Date.now()}`,
                        itemTitle: 'Live Arena Protocol',
                        score: xpEarned,
                        timestamp: Date.now()
                    });
                    setXpLogged(true);
                } catch (e) {
                    console.error("Failed to sync XP:", e);
                }
            };
            logActivity();
        }
    }, [isFinished, xpLogged, xpEarned, studentEmail]);

    const submitAnswer = async (optionId: string) => {
        if (liveSession?.quizState !== 'active' || myAnswer) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, { [`answers.${safeEmail}`]: optionId });
    };

    // STATE 1: Waiting
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

    // STATE 4: THE POST-GAME REPORT (Must come before the reveal check)
    if (isFinished) {
        return (
            <div className="h-full bg-slate-950 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500 border-[4px] border-slate-800 shadow-[inset_0_0_100px_rgba(79,70,229,0.15)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
                    <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.3)] animate-bounce-slow" strokeWidth={1.5} />
                    <h2 className="text-3xl font-black text-white mb-2 tracking-widest uppercase">Protocol Complete</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10">Simulation Terminated</p>
                    
                    <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-slate-800 rounded-3xl p-6 w-full mb-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Valid Targets Hit</span>
                            <span className="text-3xl font-black text-emerald-400">{finalCorrectCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">XP Awarded</span>
                            <span className="text-3xl font-black text-indigo-400">+{xpEarned}</span>
                        </div>
                    </div>
                    
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        {xpLogged || xpEarned === 0 ? (
                            <><CheckCircle2 size={12} className="text-emerald-500" /> XP Synced to Profile</>
                        ) : (
                            <><Loader2 size={12} className="animate-spin text-indigo-400" /> Syncing XP...</>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // STATE 2: The Reveal
    if (isRevealed) {
        const isCorrect = myAnswer === quizCorrectId;
        return (
            <div className={`h-full rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500 border-[8px] ${isCorrect ? 'bg-slate-900 border-emerald-500/50 shadow-[inset_0_0_100px_rgba(16,185,129,0.2)]' : 'bg-black border-slate-800'}`}>
                {isCorrect ? <CheckCircle2 size={120} className="text-emerald-400 mb-6 animate-bounce" strokeWidth={3} /> : <XCircle size={120} className="text-slate-700 mb-6" strokeWidth={2} />}
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter drop-shadow-md">{isCorrect ? 'VALID' : 'ELIMINATED'}</h2>
                <p className="text-white/90 font-black text-xl bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20">{isCorrect ? '+10 XP Pending' : 'Await next round'}</p>
            </div>
        );
    }

    // STATE 3: The Active Game Controller
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
const ConnectFourRemote = ({ liveSession, classId, studentEmail }: any) => {
    const safeEmail = (studentEmail || 'scholar@magister').replace(/\./g, ',');
    const myTeam = liveSession?.teams?.[safeEmail]; // 1 = Red, 2 = Blue
    const isMyTurn = liveSession?.currentTurn === myTeam;
    const isRevealed = liveSession?.quizState === 'finished';

    const currentQ = liveSession?.currentQuestion;
    const myAnswer = liveSession?.answers?.[safeEmail];
    const teamHasAnswered = Object.entries(liveSession?.answers || {}).some(
        ([email, ansId]) => liveSession.teams[email] === myTeam && ansId === currentQ?.correctId
    );

    const submitAnswer = async (optionId: string) => {
        if (!isMyTurn || myAnswer || teamHasAnswered) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await updateDoc(sessionRef, {
            [`answers.${safeEmail}`]: optionId
        });
    };

    const handleDrop = async (colIndex: number) => {
        if (!isMyTurn || !teamHasAnswered) return;
        
        // Find the next available row in this column
        const currentColumn = liveSession.board?.[colIndex] || [];
        if (currentColumn.length >= 6) return; // Column full

        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        
        // We broadcast the 'lastMove' which the Projector will hear and process
        await updateDoc(sessionRef, {
            lastMove: {
                col: colIndex,
                row: currentColumn.length,
                team: myTeam,
                timestamp: Date.now()
            }
        });
    };

    // STATE: Victory / Defeat
    if (isRevealed) {
        const iWon = liveSession.winningTeam === myTeam;
        return (
            <div className={`h-full rounded-[3rem] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500 border-[12px] ${iWon ? 'bg-slate-900 border-emerald-500' : 'bg-black border-rose-900'}`}>
                {iWon ? <Trophy size={120} className="text-emerald-400 mb-6 animate-bounce" /> : <XCircle size={120} className="text-rose-900 mb-6" />}
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter">
                    {iWon ? 'VICTORY' : 'DEFEATED'}
                </h2>
                <p className="text-white/60 font-black uppercase tracking-widest">
                    {iWon ? 'Squad Superiority Established' : 'Tactical Withdrawal Required'}
                </p>
            </div>
        );
    }

    // STATE: Enemy Turn
    if (!isMyTurn) {
        return (
            <div className="h-full bg-black rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center border-4 border-slate-900 shadow-inner">
                <div className="relative w-32 h-32 mb-8 opacity-20">
                    <Shield size={128} className="text-slate-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-slate-700 mb-2 tracking-widest uppercase text-balance">Enemy Squad Engaging...</h2>
                <p className="text-slate-800 font-bold text-xs uppercase tracking-widest">Hold your position</p>
            </div>
        );
    }

    // STATE: Active Turn - Step 2 (The Drop)
    if (teamHasAnswered) {
        return (
            <div className="h-full bg-slate-950 rounded-[2.5rem] p-4 flex flex-col border-4 border-slate-800 shadow-2xl">
                <div className={`p-6 rounded-[2rem] mb-6 text-center shadow-lg border-b-8 ${myTeam === 1 ? 'bg-rose-600 border-rose-800' : 'bg-indigo-600 border-indigo-800'}`}>
                    <Zap size={32} fill="white" className="mx-auto mb-2 text-white" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Access Granted</h2>
                    <p className="text-white/80 font-bold text-[10px] uppercase tracking-[0.2em]">Select Deployment Zone</p>
                </div>

                <div className="flex-1 grid grid-cols-4 gap-3 pb-4">
                    {[0, 1, 2, 3, 4, 5, 6].map((col) => (
                        <button
                            key={col}
                            onClick={() => handleDrop(col)}
                            className={`rounded-2xl flex flex-col items-center justify-center font-black text-2xl transition-all active:scale-90 border-b-4 ${
                                myTeam === 1 
                                ? 'bg-rose-500 border-rose-700 text-white' 
                                : 'bg-indigo-500 border-indigo-700 text-white'
                            }`}
                        >
                            <ArrowDownCircle size={24} className="mb-2" />
                            {col + 1}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // STATE: Active Turn - Step 1 (The Question)
    return (
        <div className="h-full bg-slate-950 rounded-[2.5rem] p-4 flex flex-col border-4 border-slate-800">
            <div className={`p-6 rounded-[2rem] mb-4 text-center border-b-4 ${myTeam === 1 ? 'bg-rose-900/50 border-rose-500' : 'bg-indigo-900/50 border-indigo-500'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Squad Intelligence Task</span>
                <h2 className="text-xl font-bold text-white leading-tight">"{currentQ?.question}"</h2>
            </div>
            
            <div className="flex-1 flex flex-col gap-3">
                {currentQ?.options.map((opt: any) => (
                    <button
                        key={opt.id}
                        onClick={() => submitAnswer(opt.id)}
                        className={`flex-1 rounded-2xl p-4 font-black text-sm uppercase tracking-widest transition-all border-2 ${
                            myAnswer === opt.id 
                            ? 'bg-white text-black border-white' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 active:bg-slate-800'
                        }`}
                    >
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
    onSelectLesson, userData, setActiveTab, setSelectedLessonId, ExamPlayerView 
}: any) {
  const [activeSubTab, setActiveSubTab] = useState<'lessons' | 'leaderboard' | 'exams' | 'forum' | 'grades' | 'live'>('lessons');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [liveSession, setLiveSession] = useState<any>(null);
  
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Record<string, boolean>>({ 
      [classData?.assignedCurriculums?.[0]]: true 
  });

  const theme = getSubjectTheme(classData?.subject);

  // 1. Completion Listener
  useEffect(() => {
    const studentEmail = userData?.email || auth?.currentUser?.email;
    if (!classData || !studentEmail) return;
    const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('studentEmail', '==', studentEmail), where('type', '==', 'completion'));
    return onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.flatMap(d => [d.data().itemId, d.data().originalId, d.data().itemTitle].filter(Boolean));
      setCompletedItems(ids);
    });
  }, [classData, userData]);

  // 2. Live Game Listener
  useEffect(() => {
    if (!classData?.id) return;
    const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classData.id);
    return onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
            setLiveSession(docSnap.data());
        } else {
            setLiveSession(null);
            if (activeSubTab === 'live') setActiveSubTab('lessons'); // Boot them out if teacher ends game
        }
    });
  }, [classData.id, activeSubTab]);

  const toggleRoadmap = (currId: string) => setExpandedRoadmaps(prev => ({ ...prev, [currId]: !prev[currId] }));

  // --- DATA MAPPING ---
  const rawAssignments = Array.isArray(classData?.assignments) ? classData.assignments : [];
  const rawCurriculums = Array.isArray(classData?.assignedCurriculums) ? classData.assignedCurriculums : [];

  const populatedAssignments = rawAssignments.map((assignment: any) => typeof assignment === 'string' ? lessons.find((l: any) => l.id === assignment) : assignment).filter(Boolean);
  const assignedCurriculums = rawCurriculums.map((id: string) => curriculums.find((c: any) => c.id === id)).filter(Boolean);

  const standaloneLessons = populatedAssignments.filter((a: any) => {
      const isExam = a.contentType === 'exam' || a.contentType === 'test';
      const isCurriculumLesson = assignedCurriculums.some((c: any) => c.lessonIds?.includes(a.id));
      return !isExam && !isCurriculumLesson;
  });
  
  const examList = populatedAssignments.filter((a: any) => a.contentType === 'exam' || a.contentType === 'test');

  // 🔥 THE IMMERSIVE OVERRIDE: If they are actively in the live game, hide EVERYTHING else
  const isImmersiveLiveMode = activeSubTab === 'live' && liveSession;

  if (isImmersiveLiveMode) {
      return (
          <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in slide-in-from-bottom-8 duration-500 font-sans">
              {/* Optional escape hatch in case they get stuck */}
              <button 
                  onClick={() => setActiveSubTab('lessons')}
                  className="absolute top-6 left-6 z-50 p-2 text-slate-500 hover:text-white transition-colors rounded-full bg-slate-900 border border-slate-800 active:scale-95"
              >
                  <X size={20} />
              </button>
              
              <div className="flex-1 w-full h-full p-4 md:p-8 pt-20">
                  <LiveTriviaRemote 
                      liveSession={liveSession} 
                      lessons={lessons} 
                      classId={classData.id}
                      studentEmail={userData?.email || auth?.currentUser?.email} 
                  />
              </div>
          </div>
      );
  }

  // --- STANDARD CLASSROOM VIEW ---
  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500 font-sans relative">
      
      {/* HEADER: DYNAMIC SUBJECT THEME */}
      <header className={`p-6 md:p-10 pt-10 md:pt-16 shrink-0 z-10 relative rounded-b-[3rem] shadow-xl ${theme.bg}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors text-xs font-black uppercase tracking-widest active:scale-95 w-fit focus:outline-none focus:ring-2 focus:ring-white rounded-md px-2 py-1 -ml-2">
          <ArrowLeft size={16} aria-hidden="true" /> BACK TO HUB
        </button>
        <div className="relative z-10">
            <span className="inline-block px-3 py-1.5 bg-black/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border border-white/10 shadow-inner">
                {classData?.grade || 'General'} • {classData?.subject || 'Subject'}
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-2 tracking-tighter drop-shadow-sm">{classData.name}</h2>
            <div className="flex items-center gap-2 mt-4">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" aria-hidden="true" />
                <p className="text-white/90 font-bold text-sm md:text-base line-clamp-1">{classData.description || "Your learning adventure starts here."}</p>
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative px-2 md:px-6 pb-48 pt-6">
        
        {/* LIVE GAME INTRUSION BANNER */}
        {liveSession && activeSubTab !== 'live' && (
            <div className="px-4 mb-6 animate-in slide-in-from-top-4 fade-in duration-500">
                <button 
                    onClick={() => setActiveSubTab('live')}
                    className="w-full bg-black rounded-[2rem] p-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] group transition-transform active:scale-95 focus:outline-none relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white opacity-10 animate-pulse" />
                    <div className="relative bg-slate-950 rounded-[1.8rem] p-4 flex items-center justify-between border border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-bounce-slow shadow-[0_0_20px_rgba(255,255,255,0.4)]"><Zap size={24} className="text-black" fill="currentColor" /></div>
                            <div className="text-left">
                                <h4 className="text-white font-black text-lg tracking-widest uppercase">LIVE TRIVIA ACTIVE!</h4>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Join the classroom protocol now</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-black transition-colors"><ChevronRight size={20} strokeWidth={3} /></div>
                    </div>
                </button>
            </div>
        )}

        {/* ROADMAP TAB */}
        {activeSubTab === 'lessons' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
             {assignedCurriculums.length > 0 ? (
                 <section className="space-y-8 mb-10 max-w-lg mx-auto" aria-label="Curriculum Roadmaps">
                     {assignedCurriculums.map((curr: any) => (
                         <CurriculumPathway key={curr.id} curr={curr} lessons={lessons} completedItems={completedItems} isExpanded={!!expandedRoadmaps[curr.id]} onToggle={() => toggleRoadmap(curr.id)} onSelectLesson={onSelectLesson} theme={theme} />
                     ))}
                 </section>
             ) : (
                <div className="text-center p-12 bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-slate-200 m-4">
                    <Map size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Map Loading...</h3>
                    <p className="text-slate-500 font-bold">Your instructor hasn't drawn the path yet.</p>
                </div>
             )}

             {standaloneLessons.length > 0 && (
                 <section className="space-y-4 mb-10 px-4 max-w-lg mx-auto" aria-label="Individual Assignments">
                     <div className="flex items-center gap-3 ml-2 mb-6" aria-hidden="true"><div className="h-1 flex-1 bg-slate-200 rounded-full" /><h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Bonus Quests</h3><div className="h-1 flex-1 bg-slate-200 rounded-full" /></div>
                     {standaloneLessons.map((item: any) => (
                         <StandaloneAssignmentCard key={item.id} item={item} isCompleted={completedItems.includes(item.id)} onSelectLesson={onSelectLesson} theme={theme} />
                     ))}
                 </section>
             )}
          </div>
        )}

        {/* OTHER TABS */}
        {activeSubTab === 'leaderboard' && <LeaderboardView studentEmails={classData.studentEmails} currentUserEmail={userData.email} />}
        {activeSubTab === 'exams' && (
          <section className="space-y-4 px-4 max-w-lg mx-auto" aria-label="Exams">
            {examList.length === 0 ? (
                <div className="text-center py-20 opacity-40"><FileText size={48} className="mx-auto mb-4" aria-hidden="true" /><p className="font-black text-xs uppercase tracking-widest leading-loose">No active exams<br/>assigned to this class.</p></div>
            ) : (
                examList.map((item: any) => <ExamCard key={item.id} item={item} onSelectLesson={onSelectLesson} />)
            )}
          </section>
        )}
        {activeSubTab === 'forum' && <div className="h-[70vh]"><ClassForum classId={classData.id} userData={userData} /></div>}
        {activeSubTab === 'grades' && <StudentGradebook classData={classData} user={userData} />}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[550px] z-[100] px-2" aria-label="Bottom Navigation">
          <div className="bg-slate-900/95 backdrop-blur-2xl p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-between gap-1">
            {[
              { id: 'lessons', label: 'Roadmap', icon: <BookOpen size={18} aria-hidden="true" /> },
              { id: 'leaderboard', label: 'Rankings', icon: <Trophy size={18} aria-hidden="true" /> },
              { id: 'exams', label: 'Exams', icon: <FileText size={18} aria-hidden="true" /> },
              { id: 'forum', label: 'Forum', icon: <MessageSquare size={18} aria-hidden="true" /> },
              { id: 'grades', label: 'Grades', icon: <CheckCircle2 size={18} aria-hidden="true" /> }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  aria-label={tab.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex flex-1 items-center justify-center gap-2 py-3.5 px-4 rounded-full transition-all duration-300 relative group focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</div>
                  {isActive && <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">{tab.label}</span>}
                </button>
              );
            })}
          </div>
      </nav>
    </div>
  );
}

// ============================================================================
//  INTERNAL BLOCK RENDERERS (The Safe Candy Land Roadmap)
// ============================================================================

const CurriculumPathway = ({ curr, lessons, completedItems, isExpanded, onToggle, onSelectLesson, theme }: any) => {
    const currLessons = (curr.lessonIds || []).map((id: string) => lessons.find((l: any) => l.id === id)).filter(Boolean);
    const completedCountInCurr = currLessons.filter((l: any) => completedItems.includes(l.id)).length;
    const progressPercent = currLessons.length > 0 ? Math.round((completedCountInCurr / currLessons.length) * 100) : 0;
    const activeNodeIndex = currLessons.findIndex((l: any) => !completedItems.includes(l.id));
    const normalizedActiveIndex = activeNodeIndex === -1 ? currLessons.length - 1 : activeNodeIndex;
    const headerAccent = curr.themeColor || '#6366f1';

    return (
        <article className="bg-transparent relative pb-8">
            <button 
                className="w-full text-left bg-white p-6 md:p-8 rounded-[3rem] border-2 border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden group focus:outline-none z-20"
                onClick={onToggle} aria-expanded={isExpanded} style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{ backgroundColor: headerAccent }} />
                <div className="relative z-10 flex items-center justify-between mb-6">
                    <div>
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-inner">{curr.grade || 'Pathway'}</span>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-800 pr-4 leading-tight">{curr.title}</h3>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors shadow-inner"><ChevronUp size={24} className={isExpanded ? '' : 'rotate-180 transition-transform'} /></div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-inner flex-1">
                        <div className="h-full transition-all duration-1000" style={{ width: `${progressPercent}%`, backgroundColor: headerAccent }} />
                    </div>
                    <span className="text-sm font-black text-slate-400 shrink-0">{progressPercent}%</span>
                </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-700 ease-in-out relative z-10 ${isExpanded ? 'max-h-[5000px] opacity-100 mt-[-2rem]' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
                <div className="pt-16 pb-12 px-1 sm:px-4 bg-slate-100/50 rounded-b-[3rem] border-2 border-t-0 border-slate-100 relative">
                    {currLessons.length === 0 ? (
                        <div className="text-center p-8"><Map size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-sm font-bold text-slate-500">No modules found in this pathway.</p></div>
                    ) : (
                        <div className="relative max-w-sm mx-auto w-full">
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 bg-slate-200/60 rounded-full z-0" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 sm:w-8 rounded-full transition-all duration-1000 z-0 shadow-inner" style={{ height: `${currLessons.length > 1 ? (normalizedActiveIndex / (currLessons.length - 1)) * 100 : 100}%`, backgroundColor: headerAccent }} />
                            <div className="relative z-10 flex flex-col gap-8 sm:gap-12 py-8">
                                {currLessons.map((item: any, index: number) => {
                                    const isCompleted = completedItems.includes(item.id);
                                    const isCurrent = index === normalizedActiveIndex;
                                    const isLocked = index > normalizedActiveIndex;
                                    const isExam = item.contentType === 'exam' || item.contentType === 'test';
                                    const isLeft = index % 2 === 0;

                                    return (
                                        <div key={item.id} className={`relative flex w-full items-center min-h-[90px] sm:min-h-[100px] ${isLocked ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                            <div className={`w-1/2 flex justify-end pr-10 sm:pr-14 z-10 ${!isLeft ? 'invisible' : ''}`}>
                                                <div className={`bg-white p-3 sm:p-4 rounded-2xl shadow-sm border-2 ${isCurrent ? 'border-indigo-300 scale-105 shadow-md' : 'border-slate-100'} transition-transform duration-300 w-full max-w-[150px] text-right`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${isCurrent ? 'text-indigo-500' : 'text-slate-400'}`}>{isExam ? 'Checkpoint' : `Module ${index + 1}`}</span>
                                                    <h4 className="font-black text-[11px] sm:text-sm text-slate-800 leading-tight line-clamp-2 break-words">{item.title}</h4>
                                                </div>
                                            </div>
                                            <div className={`absolute left-1/2 top-1/2 -translate-y-1/2 z-20 transition-transform duration-300 ${isLeft ? '-translate-x-[30%]' : '-translate-x-[70%]'}`}>
                                                <button 
                                                    disabled={isLocked} onClick={() => onSelectLesson(item)} 
                                                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-[6px] transition-all duration-300 shadow-xl focus:outline-none
                                                        ${isCompleted ? 'bg-emerald-500 border-white text-white' : isCurrent ? `bg-white border-[${headerAccent}] text-slate-800 scale-110 animate-bounce-slow shadow-[0_10px_20px_rgba(0,0,0,0.15)]` : 'bg-slate-100 border-white text-slate-400 cursor-not-allowed'}
                                                        ${isExam && !isCompleted ? 'border-rose-400 bg-white text-rose-500' : ''}
                                                    `}
                                                    style={{ ...(isCurrent && !isExam ? { borderColor: headerAccent, color: headerAccent } : {}), WebkitTapHighlightColor: 'transparent' }}
                                                >
                                                    {isCompleted ? <CheckCircle2 size={24} strokeWidth={3} /> : isLocked ? <Lock size={20} /> : isExam ? <Trophy size={24} fill={isCurrent ? "currentColor" : "none"} /> : <Play size={24} className="ml-1" fill={isCurrent ? "currentColor" : "none"} />}
                                                    {isCurrent && <div className="absolute inset-0 -m-3 border-4 rounded-full animate-ping opacity-40 pointer-events-none" style={{ borderColor: isExam ? '#f43f5e' : headerAccent }} />}
                                                </button>
                                            </div>
                                            <div className={`w-1/2 flex justify-start pl-10 sm:pl-14 z-10 ${isLeft ? 'invisible' : ''}`}>
                                                <div className={`bg-white p-3 sm:p-4 rounded-2xl shadow-sm border-2 ${isCurrent ? 'border-indigo-300 scale-105 shadow-md' : 'border-slate-100'} transition-transform duration-300 w-full max-w-[150px] text-left`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest block mb-1 ${isCurrent ? 'text-indigo-500' : 'text-slate-400'}`}>{isExam ? 'Checkpoint' : `Module ${index + 1}`}</span>
                                                    <h4 className="font-black text-[11px] sm:text-sm text-slate-800 leading-tight line-clamp-2 break-words">{item.title}</h4>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
};

const StandaloneAssignmentCard = ({ item, isCompleted, onSelectLesson, theme }: any) => (
    <button className={`w-full text-left p-5 border-4 bg-white rounded-[2.5rem] flex items-center gap-4 cursor-pointer transition-all active:scale-95 group focus:outline-none ${isCompleted ? 'border-emerald-100 shadow-sm' : 'border-slate-100 shadow-md hover:shadow-xl hover:border-indigo-100'}`} onClick={() => onSelectLesson(item)} style={{ WebkitTapHighlightColor: 'transparent' }}>
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-4 border-white shadow-inner transition-colors shrink-0 ${isCompleted ? 'bg-emerald-500 text-white' : `${theme.bg} text-white group-hover:scale-105`}`}>{isCompleted ? <CheckCircle2 size={28} strokeWidth={3} /> : item.type === 'arcade_game' ? <Gamepad2 size={28} /> : <Play size={28} className="ml-1" fill="currentColor" />}</div>
        <div className="flex-1 pr-2"><span className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${isCompleted ? 'text-emerald-500' : 'text-slate-400'}`}>{isCompleted ? 'Completed' : item.type === 'arcade_game' ? 'Arcade Quest' : 'Special Assignment'}</span><h4 className="font-black text-slate-800 text-xl leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</h4></div>
    </button>
);

const ExamCard = ({ item, onSelectLesson }: any) => (
    <button className="w-full text-left p-6 border-4 border-rose-100 bg-rose-50/50 rounded-[3rem] flex items-center gap-5 cursor-pointer hover:shadow-xl hover:bg-rose-50 transition-all group focus:outline-none" onClick={() => onSelectLesson(item)} style={{ WebkitTapHighlightColor: 'transparent' }}>
      <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-white text-rose-500 shadow-lg border-4 border-rose-100 group-hover:scale-105 transition-transform shrink-0"><Trophy size={36} fill="currentColor" /></div>
      <div><span className="text-[10px] font-black uppercase text-rose-500 tracking-widest bg-rose-100 px-3 py-1 rounded-lg mb-2 inline-block shadow-inner">High-Stakes Assessment</span><h4 className="font-black text-slate-900 text-2xl leading-tight transition-colors">{item.title}</h4></div>
    </button>
);
