import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export function useLeaderboard(studentEmails: string[]) {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentEmails || studentEmails.length === 0) {
            setRankings([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        // Clean the emails to ensure perfect matching
        const cleanEmails = studentEmails.map(e => e.toLowerCase().trim()).slice(0, 30);

        // 🔥 THE FIX: Query the root 'email' field instead of 'profile.main.email'
        const q = query(
            collection(db, 'artifacts', appId, 'users'),
            where('email', 'in', cleanEmails)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => {
                const rawData = doc.data();
                // Safely grab data whether it's in the profile map or at the root
                const profile = rawData.profile?.main || {}; 
                
                return {
                    uid: doc.id,
                    name: profile.name || rawData.name || 'Anonymous Scholar',
                    email: profile.email || rawData.email || 'No Email',
                    xp: profile.xp || rawData.xp || 0,
                    avatarUrl: profile.avatarUrl || rawData.avatarUrl || null,
                    streak: profile.streak || 0,
                    level: Math.floor((profile.xp || rawData.xp || 0) / 100) + 1,
                    totalLikesReceived: profile.totalLikesReceived || 0
                };
            });

            // Sort by XP descending
            const sorted = data.sort((a, b) => (b.xp || 0) - (a.xp || 0));
            setRankings(sorted);
            setLoading(false);
        }, (error) => {
            console.error("Cohort leaderboard sync failed:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studentEmails]);

    return { rankings, loading };
}
