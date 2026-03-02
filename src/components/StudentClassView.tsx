// src/components/StudentClassView.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  query, collection, where, onSnapshot, orderBy, limit, addDoc 
} from "firebase/firestore";
import { auth, db, appId } from '../config/firebase';
import { 
  MessageSquare, Send, ArrowLeft, BookOpen, CheckCircle2, 
  Lock, Play, ChevronRight, Monitor, FileText 
} from 'lucide-react';

// Import the gradebook we extracted earlier
import StudentGradebook from './StudentGradebook';

// TODO: If ExamPlayerView is extracted later, import it here. 
// For now, we assume it's passed or available.
// import ExamPlayerView from './ExamPlayerView'; 

// ============================================================================
//  INTERNAL FORUM COMPONENT
// ============================================================================
const ClassForum = ({ classId, userData }: { classId: string, userData: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'artifacts', appId, 'classes', classId, 'forum'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    });
  }, [classId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'classes', classId, 'forum'), {
      text: newMessage,
      senderName: userData?.name || 'Scholar',
      senderId: auth.currentUser?.uid,
      role: userData?.role || 'student',
      timestamp: Date.now()
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-inner">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 p-10 text-center">
            <MessageSquare size={40} className="mb-4" />
            <p className="font-black uppercase tracking-tighter text-xs">No questions yet.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === auth.currentUser?.uid ? 'items-end' : 'items-start'} animate-in fade-in`}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 px-2">{msg.senderName}</span>
            <div className={`p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed max-w-[85%] ${msg.senderId === auth.currentUser?.uid ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Ask a question..." className="flex-1 bg-slate-50 rounded-2xl px-5 py-3 text-sm outline-none" />
        <button type="submit" className="p-4 bg-indigo-600 text-white rounded-2xl active:scale-90 transition-transform"><Send size={20} /></button>
      </form>
    </div>
  );
};

// ============================================================================
//  STUDENT CLASS VIEW (Floating Pillbox Edition)
// ============================================================================
export default function StudentClassView({ 
    classData, 
    lessons = [], 
    curriculums = [], 
    onBack, 
    onSelectLesson, 
    userData, 
    setActiveTab, 
    setSelectedLessonId,
    ExamPlayerView // Pass this in as a prop if it's still in App.tsx
}: any) {
  const [activeSubTab, setActiveSubTab] = useState<'lessons' | 'exams' | 'forum' | 'grades'>('lessons');
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [activeExam, setActiveExam] = useState<any>(null); 

  // 1. FETCH COMPLETIONS
  useEffect(() => {
    const studentEmail = userData?.email || auth?.currentUser?.email;
    if (!classData?.assignments && !classData?.assignedCurriculums) return;
    if (!studentEmail) return;

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

  // 2. ASSIGNMENT POPULATOR
  const populatedAssignments = (classData?.assignments || [])
    .map((assignment: any) => {
        if (typeof assignment === 'string') {
            return lessons.find((l: any) => l.id === assignment);
        }
        return assignment;
    })
    .filter(Boolean);

  const lessonList = populatedAssignments.filter((a: any) => a.contentType !== 'test' && a.contentType !== 'exam');
  const examList = populatedAssignments.filter((a: any) => a.contentType === 'test' || a.contentType === 'exam');

  const assignedCurriculums = (classData?.assignedCurriculums || [])
    .map((id: string) => curriculums.find((c: any) => c.id === id))
    .filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500 font-sans relative">
      
      {/* --- HEADER --- */}
      <div className="p-6 md:p-8 pt-10 md:pt-12 shrink-0 bg-white">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest active:scale-95 w-fit">
          <ArrowLeft size={16} /> BACK TO DASHBOARD
        </button>
        <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">{classData.name}</h2>
        <p className="text-slate-400 font-bold text-sm line-clamp-1">{classData.description || "Welcome to your active curriculum."}</p>
      </div>

      {/* --- CONTENT BODY --- */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-28 custom-scrollbar relative">
        
        {/* TAB: LESSONS & CURRICULUM ROADMAP */}
        {activeSubTab === 'lessons' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
            
            {assignedCurriculums.length === 0 && lessonList.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <BookOpen size={48} className="mb-4 opacity-50" />
                  <p className="text-center font-bold text-sm text-slate-400">No learning pathways assigned yet.</p>
              </div>
            )}

            {assignedCurriculums.map((curr: any) => {
                const currLessons = curr.lessonIds.map((id: string) => lessons.find((l: any) => l.id === id)).filter(Boolean);
                const completedCount = currLessons.filter((l: any) => completedItems.includes(l.id) || (l.originalId && completedItems.includes(l.originalId)) || completedItems.includes(l.title)).length;
                const progressPercent = currLessons.length === 0 ? 0 : Math.round((completedCount / currLessons.length) * 100);

                return (
                    <div key={curr.id} className="bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-sm">
                        <div className="bg-slate-900 p-8 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: curr.themeColor }} />
                            <div className="relative z-10 flex items-center justify-between mb-6">
                                <div>
                                    <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-3 inline-block">
                                        {curr.level} Pathway
                                    </span>
                                    <h3 className="text-2xl font-black text-white">{curr.title}</h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-white">{progressPercent}%</span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Completed</p>
                                </div>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner relative z-10">
                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="relative border-l-4 border-slate-100 ml-6 space-y-10 py-4">
                                {currLessons.map((item: any, index: number) => {
                                    const isCompleted = completedItems.includes(item.id) || (item.originalId && completedItems.includes(item.originalId)) || completedItems.includes(item.title);
                                    const isNext = index === completedCount;
                                    const isLocked = index > completedCount;

                                    return (
                                        <div key={item.id} className={`relative pl-10 transition-all duration-500 ${isLocked ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                                            <div className={`absolute -left-[22px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 transition-colors ${
                                                isCompleted ? 'bg-emerald-500 text-white' : 
                                                isNext ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' : 
                                                'bg-slate-200 text-slate-400'
                                            }`}>
                                                {isCompleted ? <CheckCircle2 size={16} strokeWidth={3} /> : 
                                                 isLocked ? <Lock size={16} /> : 
                                                 <Play size={16} className="ml-0.5" />}
                                            </div>

                                            <button 
                                                disabled={isLocked}
                                                onClick={() => onSelectLesson(item)}
                                                className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all group flex items-center justify-between ${
                                                    isNext ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 shadow-md scale-[1.02]' : 
                                                    isCompleted ? 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50' : 
                                                    'border-slate-100 bg-slate-50'
                                                }`}
                                            >
                                                <div>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 block ${
                                                        isNext ? 'text-indigo-600' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
                                                    }`}>
                                                        Unit {index + 1} {isNext && '• Up Next'}
                                                    </span>
                                                    <h4 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                                </div>
                                                
                                                {!isLocked && (
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${
                                                        isNext ? 'bg-indigo-600 text-white group-hover:scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                                                    }`}>
                                                        <ChevronRight size={20} />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}

            {lessonList.length > 0 && (
              <div className="mt-12">
                  {assignedCurriculums.length > 0 && (
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 pl-4 border-l-4 border-slate-200">
                          Additional Assignments
                      </h3>
                  )}
                  <div className="space-y-4">
                    {lessonList.map((item: any) => {
                        const isCompleted = completedItems.includes(item.id) || (item.originalId && completedItems.includes(item.originalId)) || completedItems.includes(item.title);
                        return (
                            <div key={item.id} className={`group p-5 border-2 ${isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-white'} rounded-[2.5rem] flex justify-between items-center hover:shadow-xl hover:-translate-y-1 transition-all`}>
                                <button className="flex items-center gap-4 flex-1 text-left" onClick={() => onSelectLesson(item)}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                                        isCompleted ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' : 
                                        'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                    }`}>
                                        {isCompleted ? <CheckCircle2 size={24} /> : <Play size={24} className="ml-1" fill="currentColor" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-indigo-400'}`}>
                                            {isCompleted ? 'Completed • Review' : 'Stand-Alone Unit'}
                                        </span>
                                    </div>
                                </button>
                                <button onClick={() => { setSelectedLessonId(item.originalId || item.id); setActiveTab('presentation'); }} className="p-4 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-colors shrink-0" title="Presentation Mode">
                                    <Monitor size={24} />
                                </button>
                            </div>
                        );
                    })}
                  </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: EXAMS */}
        {activeSubTab === 'exams' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {examList.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <FileText size={48} className="mb-4 opacity-50" />
                  <p className="text-center font-bold text-sm text-slate-400">No active exams.</p>
              </div>
            ) : (
              examList.map((item: any) => {
                const isCompleted = completedItems.includes(item.id) || (item.originalId && completedItems.includes(item.originalId)) || completedItems.includes(item.title);
                return (
                  <div key={item.id} className={`group p-5 border-2 ${isCompleted ? 'border-emerald-100 bg-emerald-50/20' : 'border-rose-100 bg-white'} rounded-[2.5rem] flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all`} onClick={() => !isCompleted && setActiveExam(item)}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'}`}>
                      {isCompleted ? <CheckCircle2 size={24} /> : <FileText size={24} fill="currentColor" />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg leading-tight mb-1 group-hover:text-rose-600 transition-colors">{item.title}</h4>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {isCompleted ? 'Exam Submitted • Review in Grades' : 'Active Exam'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* FORUM */}
        {activeSubTab === 'forum' && <div className="h-[60vh]"><ClassForum classId={classData.id} userData={userData} /></div>}
        
        {/* GRADES */}
        {activeSubTab === 'grades' && <StudentGradebook classData={classData} user={userData} />}
      </div>

      {/* --- FLOATING BOTTOM PILLBOX NAV --- */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-40">
          <div className="bg-slate-900/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-white/10 flex items-center justify-between gap-1">
            {[
              { id: 'lessons', label: 'Roadmap', icon: <BookOpen size={18}/> },
              { id: 'exams', label: 'Exams', icon: <FileText size={18}/> },
              { id: 'forum', label: 'Forum', icon: <MessageSquare size={18}/> },
              { id: 'grades', label: 'Grades', icon: <CheckCircle2 size={18}/> }
            ].map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-[2rem] transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className={`${isActive ? 'scale-110 mb-1' : 'mb-1'} transition-transform duration-300`}>
                      {tab.icon}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                      {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
      </div>

      {/* EXAM OVERLAY */}
      {activeExam && ExamPlayerView && (
        <div className="absolute inset-0 z-50 bg-white">
            <ExamPlayerView 
                exam={activeExam} 
                onFinish={() => setActiveExam(null)} 
            />
        </div>
      )}
    </div>
  );
}
