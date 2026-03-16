// src/hooks/useMagisterData.ts
import { useState, useEffect, useMemo } from 'react';
import { auth, db, appId } from '../config/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, onSnapshot, collection, addDoc, setDoc, updateDoc, 
  deleteDoc, query, where, collectionGroup, increment, arrayUnion, arrayRemove 
} from "firebase/firestore";

export function useMagisterData() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeOrg, setActiveOrg] = useState<any>(null);
  
  // FIX 1: Replaced customLessons with a global lesson state
  const [allAppLessons, setAllAppLessons] = useState<any[]>([]);
  
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [instructorClasses, setInstructorClasses] = useState<any[]>([]); 
  const [allDecks, setAllDecks] = useState<any>({ custom: { title: 'Scriptorium', cards: [] } });

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

      // FIX 2: The Magic Vacuum! collectionGroup pulls ALL lessons from ALL instructors
      // so students can actually see the curriculum the teacher deployed.
      const unsubLessons = onSnapshot(collectionGroup(db, 'custom_lessons'), (snap) => {
        const fetchedLessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllAppLessons(fetchedLessons);
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

  useEffect(() => {
    if (userData?.orgId && userData.orgId !== 'global') {
      const unsubOrg = onSnapshot(doc(db, 'artifacts', appId, 'organizations', userData.orgId), (snap) => {
        if (snap.exists()) setActiveOrg({ id: snap.id, ...snap.data() });
      });
      return () => unsubOrg();
    } else {
      setActiveOrg(null);
    }
  }, [userData?.orgId]);

  // --- REFACTORED ACTIONS ---
  const actions = {
    logout: () => signOut(auth),
    
    createClass: async (className: string) => {
      if (!user) return;
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), {
        name: className, 
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        students: [], studentEmails: [], assignments: [], created: Date.now()
      });
    },

    deleteClass: async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id));
    },

    renameClass: async (id: string, newName: string) => {
      if (!user) return;
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id), { name: newName });
    },

    updateClassDescription: async (id: string, description: string) => {
      if (!user) return;
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id), { description });
    },

    addStudent: async (classId: string, email: string) => {
      if (!user) return;
      const cleanEmail = email.toLowerCase().trim();
      const classRef = doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId);
      await updateDoc(classRef, {
        students: arrayUnion({ email: cleanEmail, name: null, uid: null }),
        studentEmails: arrayUnion(cleanEmail)
      });
    },

    assignContent: async (classId: string, assignmentId: any) => {
      if (!user) return;
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), {
        assignments: arrayUnion(assignmentId)
      });
    },

    revokeContent: async (classId: string, assignmentId: any) => {
      if (!user) return;
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), {
        assignments: arrayRemove(assignmentId)
      });
    },

    assignCurriculum: async (classId: string, curriculumId: string) => {
      if (!user) return;
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId), {
        assignedCurriculums: arrayUnion(curriculumId)
      });
    },

    saveLesson: async (lessonData: any) => {
      if (!user) return;
      const lessonId = lessonData.id || `lesson_${Date.now()}`;
      // Added appId to payload to future-proof the collectionGroup query
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', lessonId), {
        ...lessonData, id: lessonId, instructorId: user.uid, appId: appId, updatedAt: Date.now()
      });
    },

    saveCard: async (cardData: any) => {
      if (!user) return;
      const cardId = cardData.id || `card_${Date.now()}`;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId), { 
        ...cardData, id: cardId, owner: user.uid 
      });
    },

    // ==========================================
    // THE STREAK & XP ENGINE
    // ==========================================
    logActivity: async (itemId: string, xp: number, title: string, details: any = {}) => {
      if (!user) return;
      
      // 1. Save the activity for the timeline
      await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
        studentEmail: user.email,
        studentName: userData?.name || user.email.split('@')[0],
        type: itemId.includes('explore') ? 'explore' : 'completion',
        itemTitle: title,
        itemId: itemId, 
        xp: xp,
        timestamp: Date.now(),
        ...details
      });

      // 2. Calculate Gamification Math
      if (xp > 0) {
        const today = new Date();
        const todayStr = today.toDateString();
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        let newStreak = userData?.streak || 0;
        let newDailyXp = userData?.dailyXp || 0;
        let newDailyLessons = userData?.dailyLessons || 0;
        const lastActivityDate = userData?.lastActivityDate;

        const isLesson = details.mode === 'lesson' || !itemId.includes('explore');

        if (lastActivityDate === todayStr) {
            newDailyXp += xp;
            if (isLesson) newDailyLessons += 1;
        } else if (lastActivityDate === yesterdayStr) {
            newStreak += 1;
            newDailyXp = xp;
            newDailyLessons = isLesson ? 1 : 0;
        } else {
            newStreak = 1;
            newDailyXp = xp;
            newDailyLessons = isLesson ? 1 : 0;
        }

        // 3. Update the User's Main Profile
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
          xp: increment(xp),
          streak: newStreak,
          dailyXp: newDailyXp,
          dailyLessons: newDailyLessons,
          lastActivityDate: todayStr
        });
      }
    }
  };

  // FIX 3: Removed the array corruption! We just pass the clean, fully-populated objects directly.
  const allLessons = useMemo(() => {
    return allAppLessons;
  }, [allAppLessons]);

  return { 
    user, 
    userData, 
    authChecked, 
    activeOrg, 
    allLessons, 
    enrolledClasses, 
    instructorClasses, 
    allDecks, 
    actions 
  };
}
