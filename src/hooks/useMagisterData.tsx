// src/hooks/useMagisterData.ts
import { useState, useEffect, useMemo, useRef } from 'react';
import { auth, db, appId } from '../config/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, onSnapshot, collection, addDoc, setDoc, updateDoc, 
  deleteDoc, query, where, collectionGroup, orderBy, limit, increment, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { GLOBAL_CURRICULUMS } from '../constants/curriculums';

export function useMagisterData() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeOrg, setActiveOrg] = useState<any>(null);
  
  const [customLessons, setCustomLessons] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [instructorClasses, setInstructorClasses] = useState<any[]>([]); 
  const [allDecks, setAllDecks] = useState<any>({ custom: { title: 'Scriptorium', cards: [] } });

  // Authentication & Profile Sync
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserData(null);
        setAuthChecked(true);
      }
    });

    if (user?.uid) {
      const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (snap) => {
        if (snap.exists()) setUserData(snap.data());
        setAuthChecked(true);
      });

      const unsubLessons = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons'), (snap) => {
        setCustomLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubCards = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards'), (snap) => {
        const cards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllDecks((prev: any) => ({ ...prev, custom: { ...prev.custom, cards } }));
      });

      const qClasses = query(collectionGroup(db, 'classes'), where('studentEmails', 'array-contains', user.email));
      const unsubClasses = onSnapshot(qClasses, (snap) => {
        setEnrolledClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubInstructorClasses = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), (snap) => {
        setInstructorClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubAuth(); unsubProfile(); unsubLessons(); unsubCards(); unsubClasses(); unsubInstructorClasses(); };
    }
    return () => unsubAuth();
  }, [user?.uid, user?.email]);

  // Tenant/Org Sync
  useEffect(() => {
    if (userData?.orgId && userData.orgId !== 'global') {
      return onSnapshot(doc(db, 'artifacts', appId, 'organizations', userData.orgId), (snap) => {
        if (snap.exists()) setActiveOrg({ id: snap.id, ...snap.data() });
      });
    } else {
      setActiveOrg(null);
    }
  }, [userData?.orgId]);

  // --- ACTIONS ---
  const actions = {
    logout: () => signOut(auth),
    
    createClass: async (name: string) => {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), {
            name, code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            students: [], studentEmails: [], assignments: [], created: Date.now()
        });
    },

    saveLesson: async (data: any) => {
        const id = data.id || `lesson_${Date.now()}`;
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id), {
            ...data, id, instructorId: user.uid, updatedAt: Date.now()
        });
    },

    logActivity: async (itemId: string, xp: number, title: string, details: any = {}) => {
        await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
            studentEmail: user.email,
            studentName: userData?.name || user.email.split('@')[0],
            type: itemId === 'explore_deck' ? 'explore' : 'completion',
            activityType: details.mode || 'general',
            itemTitle: title, itemId, xp, timestamp: Date.now(), ...details
        });
        if (xp > 0) {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), { xp: increment(xp) });
        }
    },
    
    // Add the rest of your handlers here (handleAssign, handleAddStudent, etc.)
  };

  return { 
    user, userData, authChecked, activeOrg, 
    customLessons, enrolledClasses, instructorClasses, allDecks, 
    actions 
  };
}
