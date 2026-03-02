// src/constants/defaults.ts

export const DEFAULT_USER_DATA = { name: "Discipulus", targetLanguage: "Latin", level: "Novice", streak: 1, xp: 0, role: 'student', classes: [], completedAssignments: [] };

export const DAILY_QUESTS = [
  { id: 'q_cards', label: "Review 10 Cards", target: 10, xp: 50, icon: 'layers', type: 'self_study' },
  { id: 'q_quiz',  label: "Complete a Quiz", target: 1,  xp: 100, icon: 'help-circle', type: 'quiz_complete' },
  { id: 'q_explore', label: "Find a New Deck", target: 1,  xp: 20,  icon: 'search', type: 'explore_deck' },
];

export const INITIAL_SYSTEM_DECKS = {
  prep_time: {
    title: "Prepositions of Time ⏰",
    targetLanguage: "English",
    description: "Master the tricky rules of 'at', 'in', and 'on' for dates and schedules.",
    cards: [
      { id: 't1', front: "at (time)", back: "Used for precise times (e.g., 5:00 PM, midnight).", type: "grammar" },
      { id: 't2', front: "in (months/years)", back: "Used for months, years, centuries, and long periods.", type: "grammar" },
      { id: 't3', front: "on (days)", back: "Used for days and dates (e.g., Tuesday, July 4th).", type: "grammar" },
      { id: 't4', front: "during", back: "Used when something happens within a specific period.", type: "grammar" },
      { id: 't5', front: "by", back: "Not later than; at or before.", type: "grammar" },
      { id: 't6', front: "until", back: "Up to a certain point in time.", type: "grammar" },
      { id: 't7', front: "since", back: "From a starting point in the past until now.", type: "grammar" },
      { id: 't8', front: "for (duration)", back: "Used to show an amount of time (e.g., 2 hours).", type: "grammar" },
    ]
  },
  prep_place: {
    title: "Prepositions of Place 📍",
    targetLanguage: "English",
    description: "Learn to describe where objects are located relative to others.",
    cards: [
      { id: 'p1', front: "in (place)", back: "Inside an enclosed space or container.", type: "grammar" },
      { id: 'p2', front: "on (surface)", back: "Touching the surface of something.", type: "grammar" },
      { id: 'p3', front: "at (point)", back: "Specific point or location (e.g., the bus stop).", type: "grammar" },
      { id: 'p4', front: "under", back: "Directly below something.", type: "grammar" },
      { id: 'p5', front: "between", back: "In the space separating two objects.", type: "grammar" },
      { id: 'p6', front: "behind", back: "At the back of something.", type: "grammar" },
      { id: 'p7', front: "in front of", back: "Further forward than someone or something.", type: "grammar" },
      { id: 'p8', front: "next to / beside", back: "At the side of someone or something.", type: "grammar" },
    ]
  },
  prep_movement: {
    title: "Prepositions of Movement 🏃",
    targetLanguage: "English",
    description: "Vocabulary for giving directions and describing motion.",
    cards: [
      { id: 'm1', front: "to", back: "Movement towards a specific destination.", type: "grammar" },
      { id: 'm2', front: "through", back: "Movement in one side and out the other.", type: "grammar" },
      { id: 'm3', front: "across", back: "Movement from one side to the other side.", type: "grammar" },
      { id: 'm4', front: "into", back: "Movement entering an enclosed space.", type: "grammar" },
      { id: 'm5', front: "along", back: "Movement following a line (e.g., a road).", type: "grammar" },
      { id: 'm6', front: "over", back: "Movement above and across something.", type: "grammar" },
      { id: 'm7', front: "past", back: "Moving beyond something without stopping.", type: "grammar" },
      { id: 'm8', front: "towards", back: "Movement in the direction of something.", type: "grammar" },
    ]
  }
};

export const INITIAL_SYSTEM_LESSONS = [
  {
    id: "lesson_time_travelers",
    title: "Time Traveler's Guide ⏳",
    subtitle: "Mastering 'at', 'in', and 'on'",
    description: "Learn how to speak about time correctly so you don't arrive in the wrong century.",
    xp: 150,
    type: "lesson",
    vocab: ["Midnight", "Century", "Tuesday"],
    relatedDeckId: "prep_time",
    blocks: [
      {
        type: "text",
        title: "The Pyramid of Time",
        content: "Imagine time as a pyramid. At the bottom, we have big periods (IN). In the middle, specific days (ON). At the top, precise moments (AT)."
      },
      {
        type: "note",
        variant: "tip",
        title: "The Golden Rule",
        content: "Use 'IN' for non-specific times (In the morning, In 1999). Use 'ON' for days (On Monday). Use 'AT' for clock times (At 5 PM)."
      },
      {
        type: "flashcard",
        front: "at (time)",
        back: "Specific times (e.g. 5:00 PM, midnight, sunset)",
        title: "Concept Check"
      },
      {
        type: "quiz",
        question: "I will meet you ___ 5:00 PM.",
        options: [
          { id: "a", text: "on" },
          { id: "b", text: "in" },
          { id: "c", text: "at" }
        ],
        correctId: "c"
      },
      {
        type: "dialogue",
        lines: [
          { speaker: "Alice", text: "When is your flight?", translation: "¿Cuándo es tu vuelo?", side: "left" },
          { speaker: "Bob", text: "It leaves at 9 PM on Friday.", translation: "Sale a las 9 PM el viernes.", side: "right" },
          { speaker: "Alice", text: "Call me in the morning!", translation: "¡Llámame en la mañana!", side: "left" }
        ]
      }
    ]
  },
  {
    id: "lesson_city_nav",
    title: "Navigating the City 🗺️",
    subtitle: "Movement & Place",
    description: "How to give directions and explain where things are located.",
    xp: 150,
    type: "lesson",
    vocab: ["Across", "Toward", "Past"],
    relatedDeckId: "prep_movement",
    blocks: [
      {
        type: "text",
        title: "Moving Through Space",
        content: "Prepositions of movement tell us where to go. They usually follow verbs of motion like 'go', 'walk', or 'run'."
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80",
        caption: "Go across the bridge and through the tunnel."
      },
      {
        type: "vocab-list",
        items: [
          { term: "Towards", definition: "In the direction of something." },
          { term: "Past", definition: "Going beyond something without stopping." },
          { term: "Through", definition: "Moving in one side and out the other." }
        ]
      },
      {
        type: "scenario",
        nodes: [
          {
            id: "start",
            speaker: "Tourist",
            text: "Excuse me, how do I get to the bank?",
            options: [
              { text: "Go past the park.", nextNodeId: "correct_1" },
              { text: "Go at the park.", nextNodeId: "wrong_1" }
            ]
          },
          {
            id: "wrong_1",
            speaker: "Tourist",
            text: "Go at the park? That sounds weird.",
            color: "failure",
            options: [{ text: "Try Again", nextNodeId: "start" }]
          },
          {
            id: "correct_1",
            speaker: "Tourist",
            text: "Okay, I go past the park. Then what?",
            color: "success",
            options: [
              { text: "Walk through the tunnel.", nextNodeId: "end" },
              { text: "Walk on the tunnel.", nextNodeId: "wrong_2" }
            ]
          }
        ]
      }
    ]
  }
];
