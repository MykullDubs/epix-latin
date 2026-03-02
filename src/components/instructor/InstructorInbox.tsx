// src/components/instructor/InstructorInbox.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../../config/firebase';
import { Inbox, ArrowLeft, AlertTriangle, Send } from 'lucide-react';
import { JuicyToast } from '../Toast';

export default function InstructorInbox() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [grades, setGrades] = useState<any>({}); 

  useEffect(() => { 
      const q = query(
          collection(db, 'artifacts', appId, 'activity_logs'), 
          where('scoreDetail.status', '==', 'pending_review'), 
          orderBy('timestamp', 'asc')
      ); 
      const unsub = onSnapshot(q, (snapshot) => { 
          setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
          setLoading(false); 
      }); 
      return () => unsub(); 
  }, []);

  const selectedItem = submissions.find(s => s.id === selectedId);

  useEffect(() => {
      if (selectedItem) {
          const initGrades: any = {};
          selectedItem.scoreDetail.details.forEach((q: any, i: number) => {
              initGrades[i] = q.awardedPoints || 0;
          });
          setGrades(initGrades);
          setFeedback('');
      }
  }, [selectedItem]);

  const handlePointChange = (idx: number, points: number) => {
      setGrades({ ...grades, [idx]: points });
  };

  const calculateTotal = () => {
      return Object.values(grades).reduce((acc: number, val: any) => acc + (parseInt(val) || 0), 0);
  };

  const handleSubmitGrade = async () => { 
      if(!selectedItem) return; 
      const finalScore = calculateTotal();
      const totalPossible = selectedItem.scoreDetail.total || 100;
      const scorePct = Math.round((finalScore / totalPossible) * 100);
      
      const updatedDetails = selectedItem.scoreDetail.details.map((q: any, idx: number) => ({
          ...q,
          awardedPoints: grades[idx] !== undefined ? parseInt(grades[idx], 10) : (q.awardedPoints || 0)
      }));

      try {
          const logRef = doc(db, 'artifacts', appId, 'activity_logs', selectedItem.id);
          await updateDoc(logRef, {
              'scoreDetail.score': finalScore,
              'scoreDetail.finalScorePct': scorePct,
              'scoreDetail.status': 'graded',
              'scoreDetail.instructorFeedback': feedback,
              'scoreDetail.details': updatedDetails,
              'lastUpdated': Date.now()
          });

          setToastMsg("Exam Graded & Released! 🎯");
          setSelectedId(null); 
          setFeedback(''); 
          setGrades({});
      } catch (error) {
          setToastMsg("Error saving grade to database.");
      }
  };

  return ( 
    <div className="flex h-full bg-slate-50 relative overflow-hidden">
        {toastMsg && <JuicyToast message={toastMsg} onClose={() => setToastMsg(null)} />}

        {/* SIDEBAR LIST */}
        <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-200 bg-white z-10`}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Inbox size={18} className="text-indigo-600"/> Inbox</h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{submissions.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {submissions.length === 0 ? <div className="p-8 text-center text-slate-400 italic text-sm">All caught up! 🎉</div> : submissions.map(sub => (
                    <div key={sub.id} onClick={() => setSelectedId(sub.id)} className={`p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 ${selectedId === sub.id ? 'bg-indigo-50 border-indigo-200' : ''}`}>
                        <div className="flex justify-between items-start mb-1"><span className="font-bold text-slate-700 text-sm">{sub.studentName}</span><span className="text-[10px] text-slate-400">{new Date(sub.timestamp).toLocaleDateString()}</span></div>
                        <p className="text-xs text-slate-500 truncate mb-2">{sub.itemTitle}</p>
                        <div className="flex gap-2"><span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Needs Review</span></div>
                    </div>
                ))}
            </div>
        </div>

        {/* GRADING PANE */}
        <div className={`flex-1 flex flex-col bg-slate-50 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
            {selectedItem ? (
                <>
                    <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10 relative">
                        <div className="flex items-center gap-3"><button onClick={() => setSelectedId(null)} className="md:hidden p-2 text-slate-400"><ArrowLeft size={20}/></button><div><h2 className="font-bold text-lg text-slate-800">{selectedItem.itemTitle}</h2><p className="text-xs text-slate-500">Submitted by <span className="font-bold text-indigo-600">{selectedItem.studentName}</span></p></div></div>
                        <div className="text-right"><div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Score</div><div className="text-2xl font-black text-indigo-600">{calculateTotal()} <span className="text-sm text-slate-300 font-medium">/ {selectedItem.scoreDetail.total}</span></div></div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {selectedItem.scoreDetail.details.map((q: any, idx: number) => (
                                <div key={idx} className={`bg-white p-6 rounded-2xl border-2 shadow-sm ${['essay'].includes(q.type) ? 'border-indigo-100 ring-4 ring-indigo-50' : 'border-slate-100'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded">{q.type}</span>
                                            {q.type === 'essay' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1"><AlertTriangle size={10}/> Essay</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Points:</label>
                                            <input type="number" min="0" max={q.maxPoints} value={grades[idx] || 0} onChange={(e) => handlePointChange(idx, parseInt(e.target.value))} className="w-16 p-1 text-center font-bold border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                                            <span className="text-xs font-bold text-slate-400">/ {q.maxPoints}</span>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-4">{q.prompt}</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 font-medium whitespace-pre-wrap font-serif leading-relaxed">
                                        {q.studentVal}
                                    </div>
                                    {q.type !== 'essay' && (
                                        <div className="mt-3 flex items-center gap-2 text-xs">
                                            <span className="font-bold text-slate-400 uppercase">Correct Answer:</span>
                                            <span className={`px-2 py-1 rounded font-bold ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{q.correctVal}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-end">
                            <div className="w-full space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">Final Feedback</label>
                                <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none" placeholder="Advice..." value={feedback} onChange={(e) => setFeedback(e.target.value)}/>
                            </div>
                            <div className="w-full md:w-auto shrink-0">
                                <button onClick={handleSubmitGrade} className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex justify-center items-center gap-2">
                                    <Send size={18}/> Release Grade ({calculateTotal()} pts)
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8">
                    <Inbox size={64} className="mb-4 opacity-50"/>
                    <p className="text-lg font-bold">Select a submission to grade</p>
                </div>
            )}
        </div>
    </div> 
  );
}
