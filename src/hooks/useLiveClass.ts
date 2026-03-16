// src/hooks/useLiveClass.ts
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export const useLiveClass = (classId: string, isInstructor: boolean = false) => {
    const [liveState, setLiveState] = useState<any>(null);

    // Listen to the live session in real-time
    useEffect(() => {
        if (!classId) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        
        const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
            if (docSnap.exists()) {
                setLiveState(docSnap.data());
            } else {
                setLiveState(null);
            }
        });

        return () => unsubscribe();
    }, [classId]);

    // --- INSTRUCTOR CONTROLS ---
    const startLiveClass = async (lessonId: string) => {
        if (!isInstructor) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await setDoc(sessionRef, {
            lessonId,
            currentBlockIndex: 0,
            quizState: 'waiting', // 'waiting' | 'active' | 'revealed'
            answers: {}, // { "student@email,com": "opt_1" }
            timestamp: Date.now()
        });
    };

    const endLiveClass = async () => {
        if (!isInstructor) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'live_sessions', classId));
    };

    const changeSlide = async (index: number) => {
        if (!isInstructor) return;
        await updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), {
            currentBlockIndex: index,
            quizState: 'waiting',
            answers: {} // Wipe previous answers
        });
    };

    const triggerQuiz = async (state: 'active' | 'revealed') => {
        if (!isInstructor) return;
        await updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), {
            quizState: state
        });
    };

    return { 
        liveState, 
        startLiveClass, 
        endLiveClass, 
        changeSlide, 
        triggerQuiz
    };
};
