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
  Mic, Square, Volume2, Loader2 
} from 'lucide-react';

import StudentGradebook from './StudentGradebook';
import LeaderboardView from './LeaderboardView';

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
      alert("Microphone access denied. Please check your browser settings.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100 flex items-center justify-between animate-in zoom-in-95">
      {!audioUrl ? (
        <div className="flex items-center gap-4 w-full">
          <div className={`w-3 h-3 rounded-full bg-rose-500 ${isRecording ? 'animate-pulse' : 'opacity-30'}`} />
          <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex-1">
            {isRecording ? "Recording Audio..." : "Ready to Record Voice"}
          </span>
          <button 
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full transition-all shadow-md ${isRecording ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
          >
            {isRecording ? <Square size={18} fill="white" /> : <Mic size={18} />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Volume2 size={16} />
          </div>
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
    const uid = auth.currentUser.uid;
    const isLiked = currentLikes.includes(uid);
    const responseRef = doc(db, 'artifacts', appId, 'classes', classId, 'forum_topics', activeTopic.id, 'responses', responseId);
    await updateDoc(responseRef, { likes: isLiked ? arrayRemove(uid) : arrayUnion(uid) });
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'classes', classId, 'forum_topics'), {
      title: newTitle, content: newContent, authorName: userData?.name || 'Instructor',
      authorId: auth.currentUser?.uid, role: userData?.role, timestamp: Date.now(), replyCount: 0
    });
    setNewTitle(""); setNewContent(""); setIsCreating(false);
  };

  const handlePostResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || (!newContent.trim() && !pendingAudio)) {
      alert("Please provide a title and either a message or a recording.");
      return;
    }
    if (!activeTopic) return;
    setIsUploading(true);

    try {
      let audioUrl = "";
      if (pendingAudio) {
        const audioPath = `artifacts/${appId}/forum/${auth.currentUser?.uid}_${Date.now()}.webm`;
        const audioRef = ref(storage, audioPath);
        const uploadResult = await uploadBytes(audioRef, pendingAudio);
        audioUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(collection(db, 'artifacts', appId, 'classes', classId, 'forum_topics', activeTopic.id, 'responses'), {
        title: newTitle, content: newContent || "", audioUrl,
        authorName: userData?.name || 'Scholar', authorId: auth.currentUser?.uid,
        role: userData?.role || 'student', timestamp: Date.now(), comments: [], likes: []
      });

      setNewTitle(""); setNewContent(""); setPendingAudio(null); setIsCreating(false);
    } catch (err: any) {
      alert("Error uploading response: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePostComment = async (responseId: string) => {
    if (!commentText.trim()) return;
    const responseRef = doc(db, 'artifacts', appId, 'classes', classId, 'forum_topics', activeTopic.id, 'responses', responseId);
    await updateDoc(responseRef, {
      comments: arrayUnion({
        text: commentText, authorName: userData?.name || 'Scholar',
        authorId: auth.currentUser?.uid, role: userData?.role, timestamp: Date.now()
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
                <button onClick={() => setIsCreating(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all"><Plus size={16}/> New Topic</button>
            )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {isCreating && (
                <form onSubmit={handleCreateTopic} className="bg-white p-6 rounded-[2rem] border-2 border-indigo-100 shadow-xl mb-6 animate-in slide-in-from-top-4">
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Topic Title..." className="w-full text-lg font-black text-slate-800 outline-none mb-2" />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Instructional prompt..." className="w-full text-sm text-slate-500 outline-none min-h-[100px] resize-none" />
                    <div className="flex gap-2 justify-end mt-4">
                        <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 font-bold text-xs uppercase px-3">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg">Post</button>
                    </div>
                </form>
            )}
            {topics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <MessageSquare size={48} className="mb-4" />
                    <p className="font-black text-xs uppercase tracking-widest text-center leading-loose">No discussions<br/>here yet.</p>
                </div>
            ) : (
                topics.map(t => (
                    <button key={t.id} onClick={() => { setActiveTopic(t); setView('thread'); }} className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-indigo-300 transition-all text-left group">
                        <h4 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">{t.title}</h4>
                        <p className="text-sm text-slate-400 line-clamp-1 mb-4 font-medium">{t.content}</p>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            <span className="flex items-center gap-1.5"><User size={12}/> {t.authorName}</span>
                            <span className="flex items-center gap-1.5"><MessageSquare size={12}/> Responses</span>
                        </div>
                    </button>
                ))
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 shadow-inner overflow-hidden animate-in slide-in-from-right-8 duration-500">
        <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between shadow-sm z-20">
            <button onClick={() => { setView('list'); setPendingAudio(null); setIsCreating(false); }} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase hover:text-indigo-600 transition-colors"><ArrowLeft size={16}/> Back</button>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg">Gallery View</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={80} /></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 block">Discussion Prompt</span>
                    <h2 className="text-3xl font-black mb-4 leading-tight">{activeTopic.title}</h2>
                    <p className="text-slate-300 font-medium leading-relaxed mb-6">{activeTopic.content}</p>
                    <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-indigo-50 transition-all active:scale-95">Respond to Prompt</button>
                </div>
            </div>

            {isCreating && (
                <form onSubmit={handlePostResponse} className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-xl animate-in zoom-in-95 space-y-4">
                    <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Give your response a title..." className="w-full text-xl font-black text-slate-800 outline-none" />
                    <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your thoughts (Optional if recording)..." className="w-full text-sm text-slate-500 outline-none min-h-[100px] resize-none font-medium" />
                    
                    <div className="pt-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Record Audio Response</span>
                        <VoiceRecorder onRecordingComplete={setPendingAudio} onCancel={() => setPendingAudio(null)} />
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-slate-50">
                        <button type="button" onClick={() => { setIsCreating(false); setPendingAudio(null); }} className="text-slate-400 font-bold text-xs uppercase px-4 hover:text-rose-500 transition-colors">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={isUploading || !newTitle.trim() || (!newContent.trim() && !pendingAudio)} 
                            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl flex items-center gap-3 transition-all ${
                                isUploading ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                            }`}
                        >
                            {isUploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : 'Post Contribution'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-10">
                {responses.map((res) => (
                    <div key={res.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm relative group transition-all hover:shadow-xl hover:border-indigo-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner ${res.role === 'instructor' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{(res.authorName?.[0] || 'S').toUpperCase()}</div>
                                <div>
                                    <span className="block text-xs font-black text-slate-800 leading-none mb-1">{res.authorName}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(res.timestamp).toLocaleDateString()}</span>
                                </div>
                                {res.role === 'instructor' && <span className="ml-auto text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">Verified Instructor</span>}
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{res.title}</h4>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">{res.content}</p>
                            
                            {res.audioUrl && (
                                <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl flex items-center gap-4 border border-indigo-100 shadow-inner">
                                    <Volume2 className="text-indigo-600 shrink-0" size={20} />
                                    <audio src={res.audioUrl} controls className="h-8 flex-1 opacity-90" />
                                </div>
                            )}

                            <div className="flex items-center gap-6 pt-6 border-t border-slate-50">
                                <button 
                                    onClick={() => handleToggleLike(res.id, res.likes || [], res.authorId)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-125 ${
                                        res.likes?.includes(auth.currentUser?.uid) 
                                        ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                                        : 'bg-slate-50 text-slate-400 border border-transparent hover:border-rose-100 hover:text-rose-400'
                                    }`}
                                >
                                    <Heart size={16} className={res.likes?.includes(auth.currentUser?.uid) ? 'fill-rose-500' : ''} /> 
                                    <span className="text-[11px] font-black uppercase tracking-widest">{res.likes?.length || 0} Appreciations</span>
                                </button>
                                <button onClick={() => setReplyingToId(replyingToId === res.id ? null : res.id)} className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"><MessageSquare size={16} /> Reply</button>
                            </div>
                        </div>

                        {/* Threaded Comments */}
                        <div className="ml-10 space-y-4">
                            {res.comments?.map((comment: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 animate-in slide-in-from-left-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${comment.role === 'instructor' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>{(comment.authorName?.[0] || 'S').toUpperCase()}</div>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{comment.authorName}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{comment.text}</p>
                                </div>
                            ))}
                            {replyingToId === res.id && (
                                <div className="flex gap-2 animate-in slide-in-from-top-2">
                                    <input autoFocus value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Participate in the thread..." className="flex-1 bg-white border-2 border-indigo-100 rounded-2xl px-5 py-3 text-sm font-medium outline-none shadow-xl" onKeyDown={(e) => e.key === 'Enter' && handlePostComment(res.id)} />
                                    <button onClick={() => handlePostComment(res.id)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl active:scale-90 transition-transform"><Send size={18}/></button>
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

    const q = query(
      collection(db, 'artifacts', appId, 'activity_logs'),
      where('studentEmail', '==', studentEmail),
      where('type', '==', 'completion')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const completedIdentifiers = snapshot.docs.flatMap(d => {
        const data = d.data();
        return [data.itemId, data.originalId, data.itemTitle].filter(Boolean);
      });
      setCompletedItems(completedIdentifiers);
    });

    return () => unsub();
  }, [classData, userData]);

  // --- VERIFIED DATA MAPPING ---
  const populatedAssignments = (classData?.assignments || [])
    .map((assignment: any) => typeof assignment === 'string' ? lessons.find((l: any) => l.id === assignment) : assignment)
    .filter(Boolean);

  const assignedCurriculums = (classData?.assignedCurriculums || [])
    .map((id: string) => curriculums.find((c: any) => c.id === id))
    .filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 font-sans relative">
      
      <div className="p-6 md:p-8 pt-10 md:pt-12 shrink-0 bg-white">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest active:scale-95 w-fit">
          <ArrowLeft size={16} /> EXIT TO DASHBOARD
        </button>
        <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2 tracking-tight">{classData.name}</h2>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-slate-400 font-bold text-sm line-clamp-1">{classData.description || "Interactive Learning Experience"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-48 custom-scrollbar relative">
        {activeSubTab === 'lessons' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
             {assignedCurriculums.map((curr: any) => {
                const currLessons = curr.lessonIds.map((id: string) => lessons.find((l: any) => l.id === id)).filter(Boolean);
                const isExpanded = expandedRoadmaps[curr.id];
                const visibleLessons = isExpanded ? currLessons : currLessons.slice(0, 4);
                const completedCountInCurr = currLessons.filter((l: any) => completedItems.includes(l.id)).length;
                const progressPercent = currLessons.length > 0 ? Math.round((completedCountInCurr / currLessons.length) * 100) : 0;

                return (
                    <div key={curr.id} className="bg-white rounded-[3.5rem] border-2 border-slate-100 overflow-hidden shadow-sm mb-10">
                        <div className="bg-slate-900 p-8 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: curr.themeColor }} />
                            <div className="relative z-10 flex items-center justify-between mb-6">
                                <div>
                                    <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-3 inline-block">{curr.level} Pathway</span>
                                    <h3 className="text-2xl font-black text-white">{curr.title}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-white">{progressPercent}%</span>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative z-10">
                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="relative border-l-4 border-slate-100 ml-6 space-y-10 py-4">
                                {visibleLessons.map((item: any, index: number) => {
                                    const isCompleted = completedItems.includes(item.id);
                                    const isLocked = index > completedCountInCurr;
                                    return (
                                        <div key={item.id} className={`relative pl-10 ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                                            <div className={`absolute -left-[22px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 ${isCompleted ? 'bg-emerald-500 text-white' : index === completedCountInCurr ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-slate-200 text-slate-400'}`}>
                                                {isCompleted ? <CheckCircle2 size={16} strokeWidth={3} /> : <Play size={16} />}
                                            </div>
                                            <button disabled={isLocked} onClick={() => onSelectLesson(item)} className="w-full text-left p-6 rounded-[2.5rem] border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-100 transition-all group">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Unit {index + 1}</span>
                                                <h4 className="font-black text-slate-800 text-lg leading-tight">{item.title}</h4>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
             })}
          </div>
        )}

        {activeSubTab === 'leaderboard' && <LeaderboardView studentEmails={classData.studentEmails} currentUserEmail={userData.email} />}
        
        {activeSubTab === 'exams' && (
          <div className="space-y-4">
            {populatedAssignments.filter((a: any) => a.contentType === 'exam' || a.contentType === 'test').map((item: any) => (
              <div key={item.id} className="p-6 border-2 border-rose-100 bg-white rounded-[3rem] flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all" onClick={() => onSelectLesson(item)}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600 shadow-inner"><FileText size={28} fill="currentColor" /></div>
                <div><h4 className="font-black text-slate-900 text-xl leading-tight mb-1">{item.title}</h4><span className="text-[10px] font-black uppercase text-rose-400 tracking-widest">High-Stakes Assessment</span></div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'forum' && <div className="h-[70vh]"><ClassForum classId={classData.id} userData={userData} /></div>}
        {activeSubTab === 'grades' && <StudentGradebook classData={classData} user={userData} />}
      </div>

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
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {tab.icon}
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap animate-in slide-in-from-left-2">
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
      </div>
    </div>
  );
}
