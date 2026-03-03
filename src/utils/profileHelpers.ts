// src/utils/profileHelpers.ts

export const calculateUserStats = (logs: any[]) => {
    let totalSeconds = 0;
    let cardsMastered = 0;
    let perfectScores = 0;
    
    const activityByDay: any = {};
    const timeByDay: any = {}; 

    // Initialize last 7 days so empty days still show up on the graph
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toDateString(); 
        activityByDay[dateStr] = 0;
        timeByDay[dateStr] = 0;
    }

    logs.forEach(log => {
        const dateKey = new Date(log.timestamp).toDateString();
        
        // If duration wasn't logged, estimate it based on XP (e.g. 50 XP = ~15 mins)
        let durationSecs = log.duration || 0;
        if (!durationSecs && log.xp) {
            durationSecs = log.xp * 18; // 1 XP = ~18 seconds
        }

        if (timeByDay[dateKey] !== undefined) {
            activityByDay[dateKey] += (log.xp || 0);
            timeByDay[dateKey] += durationSecs;
        }
        
        totalSeconds += durationSecs;

        // Achievements
        if (log.type === 'completion' && log.scoreDetail?.finalScorePct === 100) perfectScores++;
        if (log.type === 'self_study') cardsMastered += 1; 
    });

    const graphData = Object.keys(activityByDay).map(dateStr => {
        const d = new Date(dateStr);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., "Mon", "Tue"
        const mins = Math.round(timeByDay[dateStr] / 60);
        
        return {
            day: dayName,
            xp: activityByDay[dateStr],
            minutes: mins,
            // Scale height: 60 minutes = 100% bar height. Minimum visible height is 5% if they have > 0 mins.
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
