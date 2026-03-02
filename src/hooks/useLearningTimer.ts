// src/hooks/useLearningTimer.ts
import { useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';

export const useLearningTimer = (user: any, activityId: string, activityType: string, title: string) => {
    useEffect(() => {
        if (!user || !activityId) return;
        const startTime = Date.now();
        
        return () => {
            const durationSec = Math.round((Date.now() - startTime) / 1000);
            if (durationSec > 5) {
                try { 
                    addDoc(collection(db, 'artifacts', appId, 'activity_logs'), { 
                        studentName: user.displayName || user.email.split('@')[0], 
                        studentEmail: user.email, 
                        itemTitle: title || 'Unknown', 
                        itemId: activityId, 
                        type: 'time_log', 
                        activityType, 
                        duration: durationSec, 
                        timestamp: Date.now() 
                    }); 
                } catch (e) { 
                    console.error("Log error", e); 
                }
            }
        };
    }, [user, activityId, activityType, title]);
};
