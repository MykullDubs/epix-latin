// src/components/StudentClassView.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Mic, Square, Volume2, Loader2, Shield 
} from 'lucide-react';

import StudentGradebook from './StudentGradebook';
import LeaderboardView from './LeaderboardView';

// ============================================================================
//  SUB-COMPONENT: FORUM AVATAR
// ============================================================================
const ForumAvatar = ({ url, name, role, size = "md" }: any) => {
    const initials = name?.split(' ').map((n:any) => n[0]).join('').toUpperCase().slice(0, 2) || 'S';
    const sizeClasses: any = {
        xs: "w-6 h-6 text-[8px]",
        sm: "w-8 h-8 text-[10px]",
        md: "w-10 h-10 text-xs",
        lg: "w-12 h-12 text-sm"
    };

    return (
        <div className={`relative shrink-0 ${sizeClasses[size]}`}>
            <div className={`w-full h-full rounded-[35%] overflow-hidden flex items-center justify-center font-black transition-all shadow-sm ${
                url ? 'bg-white' : 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-white'
            }`}>
                {url ? (
                    <img src={url} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            {role === 'instructor' && (
                <div className="absolute -top-1 -right-1 bg-indigo-600 rounded-full border-2 border-white p-0.5 shadow-sm">
                    <Shield size={size === 'xs' ? 6 : 8} className="text-white" />
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
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100 flex items-center justify-between">
      {!audioUrl ? (
        <div className="flex items-center gap-4 w-full">
          <div className={`w-3 h-3 rounded-full bg-rose-500 ${isRecording ? 'animate-pulse' : 'opacity-30'}`} />
          <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex-1">
            {isRecording ? "Recording..." : "Voice Response"}
          </span>
          <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-3 rounded-full ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}>
            {isRecording ? <Square size={18} fill="white" /> : <Mic size={18} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full">
          <audio src={audioUrl} controls className="h-8 flex-1" />
          <button type="button" onClick={() => { setAudioUrl(null); onCancel(); }} className="text-rose-500 text-[10px] font-black uppercase px-2 hover:bg-rose-50 rounded-lg py-2 transition-colors">Discard</button>
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
    if (!newTitle.trim() || !newContent.trim()) return;
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
      comments: arrayUnion({
        text: commentText, authorName: userData?.name || 'Scholar',
        authorAvatarUrl: currentAvatar, authorId: auth.currentUser?.uid, 
        role: userData?.role, timestamp: Date.now()
      })
    });
    setCommentText(""); setReplyingToId(null);
  };

  if (view === 'list') {
    return (
      <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-inner p-6 overflow-hidden animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Discussions</h3>
            {isInstructor && (
                <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg"><Plus size={16}/> New Topic</button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {isCreating && (
                <form onSubmit={handleCreateTopic} className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 shadow-xl mb-6">
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Topic Title..." className="w-full text-lg font-black text-slate-800 outline-none mb-2" />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Prompt..." className="w-full text-sm text-slate-500 outline-none min-h-[100px] resize-none" />
                    <div className="flex gap-2 justify-end mt-4"><button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase">Post</button></div>
                </form>
            )}
            {topics.map(t => (
                <button key={t.id} onClick={() => { setActiveTopic(t); setView('thread'); }} className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-indigo-300 transition-all text-left">
                    <h4 className="text-lg font-black text-slate-800 mb-1">{t.title}</h4>
                    <p className="text-sm text-slate-400 line-clamp-1 mb-4 font-medium">{t.content}</p>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <ForumAvatar url={t.authorAvatarUrl} name={t.authorName} role={t.role} size="xs" />
                        <span>{t.authorName}</span>
                    </div>
                </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-inner overflow-hidden animate-in slide-in-from-right-8 duration-500">
        <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between shadow-sm z-20">
            <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase hover:text-indigo-600 transition-colors"><ArrowLeft size={16}/> Back</button>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg">Response Gallery</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={80} /></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 block">Discussion Prompt</span>
                    <h2 className="text-3xl font-black mb-4 leading-tight">{activeTopic.title}</h2>
                    <p className="text-slate-300 font-medium leading-relaxed mb-6">{activeTopic.content}</p>
                    <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase shadow-xl">Respond</button>
                </div>
            </div>

            {isCreating && (
                <form onSubmit={handlePostResponse} className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl space-y-4">
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Response title..." className="w-full text-xl font-black text-slate-800 outline-none" />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write thoughts..." className="w-full text-sm text-slate-500 outline-none min-h-[100px] resize-none" />
                    <VoiceRecorder onRecordingComplete={setPendingAudio} onCancel={() => setPendingAudio(null)} />
                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-50">
                        <button type="submit" disabled={isUploading} className="px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3 bg-indigo-600 text-white">
                            {isUploading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Response'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-10">
                {responses.map((res) => (
                    <div key={res.id} className="space-y-4">
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative group">
                            <div className="flex items-center gap-4 mb-6">
                                <ForumAvatar url={res.authorAvatarUrl} name={res.authorName} role={res.role} size="lg" />
                                <div>
                                    <span className="block text-xs font-black text-slate-800 leading-none mb-1">{res.authorName}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(res.timestamp).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{res.title}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">{res.content}</p>
                            
                            {res.audioUrl && (
                                <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl flex items-center gap-4 border border-indigo-100">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Volume2 size={20} /></div>
                                    <audio src={res.audioUrl} controls className="h-8 flex-1 opacity-90" />
                                </div>
                            )}

                            <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                                <button onClick={() => handleToggleLike(res.id, res.likes || [], res.authorId)} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${res.likes?.includes(auth.currentUser?.uid) ? 'bg-rose-50 text-rose-500' : 'text-slate-400'}`}>
                                    <Heart size={16} className={res.likes?.includes(auth.currentUser?.uid) ? 'fill-rose-500' : ''} /> 
                                    <span className="text-[11px] font-black uppercase tracking-widest">{res.likes?.length || 0} Appreciations</span>
                                </button>
                                <button onClick={() => setReplyingToId(replyingToId === res.id ? null : res.id)} className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase hover:text-indigo-600"><MessageSquare size={16} /> Reply</button>
                            </div>
                        </div>

                        <div className="ml-10 space-y-4">
                            {res.comments?.map((comment: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ForumAvatar url={comment.authorAvatarUrl} name={comment.authorName} role={comment.role} size="xs" />
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{comment.authorName}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{comment.text}</p>
                                </div>
                            ))}
                            {replyingToId === res.id && (
                                <div className="flex gap-2 animate-in slide-in-from-top-2">
                                    <input autoFocus value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Reply..." className="flex-1 bg-white border-2 border-indigo-100 rounded-2xl px-5 py-3 text-sm font-medium outline-none" onKeyDown={(e) => e.key === 'Enter' && handlePostComment(res.id)} />
                                    <button onClick={() => handlePostComment(res.id)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><Send size={18}/></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
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
  const [activeSubTab, setActiveSubTab] = useState<'lessons' | 'leaderboard' | 'exams' | 'forum' | 'grades'>('lessons');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const studentEmail = userData?.email || auth?.currentUser?.email;
    if (!classData || !studentEmail) return;
    const q = query(collection(db, 'artifacts', appId, 'activity_logs'), where('studentEmail', '==', studentEmail), where('type', '==', 'completion'));
    return onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.flatMap(d => [d.data().itemId, d.data().originalId, d.data().itemTitle].filter(Boolean));
      setCompletedItems(ids);
    });
  }, [classData, userData]);

  const toggleRoadmap = (currId: string) => {
    setExpandedRoadmaps(prev => ({ ...prev, [currId]: !prev[currId] }));
  };

  // --- DATA MAPPING ---
  const populatedAssignments = (classData?.assignments || [])
    .map((assignment: any) => typeof assignment === 'string' ? lessons.find((l: any) => l.id === assignment) : assignment)
    .filter(Boolean);

  const assignedCurriculums = (classData?.assignedCurriculums || [])
    .map((id: string) => curriculums.find((c: any) => c.id === id))
    .filter(Boolean);

  const standaloneLessons = populatedAssignments.filter((a: any) => a.contentType !== 'exam' && a.contentType !== 'test');
  const examList = populatedAssignments.filter((a: any) => a.contentType === 'exam' || a.contentType === 'test');

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 font-sans relative">
      
      {/* HEADER */}
      <div className="p-6 md:p-8 pt-10 md:pt-12 shrink-0 bg-white">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest active:scale-95 w-fit">
          <ArrowLeft size={16} /> DASHBOARD
        </button>
        <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2 tracking-tight">{classData.name}</h2>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-slate-400 font-bold text-sm line-clamp-1">{classData.description || "Active Learning Pathway"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-48 custom-scrollbar relative">
        
        {/* ROADMAP TAB */}
        {activeSubTab === 'lessons' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
             
             {/* 1. CURRICULUM ACCORDIONS */}
             {assignedCurriculums.length > 0 && (
                 <div className="space-y-8 mb-10">
                     {assignedCurriculums.map((curr: any) => {
                        const currLessons = curr.lessonIds.map((id: string) => lessons.find((l: any) => l.id === id)).filter(Boolean);
                        const isExpanded = expandedRoadmaps[curr.id];
                        const completedCountInCurr = currLessons.filter((l: any) => completedItems.includes(l.id)).length;
                        const progressPercent = currLessons.length > 0 ? Math.round((completedCountInCurr / currLessons.length) * 100) : 0;
                        
                        return (
                            <div key={curr.id} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm transition-all duration-300">
                                <div 
                                    className="bg-slate-900 p-8 relative overflow-hidden cursor-pointer group"
                                    onClick={() => toggleRoadmap(curr.id)}
                                >
                                    <div className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30" style={{ backgroundColor: curr.themeColor }} />
                                    <div className="relative z-10 flex items-center justify-between mb-4">
                                        <div>
                                            <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-3 inline-block">{curr.level} Pathway</span>
                                            <h3 className="text-2xl font-black text-white pr-4">{curr.title}</h3>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end">
                                            <span className="text-3xl font-black text-white">{progressPercent}%</span>
                                            <div className="w-10 h-10 mt-2 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-transform duration-300">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative z-10">
                                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                </div>
                                <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-8 bg-slate-50 border-t border-slate-100">
                                        <div className="relative border-l-4 border-slate-200 ml-6 space-y-10 py-4">
                                            {currLessons.map((item: any, index: number) => {
                                                const isCompleted = completedItems.includes(item.id);
                                                const isLocked = index > completedCountInCurr;
                                                return (
                                                    <div key={item.id} className={`relative pl-10 ${isLocked ? 'opacity-50 grayscale' : 'animate-in slide-in-from-left-4'}`}>
                                                        <div className={`absolute -left-[22px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-sm z-10 transition-all ${isCompleted ? 'bg-emerald-500 text-white scale-110' : index === completedCountInCurr ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' : 'bg-slate-200 text-slate-400'}`}>
                                                            {isCompleted ? <CheckCircle2 size={16} strokeWidth={3} /> : <Play size={16} className={index === completedCountInCurr ? "ml-1" : ""} />}
                                                        </div>
                                                        <button disabled={isLocked} onClick={() => onSelectLesson(item)} className="w-full text-left p-6 rounded-[2.5rem] border-2 border-transparent bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group active:scale-95">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Unit {index + 1}</span>
                                                            <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                     })}
                 </div>
             )}

             {/* 2. STANDALONE ASSIGNMENTS */}
             {standaloneLessons.length > 0 && (
                 <div className="space-y-4 mb-10">
                     <div className="flex items-center gap-3 ml-2 mb-6">
                        <div className="h-0.5 flex-1 bg-slate-100 rounded-full" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Individual Assignments</h3>
                        <div className="h-0.5 flex-1 bg-slate-100 rounded-full" />
                     </div>
                     
                     {standaloneLessons.map((item: any) => {
                         const isCompleted = completedItems.includes(item.id);
                         return (
                             <div key={item.id} className="p-6 border-2 border-slate-100 bg-white rounded-[2.5rem] flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all active:scale-95 group" onClick={() => onSelectLesson(item)}>
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${isCompleted ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                     {isCompleted ? <CheckCircle2 size={24} strokeWidth={3} /> : <Play size={24} className="ml-1" />}
                                 </div>
                                 <div className="flex-1">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Assigned Activity</span>
                                     <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}

             {/* 3. ASSESSMENTS & EXAMS (NEW) */}
             {examList.length > 0 && (
                 <div className="space-y-4 mb-10">
                     <div className="flex items-center gap-3 ml-2 mb-6 mt-10">
                        <div className="h-0.5 flex-1 bg-rose-100 rounded-full" />
                        <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Knowledge Checks</h3>
                        <div className="h-0.5 flex-1 bg-rose-100 rounded-full" />
                     </div>
                     
                     {examList.map((item: any) => {
                         const isCompleted = completedItems.includes(item.id);
                         return (
                             <div key={item.id} className="p-6 border-2 border-rose-100 bg-white rounded-[2.5rem] flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-rose-200 transition-all active:scale-95 group" onClick={() => onSelectLesson(item)}>
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${isCompleted ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                                     {isCompleted ? <CheckCircle2 size={24} strokeWidth={3} /> : <FileText size={24} />}
                                 </div>
                                 <div className="flex-1">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1 block">High-Stakes Assessment</span>
                                     <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-rose-600 transition-colors">{item.title}</h4>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}
          </div>
        )}

        {/* OTHER TABS */}
        {activeSubTab === 'leaderboard' && <LeaderboardView studentEmails={classData.studentEmails} currentUserEmail={userData.email} />}
        
        {activeSubTab === 'exams' && (
          <div className="space-y-4">
            {examList.length === 0 ? (
                <div className="text-center py-20 opacity-40">
                    <FileText size={48} className="mx-auto mb-4" />
                    <p className="font-black text-xs uppercase tracking-widest leading-loose">No active exams<br/>assigned to this class.</p>
                </div>
            ) : (
                examList.map((item: any) => (
                  <div key={item.id} className="p-6 border-2 border-rose-100 bg-white rounded-[3rem] flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all" onClick={() => onSelectLesson(item)}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600 shadow-inner"><FileText size={28} fill="currentColor" /></div>
                    <div><h4 className="font-black text-slate-900 text-xl leading-tight mb-1">{item.title}</h4><span className="text-[10px] font-black uppercase text-rose-400 tracking-widest">High-Stakes Assessment</span></div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeSubTab === 'forum' && <div className="h-[70vh]"><ClassForum classId={classData.id} userData={userData} /></div>}
        {activeSubTab === 'grades' && <StudentGradebook classData={classData} user={userData} />}
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[550px] z-[100] px-2">
          <div className="bg-slate-900/95 backdrop-blur-2xl p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-between gap-1">
            {[
              { id: 'lessons', label: 'Roadmap', icon: <BookOpen size={18}/> },
              { id: 'leaderboard', label: 'Rankings', icon: <Trophy size={18}/> },
              { id: 'exams', label: 'Exams', icon: <FileText size={18}/> },
              { id: 'forum', label: 'Forum', icon: <MessageSquare size={18}/> },
              { id: 'grades', label: 'Grades', icon: <CheckCircle2 size={18}/> }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex flex-1 items-center justify-center gap-2 py-3.5 px-4 rounded-full transition-all duration-300 relative group ${
                    isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</div>
                  {isActive && <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">{tab.label}</span>}
                </button>
              );
            })}
          </div>
      </div>
    </div>
  );
}
