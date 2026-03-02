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
