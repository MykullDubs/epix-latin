import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { calculateLevel } from '../utils/profileHelpers';

export function useGlobalLeaderboard(topLimit: number = 50) {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        // Query the entire user base for this app, ordered by XP descending
        // Note: Firebase will prompt you to create an index for 'profile.main.xp' if it doesn't exist
        const q = query(
            collection(db, 'artifacts', appId, 'users'),
            orderBy('profile.main.xp', 'desc'),
            limit(topLimit)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map((doc, index) => {
                const rawData = doc.data();
                
                // Safely grab data whether it's in the nested map or at the root
                const profile = rawData.profile?.main || {};
                
                const xp = profile.xp || rawData.xp || 0;
                const totalLikes = profile.totalLikesReceived || rawData.totalLikesReceived || 0;
                
                // Map the raw Firebase data to the clean object our UI expects
                return {
                    uid: doc.id,
                    rank: index + 1, // Store their absolute global rank
                    name: profile.name || rawData.name || 'Anonymous Scholar',
                    email: profile.email || rawData.email || 'No Email',
                    xp: xp,
                    avatarUrl: profile.avatarUrl || rawData.avatarUrl || null,
                    streak: profile.streak || rawData.streak || 0,
                    
                    // 🔥 THE UPGRADE: Exponential RPG Math with Social Bonus!
                    level: calculateLevel(xp, totalLikes).level,
                    
                    totalLikesReceived: totalLikes
                };
            });
            
            setRankings(data);
            setLoading(false);
        }, (error) => {
            console.error("Global leaderboard real-time sync failed:", error);
            setLoading(false);
        });

        // Cleanup listener when the user navigates away from the tab
        return () => unsubscribe();
    }, [topLimit]);

    return { rankings, loading };
}
