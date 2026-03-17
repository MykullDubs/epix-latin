import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useGlobalLeaderboard(topLimit: number = 50) {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        // Query the entire user base for this app, ordered by XP descending
        const q = query(
            collection(db, 'artifacts', appId, 'users'),
            orderBy('profile.main.xp', 'desc'),
            limit(topLimit)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map((doc, index) => {
                const rawData = doc.data();
                
                // Map the raw Firebase data to the clean object our UI expects
                return {
                    uid: doc.id,
                    rank: index + 1, // Store their absolute global rank
                    name: rawData.profile?.main?.name || rawData.name || 'Anonymous Scholar',
                    email: rawData.profile?.main?.email || 'No Email',
                    xp: rawData.profile?.main?.xp || 0,
                    avatarUrl: rawData.profile?.main?.avatarUrl || null,
                    streak: rawData.profile?.main?.streak || 0,
                    level: Math.floor((rawData.profile?.main?.xp || 0) / 100) + 1,
                    totalLikesReceived: rawData.profile?.main?.totalLikesReceived || 0
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
