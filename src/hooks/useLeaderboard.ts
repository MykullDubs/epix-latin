import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useLeaderboard(studentEmails: string[]) {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Handle empty class state
        if (!studentEmails || studentEmails.length === 0) {
            setRankings([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        /**
         * STRATEGY:
         * We listen to the entire users collection but filter locally for performance 
         * if the class is small, OR we use the list of emails.
         * * Note: For massive production apps, you'd add a 'classId' or 'cohortId' 
         * string to the user profile and query by that instead of emails.
         */
        
        // We still respect the 30-email limit for this specific query type
        const limitedEmails = studentEmails.slice(0, 30);

        const q = query(
            collection(db, 'artifacts', appId, 'users'),
            where('profile.main.email', 'in', limitedEmails)
        );

        // 🔥 switch getDocs to onSnapshot for real-time jamming
        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => {
                const rawData = doc.data();
                return {
                    uid: doc.id,
                    name: rawData.profile?.main?.name || rawData.name || 'Anonymous Scholar',
                    email: rawData.profile?.main?.email || 'No Email',
                    xp: rawData.profile?.main?.xp || 0, // Ensure XP is pulled correctly
                    avatarUrl: rawData.profile?.main?.avatarUrl || null,
                    level: Math.floor((rawData.profile?.main?.xp || 0) / 100) + 1 // Optional: Dynamic level calculation
                };
            });

            // Sort by XP descending (Highest at the top)
            const sorted = data.sort((a, b) => (b.xp || 0) - (a.xp || 0));
            
            setRankings(sorted);
            setLoading(false);
        }, (error) => {
            console.error("Real-time leaderboard sync failed:", error);
            setLoading(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [studentEmails]);

    return { rankings, loading };
}
