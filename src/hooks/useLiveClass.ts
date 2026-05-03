// src/hooks/useLiveClass.ts
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export const useLiveClass = (classId: string, isInstructor: boolean = false) => {
    const [liveState, setLiveState] = useState<any>(null);

    useEffect(() => {
        if (!classId) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
            if (docSnap.exists()) setLiveState(docSnap.data());
            else setLiveState(null);
        });
        return () => unsubscribe();
    }, [classId]);

    // --- INSTRUCTOR CONTROLS ---
    const startLiveClass = async (lessonId: string, type: 'lesson' | 'vocab' = 'lesson', initialQuestion: any = null) => {
        if (!isInstructor || !classId) return;
        const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
        await setDoc(sessionRef, {
            lessonId,
            type, // 'lesson' or 'vocab'
            currentBlockIndex: 0,
            currentQuestion: initialQuestion, // Dynamic payload for Vocab games
            quizState: 'waiting', 
            answers: {}, 
            timestamp: Date.now()
        });
    };

    const endLiveClass = async () => {
        if (!isInstructor || !classId) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'live_sessions', classId));
    };

    const changeSlide = async (index: number, questionPayload: any = null) => {
        if (!isInstructor || !classId) return;
        await updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), {
            currentBlockIndex: index,
            currentQuestion: questionPayload, // Broadcast new question
            quizState: 'waiting',
            answers: {} 
        });
    };

    const triggerQuiz = async (state: 'active' | 'revealed') => {
        if (!isInstructor || !classId) return;
        await updateDoc(doc(db, 'artifacts', appId, 'live_sessions', classId), {
            quizState: state
        });
    };

    // 🔥 ADDED: General state updater for interactive games (Scrabble, etc.)
    const updateLiveState = async (updates: any) => {
        if (!classId) return;
        try {
            const sessionRef = doc(db, 'artifacts', appId, 'live_sessions', classId);
            // setDoc with { merge: true } safely pushes partial updates (like new scores or board states)
            await setDoc(sessionRef, updates, { merge: true }); 
        } catch (error) {
            console.error("Error updating live state:", error);
        }
    };

    // Make sure updateLiveState is exported here!
    return { liveState, startLiveClass, endLiveClass, changeSlide, triggerQuiz, updateLiveState };
};
