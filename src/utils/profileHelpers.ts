import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db, appId } from "../config/firebase";

// ============================================================================
//  PROFILE PICTURE & AVATAR LOGIC
// ============================================================================

/**
 * Uploads a file to Firebase Storage and updates the user's Firestore profile.
 */
export const uploadProfilePicture = async (uid: string, file: File) => {
    // 1. Create a unique reference in the 'profiles' folder
    const storageRef = ref(storage, `artifacts/${appId}/profiles/${uid}_${Date.now()}`);
    
    // 2. Upload the raw file blob
    const snapshot = await uploadBytes(storageRef, file);
    
    // 3. Retrieve the permanent public URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // 4. Update the user's specific Firestore document
    const userRef = doc(db, 'artifacts', appId, 'users', uid);
    await updateDoc(userRef, {
        'profile.main.avatarUrl': downloadURL
    });

    return downloadURL;
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

    // Initialize last 7 days for the graph
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
        if (!durationSecs && log.xp) {
            durationSecs = log.xp * 18; // Est: 1 XP = ~18 seconds
        }

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
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const mins = Math.round(timeByDay[dateStr] / 60);
        
        return {
            day: dayName,
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
//  GAMIFICATION ENGINE MATH (MAGISTER OS)
// ============================================================================

/**
 * Enhanced Level Calculation: Includes Social Star (Forum Likes) bonus
 */
export const calculateLevel = (totalXp: number = 0, totalLikes: number = 0) => {
    const XP_PER_LEVEL = 500;
    const SOCIAL_BONUS = totalLikes * 10; // 10 XP per "Appreciation" received
    
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
