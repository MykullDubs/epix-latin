// ============================================================================
// MAGISTER OS - GLOBAL TYPES
// ============================================================================

// --- USER & COHORT MODELS ---
export interface UserProfile {
    uid: string;
    email: string;
    name: string;
    role: 'student' | 'instructor' | 'admin';
    cohortId?: string | null;
    avatarUrl?: string;
    xp: number;
    level: number;
    streak: number;
}

// --- CONTENT BLOCK MODELS ---
// This covers the individual interactive pieces inside a lesson or exam
export interface ContentBlock {
    id: string;
    type: 'quiz' | 'flashcard' | 'fill-blank' | 'scenario' | 'reading' | 'audio-story';
    title?: string;
    content?: any;
    options?: any[];
    correctId?: string;
}

// --- PROGRESSIVE EXAM MODELS ---
// The new structure for branching/gated assessments
export interface ExamPhase {
    id: string;
    title: string;
    description?: string;
    blocks: ContentBlock[]; 
    passingThreshold: number; // e.g., 80 for 80%
    nextPhaseId?: string | null; // Where to go if they pass
    fallbackPhaseId?: string | null; // Where to go if they fail (e.g., remedial phase)
}

export interface ExamDocument {
    id: string;
    title: string;
    description: string;
    authorId: string;
    createdAt: number;
    updatedAt: number;
    
    // Legacy support for older flat exams
    blocks?: ContentBlock[]; 
    
    // New Progressive Engine fields
    isProgressive: boolean;
    phases?: ExamPhase[];
}

// --- ASSIGNMENT MODELS ---
// Supports both string IDs and specific cohort assignments
export interface AssignmentTarget {
    lessonId: string;
    cohortId?: string; 
    dueDate?: number;
}
