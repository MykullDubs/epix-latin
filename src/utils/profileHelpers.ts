// src/utils/profileHelpers.ts

export const calculateUserStats = (logs: any[]) => {
    let totalSeconds = 0;
    let cardsMastered = 0;
    let perfectScores = 0;
    const activityByDay: any = {};

    // Initialize last 7 days
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        activityByDay[d.toLocaleDateString()] = 0;
    }

    logs.forEach(log => {
        // Time
        if (log.type === 'time_log') totalSeconds += (log.duration || 0);
        
        // Activity Graph
        const dateKey = new Date(log.timestamp).toLocaleDateString();
        if (activityByDay[dateKey] !== undefined) {
            activityByDay[dateKey] += (log.xp || 10);
        }

        // Achievements
        if (log.type === 'completion' && log.scoreDetail?.finalScorePct === 100) perfectScores++;
        if (log.type === 'self_study') cardsMastered += 1; // Approx
    });

    const graphData = Object.keys(activityByDay).map(date => ({
        date: date.split('/')[0] + '/' + date.split('/')[1], // Short date
        xp: activityByDay[date],
        height: Math.min(100, Math.max(10, (activityByDay[date] / 200) * 100)) // Scale to 100px max
    }));

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

export const calculateLevel = (totalXp: number = 0) => {
    // A simple scaling curve. Every 500 XP is a new level.
    const XP_PER_LEVEL = 500;
    
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    const currentLevelXp = totalXp % XP_PER_LEVEL;
    const progressPct = Math.round((currentLevelXp / XP_PER_LEVEL) * 100);

    return { 
        level, 
        currentLevelXp, 
        xpToNext: XP_PER_LEVEL, 
        progressPct 
    };
};

export const getLeagueTier = (level: number) => {
    if (level < 5) return { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' };
    if (level < 15) return { name: 'Silver', color: 'text-slate-400', bg: 'bg-slate-100', border: 'border-slate-200' };
    if (level < 30) return { name: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { name: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-50', border: 'border-cyan-200' };
};
