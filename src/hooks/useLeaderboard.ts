import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { calculateLevel } from '../utils/profileHelpers';

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
        // Note: Firestore 'in' queries max out at 30 items.
        const cleanEmails = studentEmails.map(e => e.toLowerCase().trim()).slice(0, 30);

        // Query the root 'email' field to catch everyone in the cohort
        const q = query(
            collection(db, 'artifacts', appId, 'users'),
            where('email', 'in', cleanEmails)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => {
                const rawData = doc.data();
                
                // Safely grab data whether it's in the profile map or at the root
                const profile = rawData.profile?.main || {}; 
                
                const xp = profile.xp || rawData.xp || 0;
                const totalLikes = profile.totalLikesReceived || rawData.totalLikesReceived || 0;
                
                return {
                    uid: doc.id,
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

            // Sort by XP descending
            const sorted = data.sort((a, b) => (b.xp || 0) - (a.xp || 0));
            
            // Inject absolute cohort rank based on sorted order
            const rankedData = sorted.map((student, index) => ({
                ...student,
                rank: index + 1
            }));

            setRankings(rankedData);
            setLoading(false);
        }, (error) => {
            console.error("Cohort leaderboard sync failed:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studentEmails]); // Re-run if the class roster changes

    return { rankings, loading };
}
