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
*   `text_block`: Handles localized descriptive body text and tiered headings.
*   `dialogue_block`: Pairs dual speakers cleanly into step-by-step roleplay strings.
*   `discussion_block`: Highlights targeted question sequences with strict structural grammar prompts.
*   `wrap_up_block`: Summarizes milestones reached, confirming structural learning parameters.

```json
{
  "type": "discussion_block",
  "prompt": "Evaluate how decoupling content from styling improves accessibility.",
  "guidelines": [
    "Use specific technical vocabulary.",
    "Provide one concrete example."
  ]
}
