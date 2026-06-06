<div align="center">

# MagisterOS //

**Content is data. Layout is dynamic.**

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)]()
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)]()

> A rigid, platform-agnostic layout engine engineered to transform pure educational payloads into responsive presentation layers and zero-latency multiplayer classroom arenas.

</div>

---

## ⚡️ Core Architecture

MagisterOS Abandons traditional static HTML/CSS lesson building in favor of a strict, JSON-driven presentation architecture.

### Object-Tree Presentation Engine
Content and layout are strictly decoupled. All pedagogical content is stored as clean JSON arrays (`text_block`, `dialogue_block`, `discussion_block`, `wrap_up_block`). 

```json
{
  "type": "discussion_block",
  "prompt": "Evaluate layout processing metrics.",
  "guidelines": ["Use specific technical vocabulary."]
}
