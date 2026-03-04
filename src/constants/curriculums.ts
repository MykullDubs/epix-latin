// src/constants/curriculums.ts

export interface Curriculum {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  description: string;
  coverImage: string;
  themeColor: string;
  lessonIds: string[];
}

export const GLOBAL_CURRICULUMS: Curriculum[] = [
  {
    id: 'curr_a1_foundations',
    title: 'A1 Foundations',
    level: 'A1',
    description: 'The complete beginner pathway for navigating daily life and basic conversations in English.',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
    themeColor: '#3b82f6', // blue
    lessonIds: [
      'lesson_a1_01', 'lesson_a1_02', 'lesson_a1_03', 'lesson_a1_04', 'lesson_a1_05',
      'exam_a1_01', // Sprint 1 Checkpoint
      'lesson_a1_06', 'lesson_a1_07', 'lesson_a1_08', 'lesson_a1_09', 'lesson_a1_10',
      'exam_a1_02', // Sprint 2 Checkpoint (Midterm)
      'lesson_a1_11', 'lesson_a1_12', 'lesson_a1_13', 'lesson_a1_14', 'lesson_a1_15',
      'exam_a1_03', // Sprint 3 Checkpoint
      'lesson_a1_16', 'lesson_a1_17', 'lesson_a1_18', 'lesson_a1_19', 'lesson_a1_20',
      'exam_a1_mastery' // Tier Boss Battle
    ]
  },
  {
    id: 'curr_a2_elementary',
    title: 'A2 Elementary',
    level: 'A2',
    description: 'Build confidence with past tenses, daily routines, and essential workplace communication.',
    coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop',
    themeColor: '#10b981', // emerald
    lessonIds: [
      'lesson_a2_01', 'lesson_a2_02', 'lesson_a2_03', 'lesson_a2_04', 'lesson_a2_05',
      'exam_a2_01', 
      'lesson_a2_06', 'lesson_a2_07', 'lesson_a2_08', 'lesson_a2_09', 'lesson_a2_10',
      'exam_a2_02', 
      'lesson_a2_11', 'lesson_a2_12', 'lesson_a2_13', 'lesson_a2_14', 'lesson_a2_15',
      'exam_a2_03', 
      'lesson_a2_16', 'lesson_a2_17', 'lesson_a2_18', 'lesson_a2_19', 'lesson_a2_20',
      'exam_a2_mastery' 
    ]
  },
  {
    id: 'curr_b1_intermediate',
    title: 'B1 Intermediate',
    level: 'B1',
    description: 'Unlock complex grammar, professional emails, and conversational fluency for travel.',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    themeColor: '#8b5cf6', // violet
    lessonIds: [
      'lesson_b1_01', 'lesson_b1_02', 'lesson_b1_03', 'lesson_b1_04', 'lesson_b1_05',
      'exam_b1_01', 
      'lesson_b1_06', 'lesson_b1_07', 'lesson_b1_08', 'lesson_b1_09', 'lesson_b1_10',
      'exam_b1_02', 
      'lesson_b1_11', 'lesson_b1_12', 'lesson_b1_13', 'lesson_b1_14', 'lesson_b1_15',
      'exam_b1_03', 
      'lesson_b1_16', 'lesson_b1_17', 'lesson_b1_18', 'lesson_b1_19', 'lesson_b1_20',
      'exam_b1_mastery' 
    ]
  },
  {
    id: 'curr_b2_upper_intermediate',
    title: 'B2 Upper Intermediate',
    level: 'B2',
    description: 'Master nuanced arguments, spontaneous discussions, and advanced professional interactions.',
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
    themeColor: '#f59e0b', // amber
    lessonIds: [
      'lesson_b2_01', 'lesson_b2_02', 'lesson_b2_03', 'lesson_b2_04', 'lesson_b2_05',
      'exam_b2_01', 
      'lesson_b2_06', 'lesson_b2_07', 'lesson_b2_08', 'lesson_b2_09', 'lesson_b2_10',
      'exam_b2_02', 
      'lesson_b2_11', 'lesson_b2_12', 'lesson_b2_13', 'lesson_b2_14', 'lesson_b2_15',
      'exam_b2_03', 
      'lesson_b2_16', 'lesson_b2_17', 'lesson_b2_18', 'lesson_b2_19', 'lesson_b2_20',
      'exam_b2_mastery' 
    ]
  },
  {
    id: 'curr_c1_advanced',
    title: 'C1 Advanced',
    level: 'C1',
    description: 'Achieve near-native fluency, idiomatic mastery, and executive-level business communication.',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    themeColor: '#f43f5e', // rose
    lessonIds: [
      'lesson_c1_01', 'lesson_c1_02', 'lesson_c1_03', 'lesson_c1_04', 'lesson_c1_05',
      'exam_c1_01', 
      'lesson_c1_06', 'lesson_c1_07', 'lesson_c1_08', 'lesson_c1_09', 'lesson_c1_10',
      'exam_c1_02', 
      'lesson_c1_11', 'lesson_c1_12', 'lesson_c1_13', 'lesson_c1_14', 'lesson_c1_15',
      'exam_c1_03', 
      'lesson_c1_16', 'lesson_c1_17', 'lesson_c1_18', 'lesson_c1_19', 'lesson_c1_20',
      'exam_c1_mastery' 
    ]
  }
];
