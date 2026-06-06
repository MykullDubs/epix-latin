<div align="center">

# 🎓 MagisterOS //

**Content is data. Layout is dynamic.**

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)]()
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)]()

> A rigid, platform-agnostic layout engine engineered to transform pure educational payloads into responsive presentation layers, zero-latency multiplayer classroom arenas, and asynchronous study pipelines.

</div>

---

## 🏗️ 1. The Presentation Architecture

MagisterOS abandons traditional static HTML/CSS lesson building in favor of a strict, JSON-driven presentation architecture. 

### Object-Tree Engine
Content and layout are strictly decoupled. All pedagogical content is stored as clean JSON arrays using our core schemas:
* `text_block`: Handles localized descriptive body text and tiered headings.
* `dialogue_block`: Pairs dual speakers cleanly into step-by-step roleplay strings.
* `discussion_block`: Highlights targeted question sequences with strict structural grammar prompts.
* `wrap_up_block`: Summarizes milestones reached, confirming structural learning parameters.

```json
{
  "type": "discussion_block",
  "prompt": "Evaluate how decoupling content from styling improves accessibility.",
  "guidelines": [
    "Use specific technical vocabulary.",
    "Provide one concrete example."
  ]
}
```

### Adaptive Constraints
The compiler reads the target device environment at runtime. It automatically strips out unsupported interactive elements (e.g., suppressing complex smartphone queries when projecting to a passive smartboard display).

---

## 🧠 2. AI-Accelerated Lesson Forging

**Teach at the speed of thought.** The Magister Magic Generator (Powered by Gemini AI) is a deterministic pipeline designed to reduce instructor prep time from hours to seconds. It acts as an intelligent compiler, translating unstructured media into strict MagisterOS JSON payloads.

### The Ingestion Pipeline
Instructors no longer need to manually author flashcards or type out quiz questions. The engine natively accepts:
* **Raw Text & PDFs:** Paste articles, textbook chapters, or literature excerpts.
* **Web Architecture:** Input Wikipedia URLs or news article links.
* **Video Transcripts:** Paste a YouTube URL, and the engine will extract the transcript, identify speakers, and isolate the core lexical targets.

### The Compilation Matrix
Once unstructured data is ingested, the AI passes it through a pedagogical filter to ensure the output matches the instructor's exact classroom needs.

* **CEFR Level Targeting:** Instructors select a target difficulty (A1 Beginner to C2 Mastery). The AI automatically scales the vocabulary, simplifies or complexifies the grammar, and adjusts the syntax to match the chosen baseline.
* **Automated Extraction:** The engine isolates high-value vocabulary, generates contextual fill-in-the-blank exercises, and structures grammatical focus points without human intervention.
* **Pedagogical Guardrails:** The AI is strictly prompted to adhere to Universal Design for Learning (UDL) principles, ensuring diverse representation and clear, unambiguous instruction formatting.

### Real-Time Payload Generation
The true power of the Magic Generator is that it outputs pure, ready-to-render `MagisterOS.json_spec` code. 

For example, inputting a YouTube video about "Negotiating a tech salary" instantly compiles into a perfectly structured `dialogue_block` ready for the Live Arena:

```json
{
  "type": "dialogue_block",
  "metadata": {
    "target_cefr": "B2",
    "lexical_focus": ["compensation", "equity", "leverage"]
  },
  "turns": [
    { 
      "speaker": "Hiring Manager", 
      "text": "We are prepared to offer you a baseline compensation of $120,000." 
    },
    { 
      "speaker": "Candidate", 
      "text": "Based on my market research and specialized skill set, I was targeting closer to $140,000, perhaps offset by additional equity." 
    }
  ]
}
```

---

## 📡 3. Dual-Screen Sync & Live Arenas

The backbone of the live classroom experience. MagisterOS utilizes a high-speed Websocket architecture (via Firebase Firestore) to link a central smartboard projector with up to 30 individual student mobile devices simultaneously.

* **Zero-Latency Interactions:** Actions taken on the student HUD reflect instantly on the projector view.
* **Frictionless Entry:** Students join active sessions via a dynamic smartboard QR code. No account creation or app installation is required for live arena participation.
* **State Recovery:** Dropped connections are instantly restored to the current application state without disrupting the global game loop.

### The Multiplayer Suite
MagisterOS abandons traditional static quizzing in favor of highly interactive, multiplayer gamification.

| Arena Mode | Mechanics | Pedagogical Target |
| :--- | :--- | :--- |
| **Trivia Battle** | A fast-paced, classic multiple-choice showdown. | Rapid recall and baseline vocabulary testing. |
| **Squad Strike** | Team-based strategy. Teams answer correctly to drop colored tokens into a shared Connect-4 grid. | Collaborative problem-solving and peer teaching. |
| **Slipstream Run** | A continuous, infinite-scroll runner where correct answers accelerate the student's avatar. | Fluency, reading speed, and automaticity. |
| **Marble Scrabble** | *Littera Marmoris.* Teams battle to form words from scattered letters under a strict time limit. | Spelling, syntax, and advanced lexical recall. |

---

## 🎮 4. Gamification & Student HUD

A dark-mode, app-like mobile interface designed for daily student engagement outside of the classroom.

* **Spaced Repetition System (SRS):** Built-in flashcard engine that tracks user performance, calculating optimal review intervals based on mastery.
* **Dynamic Theme Engine:** Personalization integrated directly into the OS. Students unlock and equip UI themes (`theme_hacker`, `theme_synth`, `theme_vapor`) that dynamically inject Tailwind modifier classes across the entire application state.
* **HoloAvatars & Storefront:** Students earn XP by completing lessons and exams. They can spend earned currency in the storefront to unlock cosmetic avatar borders, interface colors, and particle effects.
* **Study Folders:** Complete autonomy over asynchronous learning. Students can star, archive, and organize network decks into custom directories.

---

## 🔐 5. Core LMS Features & RBAC

MagisterOS routes users deterministically based on their database permissions, ensuring a tailored experience for every role.

### 👨‍🎓 Student Level
* Locked into the mobile-first HUD.
* Access to enrolled classes, flashcard decks, storefront, and direct inbox.
* Automated celebration screens upon module completion.

### 👨‍🏫 Instructor Level (Magister Command)
* **Advanced Dashboard:** Create classes, manage rosters, and assign dynamic curriculums.
* **Live Control:** Launch Live Arenas directly to the smartboard and monitor real-time student performance.
* **Content Management:** Build, edit, and publish custom flashcard decks and lessons.

### 🛡️ Admin Level
* Unrestricted global view of the organization.
* Oversee organization-wide analytics and manage overarching global curriculums.
* Seamlessly impersonate the student experience to preview application behavior.

---

<div align="center">
  <p><i>Built by educators, for educators.</i></p>
  <p>&copy; 2026 MagisterOS Development Team</p>
</div>
