// src/utils/profileHelpers.ts
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { storage, db, appId } from "../config/firebase";

// ============================================================================
//  PROFILE PICTURE & AVATAR LOGIC (MAGISTER OS)
// ============================================================================

/**
 * Uploads a file to Firebase Storage and updates the user's Firestore profile.
 * Uses dot-notation for surgical updates and a cache-buster for instant UI refresh.
 */
export const uploadProfilePicture = async (uid: string, file: File) => {
    if (!storage) throw new Error("storage-not-initialized");

    try {
        // 1. Create unique storage path (Avatar remains in user-specific folder)
        const fileName = `avatar_${Date.now()}.jpg`;
        const storageRef = ref(storage, `artifacts/${appId}/profiles/${uid}/${fileName}`);
        
        // 2. Upload with explicit metadata
        const metadata = { contentType: 'image/jpeg' };
        const snapshot = await uploadBytes(storageRef, file, metadata);
        
        // 3. Retrieve public URL + Add Cache-Buster
        // Adding a timestamp ensures the <img> tag in UserAvatar refreshes immediately
        const rawURL = await getDownloadURL(snapshot.ref);
        const downloadURL = `${rawURL}&t=${Date.now()}`;
        
        // 4. Update Firestore using dot-notation to avoid overwriting unrelated profile data
        const userRef = doc(db, 'artifacts', appId, 'users', uid);
        
        try {
            // Standard update for existing users
            await updateDoc(userRef, {
                'profile.main.avatarUrl': downloadURL
            });
        } catch (e) {
            // Fallback: Create the document if it's the user's first time interacting with the system
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

/**
 * Helper to get clean initials from a full name (e.g., "John Doe" -> "JD")
 */
export const getInitials = (name: string = "Scholar") => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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

    // Initialize 7-day window
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
        if (!durationSecs && log.xp) durationSecs = log.xp * 18; 
        
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

    return { 
        totalHours: (totalSeconds / 3600).toFixed(1), 
        cardsMastered, 
        perfectScores, 
        graphData 
    };
};

// ============================================================================
//  GAMIFICATION ENGINE MATH
// ============================================================================

export const calculateLevel = (totalXp: number = 0, totalLikes: number = 0) => {
    // The curve multiplier. 0.05 gives a solid RPG scaling curve for an economy of 1000-5000 XP per game.
    const CONSTANT = 0.05;
    
    // Calculate total effective XP (adding a flat bonus for social engagement)
    const SOCIAL_BONUS = totalLikes * 10; 
    const combinedXp = totalXp + SOCIAL_BONUS;

    // 1. Calculate current level based on the quadratic curve
    const level = Math.floor(CONSTANT * Math.sqrt(combinedXp)) + 1;

    // 2. Calculate absolute XP boundaries for the current level bracket
    const currentLevelBaseXp = Math.pow((level - 1) / CONSTANT, 2);
    const nextLevelBaseXp = Math.pow(level / CONSTANT, 2);

    // 3. Calculate progress strictly within this level's brackets
    const currentLevelProgress = combinedXp - currentLevelBaseXp;
    const xpRequiredForNextLevel = nextLevelBaseXp - currentLevelBaseXp;

    // 4. Progress percentage for the UI squircle rings
    const progressPct = Math.min(100, Math.max(0, (currentLevelProgress / xpRequiredForNextLevel) * 100));

    return {
        level,
        currentLevelXp: Math.floor(currentLevelProgress),
        xpToNext: Math.floor(xpRequiredForNextLevel),
        progressPct,
        totalPotentialXp: combinedXp
    };
};

export const getLeagueTier = (level: number) => {
    if (level >= 100) return { name: 'Magister', color: 'text-fuchsia-500', bg: 'bg-fuchsia-100', border: 'border-fuchsia-200' };
    if (level >= 50) return { name: 'Diamond', color: 'text-cyan-500', bg: 'bg-cyan-100', border: 'border-cyan-200' };
    if (level >= 25) return { name: 'Platinum', color: 'text-teal-500', bg: 'bg-teal-100', border: 'border-teal-200' };
    if (level >= 10) return { name: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-100', border: 'border-yellow-200' };
    if (level >= 5) return { name: 'Silver', color: 'text-slate-400', bg: 'bg-slate-100', border: 'border-slate-200' };
    return { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' };
};
