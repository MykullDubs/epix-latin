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
    themeColor: '#3b82f6',
    lessonIds: [
      'lesson_a1_01', 'lesson_a1_02', 'lesson_a1_03', 'lesson_a1_04', 'lesson_a1_05',
      'lesson_a1_06', 'lesson_a1_07', 'lesson_a1_08', 'lesson_a1_09', 'lesson_a1_10',
      'lesson_a1_11', 'lesson_a1_12', 'lesson_a1_13', 'lesson_a1_14', 'lesson_a1_15',
      'lesson_a1_16', 'lesson_a1_17', 'lesson_a1_18', 'lesson_a1_19', 'lesson_a1_20'
    ]
  },
  {
    id: 'curr_a2_elementary',
    title: 'A2 Elementary',
    level: 'A2',
    description: 'Build confidence with past tenses, daily routines, and essential workplace communication.',
    coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop',
    themeColor: '#10b981',
    lessonIds: ['lesson_a2_01', 'lesson_a2_02', 'lesson_a2_03']
  },
  {
    id: 'curr_b1_intermediate',
    title: 'B1 Intermediate',
    level: 'B1',
    description: 'Unlock complex grammar, professional emails, and conversational fluency for travel.',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    themeColor: '#8b5cf6',
    lessonIds: ['lesson_b1_01', 'lesson_b1_02']
  }
];
