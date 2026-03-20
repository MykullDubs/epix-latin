// src/utils/srsEngine.ts

export interface SRSData {
    interval: number;    // Days until next review
    repetition: number;  // Consecutive correct answers
    efactor: number;     // Easiness factor (multiplier)
    nextReviewDate: number; // Timestamp
}

/**
 * Calculates the next review interval using a modified SuperMemo-2 (SM-2) algorithm.
 * @param quality 0-5 rating (1 = Again/Fail, 4 = Good, 5 = Easy)
 * @param prevData The previous SRS state for this card
 */
export const calculateNextReview = (quality: number, prevData?: Partial<SRSData>): SRSData => {
    let interval = prevData?.interval || 0;
    let repetition = prevData?.repetition || 0;
    let efactor = prevData?.efactor || 2.5;

    if (quality >= 3) {
        // Correct response
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * efactor);
        }
        repetition += 1;
    } else {
        // Incorrect response
        repetition = 0;
        interval = 1;
    }

    // Update Easiness Factor based on quality of response
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    // Calculate the next review date (Current time + interval in days)
    const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);

    return {
        interval,
        repetition,
        efactor,
        nextReviewDate
    };
};
