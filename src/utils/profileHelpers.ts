import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore"; // Changed from updateDoc to setDoc
import { storage, db, appId } from "../config/firebase";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { storage, db, appId } from "../config/firebase";

// ============================================================================
//  PROFILE PICTURE & AVATAR LOGIC (MAGISTER OS)
// ============================================================================

export const uploadProfilePicture = async (uid: string, file: File) => {
    if (!storage) throw new Error("storage-not-initialized");

    try {
        // 1. Create unique storage path
        const fileName = `avatar_${Date.now()}.jpg`;
        const storageRef = ref(storage, `artifacts/${appId}/profiles/${uid}/${fileName}`);
        
        // 2. Upload with explicit metadata
        const metadata = { contentType: 'image/jpeg' };
        const snapshot = await uploadBytes(storageRef, file, metadata);
        
        // 3. Retrieve public URL + Add Cache-Buster
        // Adding a timestamp ensures the <img> tag refreshes immediately
        const rawURL = await getDownloadURL(snapshot.ref);
        const downloadURL = `${rawURL}&t=${Date.now()}`;
        
        // 4. THE FIX: Use Dot-Notation for the update
        // This ensures Firestore targets the specific nested field correctly
        const userRef = doc(db, 'artifacts', appId, 'users', uid);
        
        try {
            // Try updating just the specific field first (most efficient)
            await updateDoc(userRef, {
                'profile.main.avatarUrl': downloadURL
            });
        } catch (e) {
            // Fallback: If the doc doesn't exist, create it with setDoc merge
            await setDoc(userRef, {
                profile: {
                    main: {
                        avatarUrl: downloadURL
                    }
                }
            }, { merge: true });
        }

        return downloadURL;
    } catch (error: any) {
        console.error("Firebase Mastery Error:", error.code);
        throw error;
    }
};

// ============================================================================
//  STATS & ANALYTICS ENGINE
// ============================================================================

export const calculateUserStats = (logs: any[]) => {
    let totalSeconds = 0;
    let cardsMastered = 0;
    let perfectScores = 0;
    const activityByDay: any = {};
    const timeByDay: any = {}; 

    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toDateString(); 
        activityByDay[dateStr] = 0;
        timeByDay[dateStr] = 0;
    }

    logs.forEach(log => {
        const dateKey = new Date(log.timestamp).toDateString();
        let durationSecs = log.duration || 0;
        if (!durationSecs && log.xp) durationSecs = log.xp * 18; // Est duration
        
        if (timeByDay[dateKey] !== undefined) {
            activityByDay[dateKey] += (log.xp || 0);
            timeByDay[dateKey] += durationSecs;
        }
        totalSeconds += durationSecs;
        
        if (log.type === 'completion' && log.scoreDetail?.finalScorePct === 100) perfectScores++;
        if (log.type === 'self_study') cardsMastered += 1; 
    });

    const graphData = Object.keys(activityByDay).map(dateStr => {
        const d = new Date(dateStr);
        const mins = Math.round(timeByDay[dateStr] / 60);
        return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            xp: activityByDay[dateStr],
            minutes: mins,
            height: mins > 0 ? Math.min(100, Math.max(10, (mins / 60) * 100)) : 0
        };
    });

    return { totalHours: (totalSeconds / 3600).toFixed(1), cardsMastered, perfectScores, graphData };
};

// ============================================================================
//  GAMIFICATION ENGINE MATH
// ============================================================================

export const calculateLevel = (totalXp: number = 0, totalLikes: number = 0) => {
    const XP_PER_LEVEL = 500;
    const SOCIAL_BONUS = totalLikes * 10; // 10 XP per Star received
    const combinedXp = totalXp + SOCIAL_BONUS;
    
    const level = Math.floor(combinedXp / XP_PER_LEVEL) + 1;
    const currentLevelXp = combinedXp % XP_PER_LEVEL;
    const progressPct = Math.round((currentLevelXp / XP_PER_LEVEL) * 100);

    return { 
        level, 
        currentLevelXp, 
        xpToNext: XP_PER_LEVEL, 
        progressPct,
        totalPotentialXp: combinedXp 
    };
};

export const getLeagueTier = (level: number) => {
    if (level < 5) return { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' };
    if (level < 15) return { name: 'Silver', color: 'text-slate-400', bg: 'bg-slate-100', border: 'border-slate-200' };
    if (level < 30) return { name: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-50', border: 'border-cyan-200' };
};
