// src/constants/curriculums.ts

export interface Curriculum {
  id: string;
  title: string;
  
  // --- NEW TAXONOMY FIELDS ---
  subject: string;       // e.g., 'Social Studies', 'Mathematics', 'ESL'
  grade?: string;        // e.g., 'Grade 1'
  strand?: string;       // e.g., 'Early Mexican History', 'Phonics'
  level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | string; // Kept for ESL backwards compatibility
  
  description: string;
  coverImage: string;
  themeColor: string;
  lessonIds: string[];   // The array that populates the Roadmap
}

export const GLOBAL_CURRICULUMS: Curriculum[] = [
  
  // ============================================================================
  //  PRIMARY SCHOOL: GRADE 1 (Year-Long Roadmaps)
  // ============================================================================
  
  {
    id: 'curr_g1_social_studies',
    title: 'Grade 1 Social Studies',
    subject: 'Social Studies',
    grade: 'Grade 1',
    strand: 'History & Geography',
    description: 'A complete school year journey through community roles, basic geography, and Early Mexican History.',
    coverImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800&auto=format&fit=crop', // Pyramids/History aesthetic
    themeColor: '#f59e0b', // Amber
    lessonIds: [
      // Quarter 1: Community & Geography
      'lesson_g1_ss_01', 'lesson_g1_ss_02', 'lesson_g1_ss_03', 'lesson_g1_ss_04',
      'exam_g1_ss_q1', // Q1 Checkpoint
      
      // Quarter 2: Early Mexican History (Olmecs, Maya)
      'lesson_g1_ss_05', 'lesson_g1_ss_06', 'lesson_g1_ss_07', 'lesson_g1_ss_08',
      'exam_g1_ss_q2', // Mid-Term
      
      // Quarter 3: Culture & Traditions
      'lesson_g1_ss_09', 'lesson_g1_ss_10', 'lesson_g1_ss_11', 'lesson_g1_ss_12',
      'exam_g1_ss_q3', 
      
      // Quarter 4: Modern Mexico & Our World
      'lesson_g1_ss_13', 'lesson_g1_ss_14', 'lesson_g1_ss_15', 'lesson_g1_ss_16',
      'exam_g1_ss_final' // Year-End Boss Battle
    ]
  },
  {
    id: 'curr_g1_math',
    title: 'Grade 1 Mathematics',
    subject: 'Mathematics',
    grade: 'Grade 1',
    strand: 'Arithmetic & Geometry',
    description: 'A full year of foundational math: counting to 120, basic addition/subtraction, and 2D/3D shapes.',
    coverImage: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=800&auto=format&fit=crop',
    themeColor: '#ef4444', // Red
    lessonIds: [
      'lesson_g1_math_01', 'lesson_g1_math_02', 'lesson_g1_math_03', 'lesson_g1_math_04',
      'exam_g1_math_q1', 
      'lesson_g1_math_05', 'lesson_g1_math_06', 'lesson_g1_math_07', 'lesson_g1_math_08',
      'exam_g1_math_q2', 
      'lesson_g1_math_09', 'lesson_g1_math_10', 'lesson_g1_math_11', 'lesson_g1_math_12',
      'exam_g1_math_q3', 
      'lesson_g1_math_13', 'lesson_g1_math_14', 'lesson_g1_math_15', 'lesson_g1_math_16',
      'exam_g1_math_final' 
    ]
  },
  {
    id: 'curr_g1_science',
    title: 'Grade 1 Science',
    subject: 'Science',
    grade: 'Grade 1',
    strand: 'Earth & Life Science',
    description: 'Explore the natural world! A year-long curriculum covering plant life cycles, animal habitats, and the solar system.',
    coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop',
    themeColor: '#10b981', // Emerald
    lessonIds: [
      'lesson_g1_sci_01', 'lesson_g1_sci_02', 'lesson_g1_sci_03', 'lesson_g1_sci_04',
      'exam_g1_sci_q1', 
      'lesson_g1_sci_05', 'lesson_g1_sci_06', 'lesson_g1_sci_07', 'lesson_g1_sci_08',
      'exam_g1_sci_q2', 
      'lesson_g1_sci_09', 'lesson_g1_sci_10', 'lesson_g1_sci_11', 'lesson_g1_sci_12',
      'exam_g1_sci_q3', 
      'lesson_g1_sci_13', 'lesson_g1_sci_14', 'lesson_g1_sci_15', 'lesson_g1_sci_16',
      'exam_g1_sci_final' 
    ]
  },
  {
    id: 'curr_g1_reading',
    title: 'Grade 1 Reading & Language Arts',
    subject: 'Reading',
    grade: 'Grade 1',
    strand: 'Phonics & Comprehension',
    description: 'Master the alphabet, phonics, sight words, and basic story comprehension over the school year.',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
    themeColor: '#0ea5e9', // Cyan
    lessonIds: [
      'lesson_g1_read_01', 'lesson_g1_read_02', 'lesson_g1_read_03', 'lesson_g1_read_04',
      'exam_g1_read_q1', 
      'lesson_g1_read_05', 'lesson_g1_read_06', 'lesson_g1_read_07', 'lesson_g1_read_08',
      'exam_g1_read_q2', 
      'lesson_g1_read_09', 'lesson_g1_read_10', 'lesson_g1_read_11', 'lesson_g1_read_12',
      'exam_g1_read_q3', 
      'lesson_g1_read_13', 'lesson_g1_read_14', 'lesson_g1_read_15', 'lesson_g1_read_16',
      'exam_g1_read_final' 
    ]
  },

  // ============================================================================
  //  LANGUAGE LEARNING: ESL (Legacy / Adult)
  // ============================================================================

  {
    id: 'curr_a1_foundations',
    title: 'A1 Foundations',
    subject: 'ESL',
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
    subject: 'ESL',
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
    subject: 'ESL',
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
    subject: 'ESL',
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
    subject: 'ESL',
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
