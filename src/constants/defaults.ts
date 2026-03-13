// src/constants/defaults.ts

export const DEFAULT_USER_DATA = { 
  name: "Student", 
  targetLanguage: "English", 
  level: "Novice", 
  streak: 1, 
  xp: 0, 
  role: 'student', 
  classes: [], 
  completedAssignments: [] 
};

export const DAILY_QUESTS = [
  { id: 'q_cards', label: "Review 10 Cards", target: 10, xp: 50, icon: 'layers', type: 'self_study' },
  { id: 'q_quiz',  label: "Complete a Quiz", target: 1,  xp: 100, icon: 'help-circle', type: 'quiz_complete' },
  { id: 'q_explore', label: "Find a New Deck", target: 1,  xp: 20,  icon: 'search', type: 'explore_deck' },
];

export const TYPE_COLORS: any = { 
  verb: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' }, 
  noun: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }, 
  adverb: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' }, 
  phrase: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }, 
  adjective: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' } 
};

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
  // ============================================================================
  //  ESL / ENGLISH LESSONS
  // ============================================================================
  {
    id: "lesson_time_travelers",
    title: "Time Traveler's Guide ⏳",
    subtitle: "Mastering 'at', 'in', and 'on'",
    description: "Learn how to speak about time correctly so you don't arrive in the wrong century.",
    xp: 150,
    type: "lesson",
    subject: "ESL",
    vocab: ["Midnight", "Century", "Tuesday"],
    relatedDeckId: "prep_time",
    blocks: [
      { type: "text", title: "The Pyramid of Time", content: "Imagine time as a pyramid. At the bottom, we have big periods (IN). In the middle, specific days (ON). At the top, precise moments (AT)." },
      { type: "note", variant: "tip", title: "The Golden Rule", content: "Use 'IN' for non-specific times (In the morning, In 1999). Use 'ON' for days (On Monday). Use 'AT' for clock times (At 5 PM)." },
      { type: "flashcard", front: "at (time)", back: "Specific times (e.g. 5:00 PM, midnight, sunset)", title: "Concept Check" },
      { type: "quiz", question: "I will meet you ___ 5:00 PM.", options: [{ id: "a", text: "on" }, { id: "b", text: "in" }, { id: "c", text: "at" }], correctId: "c" },
      { type: "dialogue", lines: [{ speaker: "Alice", text: "When is your flight?", translation: "¿Cuándo es tu vuelo?", side: "left" }, { speaker: "Bob", text: "It leaves at 9 PM on Friday.", translation: "Sale a las 9 PM el viernes.", side: "right" }, { speaker: "Alice", text: "Call me in the morning!", translation: "¡Llámame en la mañana!", side: "left" }] }
    ]
  },
  {
    id: "lesson_city_nav",
    title: "Navigating the City 🗺️",
    subtitle: "Movement & Place",
    description: "How to give directions and explain where things are located.",
    xp: 150,
    type: "lesson",
    subject: "ESL",
    vocab: ["Across", "Toward", "Past"],
    relatedDeckId: "prep_movement",
    blocks: [
      { type: "text", title: "Moving Through Space", content: "Prepositions of movement tell us where to go. They usually follow verbs of motion like 'go', 'walk', or 'run'." },
      { type: "image", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80", caption: "Go across the bridge and through the tunnel." },
      { type: "vocab-list", items: [{ term: "Towards", definition: "In the direction of something." }, { term: "Past", definition: "Going beyond something without stopping." }, { term: "Through", definition: "Moving in one side and out the other." }] },
      { type: "scenario", nodes: [{ id: "start", speaker: "Tourist", text: "Excuse me, how do I get to the bank?", options: [{ text: "Go past the park.", nextNodeId: "correct_1" }, { text: "Go at the park.", nextNodeId: "wrong_1" }] }, { id: "wrong_1", speaker: "Tourist", text: "Go at the park? That sounds weird.", color: "failure", options: [{ text: "Try Again", nextNodeId: "start" }] }, { id: "correct_1", speaker: "Tourist", text: "Okay, I go past the park. Then what?", color: "success", options: [{ text: "Walk through the tunnel.", nextNodeId: "end" }, { text: "Walk on the tunnel.", nextNodeId: "wrong_2" }] }] }
    ]
  },

  // ============================================================================
  //  GRADE 1 SOCIAL STUDIES: MEXICAN HISTORY (NEW K-1 BLOCKS)
  // ============================================================================
  {
    id: "lesson_g1_ss_01",
    title: "¡México es mi hogar! Montañas, Selvas y Desiertos",
    description: "Vamos a explorar los lugares más increíbles de México: desiertos con cactus gigantes, selvas llenas de animales y montañas que tocan las nubes. ¡Tu país es un lugar mágico!",
    contentType: "lesson",
    subject: "Social Studies",
    grade: "Grade 1",
    strand: "History & Geography",
    blocks: [
      {
        type: "audio-story",
        text: "México es un país muy grande y muy especial. Tiene lugares increíbles: hay desiertos donde casi no llueve, selvas donde viven jaguares y monos, y montañas tan altas que tienen nieve en la punta. ¡Todo eso es tu hogar!",
        imageUrl: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800"
      },
      {
        type: "image-hotspot",
        title: "¡Explora los paisajes de México!",
        imageUrl: "https://images.unsplash.com/photo-1596003894291-2338eb935e3d?w=800",
        hotspots: [
          { x: 15, y: 25, title: "🏔️ Las Montañas", description: "¡Son altísimas! Algunas tienen nieve y están cubiertas de nubes." },
          { x: 75, y: 65, title: "🌵 El Desierto", description: "Aquí hace mucho calor y crecen cactus gigantes. ¡El agua es muy valiosa!" },
          { x: 50, y: 80, title: "🌴 La Selva", description: "Está llena de árboles enormes, colores brillantes y animales como el jaguar y el tucán." },
          { x: 40, y: 20, title: "🌊 El Mar", description: "México tiene dos mares: el Pacífico y el Golfo de México. ¡Están llenos de vida!" }
        ]
      },
      {
        type: "drag-drop",
        title: "¡Ayuda a cada animal a llegar a su hogar!",
        categories: ["🏔️ Montaña", "🌵 Desierto", "🌴 Selva"],
        items: [
          { id: "1", label: "Jaguar", emoji: "🐆", correctCategory: "🌴 Selva" },
          { id: "2", label: "Víbora", emoji: "🐍", correctCategory: "🌵 Desierto" },
          { id: "3", label: "Águila", emoji: "🦅", correctCategory: "🏔️ Montaña" },
          { id: "4", label: "Mono", emoji: "🐒", correctCategory: "🌴 Selva" },
          { id: "5", label: "Coyote", emoji: "🐺", correctCategory: "🌵 Desierto" }
        ]
      },
      {
        type: "drawing",
        title: "¡Dibuja tu paisaje favorito de México! ¿Prefieres la selva, el desierto o las montañas? ¡Usa todos los colores!"
      }
    ]
  },
  {
    id: "lesson_g1_ss_02",
    title: "El Águila y la Serpiente",
    description: "Hace muchos, muchos años, un pueblo valioso buscaba un lugar para vivir. ¡Escucha esta leyenda increíble y descubre cómo nació México!",
    contentType: "lesson",
    subject: "Social Studies",
    grade: "Grade 1",
    strand: "History & Geography",
    blocks: [
      {
        type: "audio-story",
        text: "Hace mucho tiempo, un dios llamado Huitzilopochtli les dijo a los mexicas: '¡Busquen un águila parada sobre un nopal, con una serpiente en el pico! Ahí deben construir su ciudad.' ¡Y así lo hicieron! Ahí nació Tenochtitlán, que hoy es la Ciudad de México.",
        imageUrl: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800"
      },
      {
        type: "image-hotspot",
        title: "¡Observa el escudo de la bandera de México!",
        imageUrl: "https://images.unsplash.com/photo-1562461995-64b2e8d1b1f4?w=800",
        hotspots: [
          { x: 50, y: 30, title: "🦅 El Águila", description: "Es fuerte y valiente. Representa al pueblo mexica que fundó México." },
          { x: 60, y: 55, title: "🐍 La Serpiente", description: "El águila la sostiene en su pico. ¡Así lo vieron los mexicas en el lago!" },
          { x: 45, y: 65, title: "🌵 El Nopal", description: "Es una planta mexicana muy especial. El águila está parada sobre él." },
          { x: 50, y: 80, title: "💧 El Lago", description: "La ciudad de Tenochtitlán fue construida en medio de un gran lago." }
        ]
      },
      {
        type: "quiz",
        points: 10,
        content: {
          question: "Según la leyenda, ¿qué tenía el águila en el pico cuando los mexicas la encontraron?",
          options: [
            { id: "opt_0", text: "🐍 Una serpiente" },
            { id: "opt_1", text: "🌽 Una mazorca de maíz" },
            { id: "opt_2", text: "🌸 Una flor" }
          ],
          correctId: "opt_0"
        }
      },
      {
        type: "drawing",
        title: "¡Dibuja el águila parada en el nopal! Imagina que estás viendo la señal que encontraron los mexicas."
      }
    ]
  },
  {
    id: "lesson_g1_ss_03",
    title: "Los Colores de México",
    description: "Nuestra bandera tiene tres colores muy especiales y cada uno tiene un significado lleno de historia.",
    contentType: "lesson",
    subject: "Social Studies",
    grade: "Grade 1",
    strand: "History & Geography",
    blocks: [
      {
        type: "audio-story",
        text: "El verde representa la esperanza, como las plantas que crecen fuertes. El blanco representa la paz, como cuando todos vivimos tranquilos y felices. El rojo representa la sangre de los héroes valientes que amaron a México.",
        imageUrl: "https://images.unsplash.com/photo-1508614999368-9260051292e5?w=800"
      },
      {
        type: "drag-drop",
        title: "¡Une cada color con su significado!",
        categories: ["💚 Verde", "🤍 Blanco", "❤️ Rojo"],
        items: [
          { id: "1", label: "La esperanza", emoji: "🌱", correctCategory: "💚 Verde" },
          { id: "2", "label": "La paz", emoji: "🕊️", correctCategory: "🤍 Blanco" },
          { id: "3", "label": "Héroes", emoji: "⭐", correctCategory: "❤️ Rojo" }
        ]
      },
      {
        type: "quiz",
        points: 10,
        content: {
          question: "¿Qué significa el color VERDE en la bandera de México?",
          options: [
            { id: "opt_0", text: "🌱 La esperanza" },
            { id: "opt_1", text: "🕊️ La paz" },
            { id: "opt_2", text: "⭐ Los héroes" }
          ],
          correctId: "opt_0"
        }
      },
      {
        type: "drawing",
        title: "¡Colorea y decora tu propia bandera de México! Usa el verde, el blanco y el rojo."
      }
    ]
  },
  {
    id: "lesson_g1_ss_04",
    title: "Los Animales que Representan a México",
    description: "México tiene animales increíbles que no existen en casi ningún otro lugar del mundo.",
    contentType: "lesson",
    subject: "Social Studies",
    grade: "Grade 1",
    strand: "History & Geography",
    blocks: [
      {
        type: "audio-story",
        text: "El águila real es fuerte y vuela entre las montañas. El quetzal vive en la selva y tiene plumas de color verde brillante. Y el ajolote es un dragón de agua rosado y sonriente que vive en los lagos.",
        imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800"
      },
      {
        type: "image-hotspot",
        title: "¡Conoce a los animales de México!",
        imageUrl: "https://images.unsplash.com/photo-1550159930-40066082a4fc?w=800",
        hotspots: [
          { x: 20, y: 25, title: "🦅 El Águila Real", description: "Vive en las montañas y es muy valiente." },
          { x: 65, y: 40, title: "🦜 El Quetzal", description: "Tiene plumas largas y verdes brillantes." },
          { x: 45, y: 75, title: "🦎 El Ajolote", description: "Es un animalito rosado que vive en el agua." }
        ]
      },
      {
        type: "drag-drop",
        title: "¡Lleva a cada animal a donde vive!",
        categories: ["🏔️ Montañas", "🌴 Selva", "💧 Lago"],
        items: [
          { id: "1", label: "El Águila", emoji: "🦅", correctCategory: "🏔️ Montañas" },
          { id: "2", "label": "El Quetzal", emoji: "🦜", correctCategory: "🌴 Selva" },
          { id: "3", "label": "El Ajolote", emoji: "🦎", correctCategory: "💧 Lago" }
        ]
      },
      {
        type: "quiz",
        points: 10,
        content: {
          question: "¿Cuál de estos animales mexicanos tiene la habilidad mágica de regenerar sus patitas?",
          options: [
            { id: "opt_0", text: "🦅 El Águila Real" },
            { id: "opt_1", text: "🦜 El Quetzal" },
            { id: "opt_2", text: "🦎 El Ajolote" }
          ],
          correctId: "opt_2"
        }
      }
    ]
  },
  {
    id: "exam_g1_ss_q1",
    title: "📝 Examen de Revisión: Trimestre 1",
    description: "¡Llegó el momento de demostrar todo lo que aprendiste sobre México! ¡Tú puedes, campeón!",
    contentType: "exam",
    subject: "Social Studies",
    grade: "Grade 1",
    strand: "History & Geography",
    blocks: [
      {
        type: "quiz",
        points: 20,
        content: {
          question: "¿En cuál de estos lugares vive el jaguar en México?",
          options: [
            { id: "opt_0", text: "🌵 En el desierto" },
            { id: "opt_1", text: "🌴 En la selva" },
            { id: "opt_2", text: "🏔️ En la montaña" }
          ],
          correctId: "opt_1"
        }
      },
      {
        type: "quiz",
        points: 20,
        content: {
          question: "Según la leyenda, ¿dónde encontraron los mexicas al águila con la serpiente?",
          options: [
            { id: "opt_0", text: "🏔️ En la cima de una montaña" },
            { id: "opt_1", text: "🌵 En un desierto seco" },
            { id: "opt_2", text: "💧 En medio de un lago" }
          ],
          correctId: "opt_2"
        }
      },
      {
        type: "quiz",
        points: 20,
        content: {
          question: "¿Qué color de la bandera de México representa la PAZ?",
          options: [
            { id: "opt_0", text: "💚 Verde" },
            { id: "opt_1", text: "🤍 Blanco" },
            { id: "opt_2", text: "❤️ Rojo" }
          ],
          correctId: "opt_1"
        }
      },
      {
        type: "drag-drop",
        title: "¡Lleva cada cosa a donde pertenece!",
        categories: ["🦅 Bandera de México", "🌴 La Selva", "🌵 El Desierto"],
        items: [
          { id: "1", label: "El Águila y Serpiente", emoji: "🐍", correctCategory: "🦅 Bandera de México" },
          { id: "2", label: "El Ajolote", emoji: "🦎", correctCategory: "🌴 La Selva" },
          { id: "3", label: "Cactus gigante", emoji: "🌵", correctCategory: "🌵 El Desierto" },
          { id: "4", label: "Verde, Blanco y Rojo", emoji: "🎨", correctCategory: "🦅 Bandera de México" }
        ]
      },
      {
        type: "drawing",
        title: "¡Dibuja tu parte favorita de México! Puede ser un animal, un paisaje o la bandera."
      }
    ]
  }
];

// ============================================================================
//  THEME DEFINITIONS (THE AURA ENGINE)
// ============================================================================
export const THEMES: any = {
  indigo: {
    id: 'indigo',
    name: 'Cyberpunk',
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-50',
    accent: 'text-indigo-600',
    border: 'border-indigo-100',
    shadow: 'shadow-indigo-100',
    font: 'font-sans'
  },
  emerald: {
    id: 'emerald',
    name: 'Bio-Digital',
    primary: 'bg-emerald-600',
    secondary: 'bg-emerald-50',
    accent: 'text-emerald-600',
    border: 'border-emerald-100',
    shadow: 'shadow-emerald-100',
    font: 'font-sans'
  },
  rose: {
    id: 'rose',
    name: 'High-Alert',
    primary: 'bg-rose-600',
    secondary: 'bg-rose-50',
    accent: 'text-rose-600',
    border: 'border-rose-100',
    shadow: 'shadow-rose-100',
    font: 'font-sans'
  },
  slate: {
    id: 'slate',
    name: 'Oxford',
    primary: 'bg-slate-900',
    secondary: 'bg-slate-50',
    accent: 'text-slate-900',
    border: 'border-slate-200',
    shadow: 'shadow-slate-200',
    font: 'font-serif'
  }
};
