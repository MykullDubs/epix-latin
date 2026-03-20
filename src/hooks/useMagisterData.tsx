// src/hooks/useMagisterData.ts
import { useState, useEffect, useMemo } from 'react';
import { auth, db, appId } from '../config/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, onSnapshot, collection, addDoc, setDoc, updateDoc, 
  deleteDoc, query, where, collectionGroup, increment, arrayUnion, arrayRemove,
  orderBy, limit, getDoc
} from "firebase/firestore";

export function useMagisterData() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeOrg, setActiveOrg] = useState<any>(null);
  
  const [allAppLessons, setAllAppLessons] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [instructorClasses, setInstructorClasses] = useState<any[]>([]); 
  
  const [customCurriculums, setCustomCurriculums] = useState<any[]>([]);
  
  const [privateDecks, setPrivateDecks] = useState<any>({ custom: { title: 'My Study Cards', cards: [] } });
  const [publishedDecks, setPublishedDecks] = useState<any[]>([]);

  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // 🔥 NEW: State for Student Preferences
  const [cardPrefs, setCardPrefs] = useState<Record<string, any>>({});
  const [deckPrefs, setDeckPrefs] = useState<Record<string, any>>({});

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserData(null);
        setCardPrefs({});
        setDeckPrefs({});
        setAuthChecked(true);
      }
    });

    if (user?.uid) {
      const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (snap) => {
        if (snap.exists()) setUserData(snap.data());
        setAuthChecked(true);
      });

      const unsubLessons = onSnapshot(collectionGroup(db, 'custom_lessons'), (snap) => {
        const fetchedLessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllAppLessons(fetchedLessons);
      });

      const unsubCards = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'custom_cards'), (snap) => {
        const cards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const decks: any = { custom: { title: 'My Study Cards', cards: [] } };
        
        cards.forEach((card: any) => {
          const dId = card.deckId || 'custom';
          if (!decks[dId]) {
            decks[dId] = { id: dId, title: card.deckTitle || 'Unnamed Deck', cards: [] };
          }
          decks[dId].cards.push(card);
        });
        setPrivateDecks(decks); 
      });

      const qClasses = query(collectionGroup(db, 'classes'), where('studentEmails', 'array-contains', user.email));
      const unsubClasses = onSnapshot(qClasses, (snap) => {
        setEnrolledClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubInstructorClasses = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), (snap) => {
        setInstructorClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubPublished = onSnapshot(collection(db, 'artifacts', appId, 'published_decks'), (snap) => {
        setPublishedDecks(snap.docs.map(d => d.data()));
      });

      const unsubCurriculums = onSnapshot(collectionGroup(db, 'custom_curriculums'), (snap) => {
        const fetchedCurriculums = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCustomCurriculums(fetchedCurriculums);
      });

      const qLogs = query(collection(db, 'artifacts', appId, 'activity_logs'), orderBy('timestamp', 'desc'), limit(20));
      const unsubLogs = onSnapshot(qLogs, (snap) => {
          setActivityLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // 🔥 NEW: Listeners for Student Deck/Card Preferences
      const unsubCardPrefs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'card_prefs'), (snap) => {
          const prefs: Record<string, any> = {};
          snap.docs.forEach(d => { prefs[d.id] = d.data(); });
          setCardPrefs(prefs);
      });

      const unsubDeckPrefs = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'deck_prefs'), (snap) => {
          const prefs: Record<string, any> = {};
          snap.docs.forEach(d => { prefs[d.id] = d.data(); });
          setDeckPrefs(prefs);
      });

      return () => { 
          unsubAuth(); unsubProfile(); unsubLessons(); unsubCards(); 
          unsubClasses(); unsubInstructorClasses(); unsubPublished(); 
          unsubCurriculums(); unsubLogs(); unsubCardPrefs(); unsubDeckPrefs();
      };
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

  const allDecks = useMemo(() => {
      const merged = { ...privateDecks };
      const myClassIds = enrolledClasses.map(c => c.id);

      publishedDecks.forEach(pubDeck => {
          const isPublic = pubDeck.visibility === 'public';
          const isInstructor = pubDeck.instructorId === user?.uid;
          const isRestrictedAccess = pubDeck.visibility === 'restricted' && 
                                     pubDeck.allowedClasses?.some((id: string) => myClassIds.includes(id));

          if (isPublic || isInstructor || isRestrictedAccess) {
              merged[pubDeck.id] = { ...pubDeck, isPublished: true };
          }
      });

      return merged;
  }, [privateDecks, publishedDecks, enrolledClasses, user?.uid]);

  const actions = {
    logout: () => signOut(auth),
    
    // 🔥 NEW: Leech Management (Toggle Star)
    toggleCardStar: async (cardId: string, currentStatus: boolean) => {
        if (!user) return;
        const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'card_prefs', cardId);
        await setDoc(prefRef, { starred: !currentStatus }, { merge: true });
    },

    // 🔥 NEW: Archive Deck
    toggleDeckArchive: async (deckId: string, currentStatus: boolean) => {
        if (!user) return;
        const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'deck_prefs', deckId);
        await setDoc(prefRef, { archived: !currentStatus }, { merge: true });
    },
    
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

    removeStudent: async (classId: string, studentEmail: string) => {
      if (!user) return;
      try {
        const classRef = doc(db, 'artifacts', appId, 'users', user.uid, 'classes', classId);
        const classSnap = await getDoc(classRef);
        
        if (classSnap.exists()) {
          const data = classSnap.data();
          const studentToRemove = data.students?.find((s: any) => s.email === studentEmail);
          
          await updateDoc(classRef, {
            studentEmails: arrayRemove(studentEmail),
            ...(studentToRemove ? { students: arrayRemove(studentToRemove) } : {})
          });
        }
      } catch (err) {
        console.error("Decommission protocol failed:", err);
      }
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

    updateCard: async (cardId: string, cardData: any) => {
      if (!user) return;
      const cardRef = doc(db, 'artifacts', appId, 'users', user.uid, 'custom_cards', cardId);
      await updateDoc(cardRef, cardData);
    },

    publishDeck: async (deckId: string, deckTitle: string, cards: any[], visibility: 'private' | 'restricted' | 'public', allowedClasses: string[] = []) => {
      if (!user) return;
      const deckRef = doc(db, 'artifacts', appId, 'published_decks', deckId);
      
      if (visibility === 'private') {
          await deleteDoc(deckRef).catch(e => console.log("Deck already private"));
      } else {
          await setDoc(deckRef, {
              id: deckId, title: deckTitle, cards: cards,
              instructorId: user.uid, instructorName: userData?.name || 'Instructor',
              visibility: visibility, allowedClasses: allowedClasses, updatedAt: Date.now()
          });
      }
    },

    saveCurriculum: async (curriculumData: any) => {
      if (!user) return;
      const currId = curriculumData.id || `curriculum_${Date.now()}`;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_curriculums', currId), {
        ...curriculumData, 
        id: currId, 
        instructorId: user.uid, 
        updatedAt: Date.now()
      });
    },

    logActivity: async (itemId: string, xp: number, title: string, details: any = {}) => {
      if (!user || !user.uid) return;
      
      try {
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
            studentEmail: user.email, studentName: userData?.name || user.email.split('@')[0], studentId: user.uid,
            type: itemId.includes('explore') ? 'explore' : 'completion', itemTitle: title, itemId: itemId, 
            xp: xp, timestamp: Date.now(), ...details
          });

          if (xp > 0) {
            const today = new Date(); const todayStr = today.toDateString();
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1); const yesterdayStr = yesterday.toDateString();

            let newStreak = userData?.streak || 0;
            let newDailyXp = userData?.dailyXp || 0;
            let newDailyLessons = userData?.dailyLessons || 0;
            const lastActivityDate = userData?.lastActivityDate;

            const isLesson = details.mode === 'lesson' || !itemId.includes('explore');

            if (lastActivityDate === todayStr) {
                newDailyXp += xp; if (isLesson) newDailyLessons += 1;
            } else if (lastActivityDate === yesterdayStr) {
                newStreak += 1; newDailyXp = xp; newDailyLessons = isLesson ? 1 : 0;
            } else {
                newStreak = 1; newDailyXp = xp; newDailyLessons = isLesson ? 1 : 0;
            }

            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              xp: increment(xp), streak: newStreak, dailyXp: newDailyXp, dailyLessons: newDailyLessons, lastActivityDate: todayStr
            }).catch(e => console.log("Subcollection update skipped", e));

            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
              'profile.main.xp': increment(xp), 'profile.main.streak': newStreak, 'xp': increment(xp)
            }).catch(e => console.log("Parent doc update skipped", e));
          }
      } catch (err) {
          console.error("Critical Failure in XP Pipeline:", err);
      }
    }
  };

  const allLessons = useMemo(() => allAppLessons, [allAppLessons]);
  
  // 🔥 DYNAMIC USER DATA ENRICHMENT: Bundles prefs into the userData object!
  const enrichedUserData = useMemo(() => {
    if (!userData) return null;
    return {
        ...userData,
        cardPrefs,
        deckPrefs
    };
  }, [userData, cardPrefs, deckPrefs]);

  return { 
    user, 
    userData: enrichedUserData, 
    authChecked, 
    activeOrg, 
    allLessons, 
    enrolledClasses, 
    instructorClasses, 
    allDecks, 
    customCurriculums, 
    activityLogs, 
    actions 
  };
}
