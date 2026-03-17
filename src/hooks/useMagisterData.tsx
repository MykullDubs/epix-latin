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
      // 1. Monitor User Profile (XP, Streaks, Roles)
      const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (snap) => {
        if (snap.exists()) setUserData(snap.data());
        setAuthChecked(true);
      });

      // 2. Magic Vacuum: Pull all lessons available in this appId
      const unsubLessons = onSnapshot(collectionGroup(db, 'custom_lessons'), (snap) => {
        const fetchedLessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllAppLessons(fetchedLessons);
      });

      // 3. Card & Deck Logic: Sorts cards into their respective custom deck containers
      const unsubCards = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards'), (snap) => {
        const cards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const decks: any = { custom: { title: 'Scriptorium', cards: [] } };
        
        cards.forEach((card: any) => {
          const dId = card.deckId || 'custom';
          if (!decks[dId]) {
            decks[dId] = { id: dId, title: card.deckTitle || 'Unnamed Deck', cards: [] };
          }
          decks[dId].cards.push(card);
        });
        setAllDecks(decks);
      });

      // 4. Classes (Student View)
      const qClasses = query(collectionGroup(db, 'classes'), where('studentEmails', 'array-contains', user.email));
      const unsubClasses = onSnapshot(qClasses, (snap) => {
        setEnrolledClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // 5. Classes (Instructor View)
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
    // THE STREAK & XP ENGINE (Now with Real-Time Jamming)
    // ==========================================
    logActivity: async (itemId: string, xp: number, title: string, details: any = {}) => {
      if (!user || !user.uid) return;
      
      try {
          // 1. Push to Activity Log (The Timeline)
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
            studentEmail: user.email,
            studentName: userData?.name || user.email.split('@')[0],
            studentId: user.uid,
            type: itemId.includes('explore') ? 'explore' : 'completion',
            itemTitle: title,
            itemId: itemId, 
            xp: xp,
            timestamp: Date.now(),
            ...details
          });

          // 2. Perform Gamification Math
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

            // 3. Update the User's Main Profile (Atomic Increment)
            
            // A. Update the subcollection (for the student's personal Profile View)
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              xp: increment(xp),
              streak: newStreak,
              dailyXp: newDailyXp,
              dailyLessons: newDailyLessons,
              lastActivityDate: todayStr
            }).catch(e => console.log("Subcollection update skipped", e));

            // 🔥 B. THE FIX: Update the parent document's nested map (for the Leaderboard View!)
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
              'profile.main.xp': increment(xp),
              'profile.main.streak': newStreak,
              'xp': increment(xp) // Backup flat field just to be bulletproof
            }).catch(e => console.log("Parent doc update skipped", e));
          }
      } catch (err) {
          console.error("Critical Failure in XP Pipeline:", err);
      }
    }
  };

  const allLessons = useMemo(() => allAppLessons, [allAppLessons]);

  return { user, userData, authChecked, activeOrg, allLessons, enrolledClasses, instructorClasses, allDecks, actions };
}
