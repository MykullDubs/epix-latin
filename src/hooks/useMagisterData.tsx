// src/hooks/useMagisterData.ts
import { useState, useEffect, useMemo } from 'react';
import { auth, db, appId } from '../config/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, onSnapshot, collection, addDoc, setDoc, updateDoc, 
  deleteDoc, query, where, collectionGroup, increment, arrayUnion, arrayRemove,
  orderBy, limit, getDoc, writeBatch // 🔥 INJECTED writeBatch
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

  // State for Student Preferences
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

      // 🔥 Note: You will eventually update this listener to point to the new 'decks' collection!
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

      // Listeners for Student Deck/Card Preferences
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
              const isHidden = deckPrefs[pubDeck.id]?.hidden;
              if (!isHidden) {
                  merged[pubDeck.id] = { ...pubDeck, isPublished: true };
              }
          }
      });

      Object.keys(merged).forEach(key => {
          if (deckPrefs[key]?.hidden) delete merged[key];
      });

      return merged;
  }, [privateDecks, publishedDecks, enrolledClasses, user?.uid, deckPrefs]);

  const actions = {
    logout: () => signOut(auth),
    
    // 🔥 FOLDER MANAGEMENT
    createStudyFolder: async (folderName: string, color: string = 'indigo') => {
        if (!user) return;
        const cleanName = folderName.trim();
        if (!cleanName) return;

        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        
        await updateDoc(profileRef, {
            studyFolders: arrayUnion(cleanName),
            [`folderColors.${cleanName}`]: color
        }).catch(e => console.log("Subcollection update skipped", e));

        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
            'profile.main.studyFolders': arrayUnion(cleanName)
        }).catch(e => console.log("Parent doc update skipped", e));
    },

    updateStudyFolder: async (oldName: string, newName: string, color: string) => {
        if (!user) return;
        const cleanOld = oldName.trim();
        const cleanNew = newName.trim();
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');

        await setDoc(profileRef, { folderColors: { [cleanNew || cleanOld]: color } }, { merge: true });

        if (cleanNew && cleanNew !== cleanOld) {
            await updateDoc(profileRef, { studyFolders: arrayRemove(cleanOld) });
            await updateDoc(profileRef, { studyFolders: arrayUnion(cleanNew) });
            
            const decksToUpdate = Object.keys(deckPrefs).filter(k => deckPrefs[k].folder === cleanOld);
            for (const dId of decksToUpdate) {
                const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'deck_prefs', dId);
                await setDoc(prefRef, { folder: cleanNew }, { merge: true });
            }
        }
    },

    deleteStudyFolder: async (folderName: string) => {
        if (!user) return;
        const cleanName = folderName.trim();
        
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
            studyFolders: arrayRemove(cleanName)
        });

        const decksInFolder = Object.keys(deckPrefs).filter(k => deckPrefs[k].folder === cleanName);
        for (const dId of decksInFolder) {
            const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'deck_prefs', dId);
            await setDoc(prefRef, { folder: null }, { merge: true });
        }
    },

    assignDeckToFolder: async (deckId: string, folderName: string | null) => {
        if (!user) return;
        const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'deck_prefs', deckId);
        await setDoc(prefRef, { folder: folderName }, { merge: true });
    },

    // 🔥 DECK PREFERENCES
    toggleCardStar: async (cardId: string, currentStatus: boolean) => {
        if (!user) return;
        const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'card_prefs', cardId);
        await setDoc(prefRef, { starred: !currentStatus }, { merge: true });
    },

    toggleDeckArchive: async (deckId: string, currentStatus: boolean) => {
        if (!user) return;
        const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'deck_prefs', deckId);
        await setDoc(prefRef, { archived: !currentStatus }, { merge: true });
    },

    hideDeck: async (deckId: string) => {
        if (!user) return;
        const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'deck_prefs', deckId);
        await setDoc(prefRef, { hidden: true }, { merge: true });
    },

    // 🔥 ECONOMY VAULT
    purchaseUnlock: async (itemId: string, price: number) => {
        if (!user || !user.uid) return false;
        const currentCoins = userData?.profile?.main?.coins || userData?.coins || 0;
        
        if (currentCoins < price) return false;

        try {
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
                coins: increment(-price)
            });
            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
                'profile.main.coins': increment(-price)
            });

            const prefRef = doc(db, 'artifacts', appId, 'users', user.uid, 'unlocks', itemId);
            await setDoc(prefRef, { unlockedAt: Date.now(), pricePaid: price });

            return true;
        } catch (err) {
            console.error("Transaction failed:", err);
            return false;
        }
    },
    
    // STANDARD CLASS/CONTENT MANAGEMENT
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

    // ========================================================================
    // 🔥 ENTERPRISE CONTENT MANAGEMENT (DECKS & CARDS)
    // ========================================================================

    createDeck: async (deckData: any) => {
        if (!user) return;
        const deckRef = doc(collection(db, 'artifacts', appId, 'decks'));
        
        const newDeck = {
            id: deckRef.id,
            title: deckData.title || "New Protocol",
            description: deckData.description || "",
            subject: deckData.subject || "General",
            tags: deckData.tags || [],
            authorId: user.uid,
            authorName: userData?.name || "Magister",
            isPublic: deckData.isPublic || false,
            status: "draft", 
            version: 1,
            stats: {
                cardCount: 0,
                totalPlays: 0,
                averageScore: 0
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        try {
            await setDoc(deckRef, newDeck);
            return deckRef.id;
        } catch (error) {
            console.error("Failed to initialize deck payload:", error);
            throw error;
        }
    },

    saveCard: async (deckId: string, cardData: any, isNewCard: boolean = true) => {
        if (!user || !deckId) return;

        const batch = writeBatch(db);
        
        // 1. Point to the specific card inside the subcollection
        const cardRef = isNewCard 
            ? doc(collection(db, 'artifacts', appId, 'decks', deckId, 'cards')) 
            : doc(db, 'artifacts', appId, 'decks', deckId, 'cards', cardData.id || `card_${Date.now()}`);

        const payload = {
            ...cardData,
            id: cardRef.id,
            updatedAt: Date.now()
        };

        // Add the card write to the batch
        batch.set(cardRef, payload, { merge: true });

        // 2. Point to the Parent Deck to update the metadata
        const deckRef = doc(db, 'artifacts', appId, 'decks', deckId);
        const deckUpdates: any = { updatedAt: Date.now() };

        // Only increment the total card count if this is a brand NEW card
        if (isNewCard) {
            deckUpdates['stats.cardCount'] = increment(1);
        }

        batch.update(deckRef, deckUpdates);

        try {
            await batch.commit(); // FIRE THE BATCH!
            return cardRef.id;
        } catch (error) {
            console.error("Batch write failed. Data integrity preserved.", error);
            throw error;
        }
    },

    updateCard: async (deckId: string, cardId: string, cardData: any) => {
        // Reroute to the new batch logic
        return actions.saveCard(deckId, { ...cardData, id: cardId }, false);
    },

    deleteCard: async (deckId: string, cardId: string) => {
        if (!user || !deckId || !cardId) return;

        const batch = writeBatch(db);
        
        // Queue the deletion
        const cardRef = doc(db, 'artifacts', appId, 'decks', deckId, 'cards', cardId);
        batch.delete(cardRef);

        // Queue the parent count decrement
        const deckRef = doc(db, 'artifacts', appId, 'decks', deckId);
        batch.update(deckRef, {
            'stats.cardCount': increment(-1),
            updatedAt: Date.now()
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Failed to scrub data:", error);
            throw error;
        }
    },

    publishDeck: async (deckId: string, deckTitle: string, visibility: 'private' | 'restricted' | 'public', allowedClasses: string[] = []) => {
        if (!user || !deckId) return;

        // In the new architecture, the cards are already safely in the subcollection.
        // We just update the parent document to switch its state!
        const deckRef = doc(db, 'artifacts', appId, 'decks', deckId);
        
        try {
            await updateDoc(deckRef, {
                title: deckTitle,
                visibility: visibility,
                allowedClasses: allowedClasses,
                status: "published",
                version: increment(1),
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error("Publishing sequence failed:", error);
            throw error;
        }
    },

    // ========================================================================
    //  TELEMETRY & LOGGING
    // ========================================================================

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

            // 🔥 ECONOMY ENGINE: Earn 1 Flux for every 5 XP (Minting)
            const earnedFlux = Math.floor(xp / 5);

            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              xp: increment(xp), 
              coins: increment(earnedFlux), 
              streak: newStreak, 
              dailyXp: newDailyXp, 
              dailyLessons: newDailyLessons, 
              lastActivityDate: todayStr
            }).catch(e => console.log("Subcollection update skipped", e));

            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
              'profile.main.xp': increment(xp), 
              'profile.main.coins': increment(earnedFlux), 
              'profile.main.streak': newStreak, 
              'xp': increment(xp)
            }).catch(e => console.log("Parent doc update skipped", e));
          }
      } catch (err) {
          console.error("Critical Failure in XP Pipeline:", err);
      }
    }
  };

  const allLessons = useMemo(() => allAppLessons, [allAppLessons]);
  
  // 🔥 DYNAMIC USER DATA ENRICHMENT
  const enrichedUserData = useMemo(() => {
    if (!userData) return null;
    return {
        ...userData,
        cardPrefs,
        deckPrefs,
        studyFolders: userData.studyFolders || userData?.profile?.main?.studyFolders || [],
        folderColors: userData.folderColors || userData?.profile?.main?.folderColors || {}
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
