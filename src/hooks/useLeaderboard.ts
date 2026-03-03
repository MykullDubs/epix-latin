import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
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

        const fetchRankings = async () => {
            setLoading(true);
            try {
                // Firebase "in" queries are limited to 10-30 items depending on version.
                // For larger classes, you'd query the whole 'users' collection with a cohortId filter.
                const q = query(
                    collection(db, 'artifacts', appId, 'users'),
                    where('profile.main.email', 'in', studentEmails.slice(0, 30))
                );

                const snap = await getDocs(q);
                const data = snap.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data().profile?.main
                }));

                // Sort by XP descending
                const sorted = data.sort((a, b) => (b.xp || 0) - (a.xp || 0));
                setRankings(sorted);
            } catch (e) {
                console.error("Leaderboard fetch failed", e);
            }
            setLoading(false);
        };

        fetchRankings();
    }, [studentEmails]);

    return { rankings, loading };
}
