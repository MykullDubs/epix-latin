// src/hooks/useMagisterData.ts
import { useState, useEffect, useMemo } from 'react';
import { auth, db, appId } from '../config/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  doc, onSnapshot, collection, addDoc, setDoc, updateDoc, 
  deleteDoc, query, where, collectionGroup, increment, arrayUnion, arrayRemove,
  orderBy, limit, getDoc, writeBatch 
} from "firebase/firestore";

export function useMagisterData() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeOrg, setActiveOrg] = useState<any>(null);
  
  const [allAppLessons, setAllAppLessons] = useState<any[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [instructorClasses, setInstructorClasses] = useState<any[]>([]); 
  
  const [allClasses, setAllClasses] = useState<any[]>([]);
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
      
      // 🔥 THE SMART DUAL-MERGE LISTENER (Bulletproofed for Mobile)
      let rootData: any = {};
      let profileData: any = {};

      const syncMergedData = () => {
          const merged = { ...rootData, ...profileData };
          
          // 1. Aggressively protect wealth
          const rootFlux = Number(rootData.flux) || 0;
          const rootCoins = Number(rootData.coins) || 0;
          const profCoins = Number(profileData.coins) || 0;
          const profFlux = Number(profileData.flux) || 0;
          
          merged.coins = Math.max(rootFlux, rootCoins, profCoins, profFlux);
          merged.flux = merged.coins; 

          // 2. Protect Inventory Arrays safely
          const rootInv = Array.isArray(rootData.inventory) ? rootData.inventory : [];
          const profInv = Array.isArray(profileData.inventory) ? profileData.inventory : [];
          merged.inventory = Array.from(new Set([...rootInv, ...profInv]));

          // 3. Protect Enrolled Classes
          const rootClasses = Array.isArray(rootData.enrolledClasses) ? rootData.enrolledClasses : [];
          const profClasses = Array.isArray(profileData.enrolledClasses) ? profileData.enrolledClasses : [];
          const classMap = new Map();
          [...rootClasses, ...profClasses].forEach(c => {
              if (c && c.id) classMap.set(c.id, c);
          });
          merged.enrolledClasses = Array.from(classMap.values());
          
          // 4. Force core auth data so the app NEVER crashes on an empty profile
          if (!merged.email && user?.email) merged.email = user.email;
          if (!merged.role) merged.role = 'student';
          
          setUserData(merged);
      };

      // Listen to Root Data
      const unsubRootUser = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid), (snap) => {
          if (snap.exists()) {
              rootData = snap.data();
          }
          syncMergedData(); // Call unconditionally
      }, (error) => {
          console.error("Root sync network error:", error);
          syncMergedData(); // Fallback on error
      });

      // Listen to Profile Data
      const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (snap) => {
          if (snap.exists()) {
              profileData = snap.data();
          }
          syncMergedData(); // Call unconditionally
          setAuthChecked(true); // Force OS Boot sequence to finish
      }, (error) => {
          console.error("Profile sync network error:", error);
          setAuthChecked(true); // Force OS Boot sequence to finish even if mobile cache blocks it
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

      const unsubAllClasses = onSnapshot(collectionGroup(db, 'classes'), (snap) => {
        const published = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((c: any) => c.isPublished === true);
        setAllClasses(published);
      });

      const unsubPublished = onSnapshot(collection(db, 'artifacts', appId, 'decks'), (snap) => {
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
          unsubAuth(); unsubRootUser(); unsubProfile(); unsubLessons(); unsubCards(); 
          unsubClasses(); unsubInstructorClasses(); unsubPublished(); 
          unsubCurriculums(); unsubLogs(); unsubCardPrefs(); unsubDeckPrefs();
          unsubAllClasses(); 
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

    purchaseItem: async (itemId: string, price: number, category: string, extraData?: any) => {
        if (!user || !user.uid) return { success: false, msg: "Auth session expired." };
        
        const currentFlux = userData?.coins || userData?.profile?.main?.coins || userData?.flux || 0; 
        
        if (currentFlux < price) {
            return { success: false, msg: "Insufficient Flux for decryption." };
        }

        const batch = writeBatch(db);
        const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        const rootUserRef = doc(db, 'artifacts', appId, 'users', user.uid);
        
        const balanceUpdate = { coins: increment(-price) };
        batch.update(userRef, balanceUpdate);
        batch.update(rootUserRef, { 'profile.main.coins': increment(-price) });
        batch.update(rootUserRef, { flux: increment(-price), coins: increment(-price) });

        batch.update(userRef, { inventory: arrayUnion(itemId) });
        batch.update(rootUserRef, { 'profile.main.inventory': arrayUnion(itemId), inventory: arrayUnion(itemId) });

        if (category === 'course' && extraData) {
            const newClass = {
                id: itemId,
                title: extraData.title || "New Course",
                subject: extraData.subject || "Elective",
                type: 'solo', 
                progressPct: 0,
                unlockedAt: Date.now()
            };
            
            batch.update(userRef, { enrolledClasses: arrayUnion(newClass) });
            batch.update(rootUserRef, { 'profile.main.enrolledClasses': arrayUnion(newClass), enrolledClasses: arrayUnion(newClass) });
        }

        const logRef = doc(collection(db, 'artifacts', appId, 'activity_logs'));
        batch.set(logRef, {
            studentId: user.uid,
            studentEmail: user.email,
            type: 'purchase',
            itemId,
            category,
            price,
            timestamp: Date.now()
        });

        try {
            await batch.commit();
            return { success: true, msg: "Asset decrypted. Check your Vault." };
        } catch (err) {
            console.error("Transaction Error:", err);
            return { success: false, msg: "Network error during transaction." };
        }
    },
    
    reorderClasses: async (newOrder: string[]) => {
      if (!user) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), {
              classOrder: newOrder
          });
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
              'profile.main.classOrder': newOrder
          }).catch(() => {});
      } catch (e) {
          console.error("Failed to save layout.", e);
      }
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

    deleteArtifact: async (id: string, type: 'lesson' | 'deck') => {
        if (!user || !id) return;
        try {
            if (type === 'lesson') {
                await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', id));
            } else if (type === 'deck') {
                await deleteDoc(doc(db, 'artifacts', appId, 'decks', id));
            }
        } catch (error) {
            console.error(`Failed to scrub ${type}:`, error);
            throw error;
        }
    },

    // 🔥 THE NEW ARTIFACT FOLDER ASSIGNER
    assignArtifactToFolder: async (artifactId: string, type: 'lesson' | 'deck', folderName: string | null) => {
        if (!user || !artifactId) return;
        try {
            if (type === 'lesson') {
                const lessonRef = doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', artifactId);
                await updateDoc(lessonRef, { folder: folderName || null, updatedAt: Date.now() });
            } else if (type === 'deck') {
                const deckRef = doc(db, 'artifacts', appId, 'decks', artifactId);
                await updateDoc(deckRef, { folder: folderName || null, updatedAt: Date.now() });
            }
        } catch (error) {
            console.error(`Failed to assign ${type} to folder:`, error);
            throw error;
        }
    },

    saveLesson: async (lessonData: any) => {
      if (!user) return;
      const lessonId = lessonData.id || `lesson_${Date.now()}`;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'custom_lessons', lessonId), {
        ...lessonData, 
        id: lessonId, 
        instructorId: user.uid, 
        appId: appId, 
        updatedAt: Date.now()
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
            stats: { cardCount: 0, totalPlays: 0, averageScore: 0 },
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
        const cardRef = isNewCard 
            ? doc(collection(db, 'artifacts', appId, 'decks', deckId, 'cards')) 
            : doc(db, 'artifacts', appId, 'decks', deckId, 'cards', cardData.id || `card_${Date.now()}`);

        const payload = {
            ...cardData,
            id: cardRef.id,
            updatedAt: Date.now()
        };

        batch.set(cardRef, payload, { merge: true });

        const deckRef = doc(db, 'artifacts', appId, 'decks', deckId);
        const deckUpdates: any = { updatedAt: Date.now() };

        if (isNewCard) {
            deckUpdates['stats.cardCount'] = increment(1);
        }

        batch.update(deckRef, deckUpdates);

        try {
            await batch.commit(); 
            return cardRef.id;
        } catch (error) {
            console.error("Batch write failed. Data integrity preserved.", error);
            throw error;
        }
    },

    updateCard: async (deckId: string, cardId: string, cardData: any) => {
        return actions.saveCard(deckId, { ...cardData, id: cardId }, false);
    },

    deleteCard: async (deckId: string, cardId: string) => {
        if (!user || !deckId || !cardId) return;

        const batch = writeBatch(db);
        const cardRef = doc(db, 'artifacts', appId, 'decks', deckId, 'cards', cardId);
        batch.delete(cardRef);

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

    // 🔥 UPGRADED: The RPG Leveling Engine & Streak Multiplier
    logActivity: async (itemId: string, baseXp: number, title: string, details: any = {}) => {
      if (!user || !user.uid) return;
      
      try {
          const today = new Date(); const todayStr = today.toDateString();
          const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1); const yesterdayStr = yesterday.toDateString();

          // 1. SAFELY EXTRACT CURRENT STATS (Handles dual-architecture profile)
          let currentStreak = userData?.streak || userData?.profile?.main?.streak || 0;
          let currentDailyXp = userData?.dailyXp || userData?.profile?.main?.dailyXp || 0;
          let currentDailyLessons = userData?.dailyLessons || userData?.profile?.main?.dailyLessons || 0;
          const lastActivityDate = userData?.lastActivityDate || userData?.profile?.main?.lastActivityDate;
          const currentTotalXp = userData?.xp || userData?.profile?.main?.xp || 0;

          // 2. THE STREAK LOGIC
          let newStreak = currentStreak;
          let newDailyXp = currentDailyXp;
          let newDailyLessons = currentDailyLessons;
          const isLesson = details.mode === 'lesson' || !itemId.includes('explore');

          if (lastActivityDate === todayStr) {
              if (isLesson) newDailyLessons += 1;
          } else if (lastActivityDate === yesterdayStr) {
              newStreak += 1; 
              newDailyXp = 0; // Reset daily caps
              newDailyLessons = isLesson ? 1 : 0;
          } else {
              newStreak = 1; // Streak broken
              newDailyXp = 0; 
              newDailyLessons = isLesson ? 1 : 0;
          }

          // 3. THE MULTIPLIER (Bonus XP based on streak, capped at +50%)
          const streakMultiplier = 1 + Math.min(newStreak * 0.1, 0.5);
          const finalXp = Math.round(baseXp * streakMultiplier);
          newDailyXp += finalXp;

          // 4. THE RPG LEVELING ENGINE (500 XP per level)
          const currentLevel = Math.floor(currentTotalXp / 500) + 1;
          const newTotalXp = currentTotalXp + finalXp;
          const newLevel = Math.floor(newTotalXp / 500) + 1;
          const didLevelUp = newLevel > currentLevel;

          // 5. ECONOMY DROPS
          let earnedFlux = Math.floor(finalXp / 5);
          if (didLevelUp) earnedFlux += 50; // HUGE bonus for hitting a new level

          // Write the receipt to the database
          await addDoc(collection(db, 'artifacts', appId, 'activity_logs'), {
            studentEmail: user.email, 
            studentName: userData?.name || user.email.split('@')[0], 
            studentId: user.uid,
            type: itemId.includes('explore') ? 'explore' : 'completion', 
            itemTitle: title, 
            itemId: itemId, 
            xp: finalXp,         // What they actually got
            baseXp: baseXp,      // What it was worth before multipliers
            streakMultiplier: streakMultiplier, 
            leveledUp: didLevelUp, // Easy flag to hook into UI celebrations later
            timestamp: Date.now(), 
            ...details
          });

          // Apply the payload to the User profile
          if (finalXp > 0) {
            const updatePayload = {
              xp: increment(finalXp), 
              coins: increment(earnedFlux), 
              streak: newStreak, 
              dailyXp: newDailyXp, 
              dailyLessons: newDailyLessons, 
              lastActivityDate: todayStr,
              level: newLevel 
            };

            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), updatePayload)
              .catch(e => console.log("Subcollection update skipped", e));

            await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
              'profile.main.xp': increment(finalXp), 
              'profile.main.coins': increment(earnedFlux), 
              'profile.main.streak': newStreak, 
              'xp': increment(finalXp),
              'flux': increment(earnedFlux),
              'level': newLevel,
              lastActivityDate: todayStr,
              dailyXp: newDailyXp
            }).catch(e => console.log("Parent doc update skipped", e));
          }
      } catch (err) {
          console.error("Critical Failure in XP Pipeline:", err);
      }
    }
  };

  const allLessons = useMemo(() => allAppLessons, [allAppLessons]);
  
  const enrichedUserData = useMemo(() => {
    if (!userData) return null;
    return {
        ...userData,
        cardPrefs,
        deckPrefs,
        classOrder: userData.classOrder || userData?.profile?.main?.classOrder || [], 
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
    actions,
    allClasses 
  };
}
