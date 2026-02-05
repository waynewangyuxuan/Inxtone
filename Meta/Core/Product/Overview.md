# Product Overview

> Inxtone executive summary, target users, and market positioning

**Parent**: [Product/Meta.md](Meta.md)
**Lines**: ~100 | **Updated**: 2026-02-05

---

## 1. Executive Summary

Inxtone is an **open-source, local-first CLI tool** with a web-based UI that helps writers create long-form serial fiction (web novels) with structural integrity and commercial viability. It combines literary craft principles with AI assistance to solve the core problem: AI can generate text, but it can't tell stories that hold up at scale.

**Architecture:** CLI + Local Web UI (similar to Ollama, Jupyter)
- Run `inxtone serve` → opens `localhost:3456` with full-featured writing interface
- All data stored locally in **SQLite database** (Markdown exported for external editing)
- **Git-friendly** project structure for version control
- **BYOK (Bring Your Own Key)** for Gemini API

**Core Value Proposition:**
- For Chinese market (网文市场): 让AI真正懂得讲故事，而不只是生成文字
- For International market: Turn AI from a text generator into a story architect
- For developers/power users: Open source, hackable, no vendor lock-in

---

## 2. Target Users

### 2.1 Primary Persona: The Serial Writer (网文作者)

**Demographics:**
- Writing 500K-2M+ word novels
- Publishing on platforms (起点/Qidian, Royal Road, Webnovel, Kindle Vellum)
- Mix of hobbyists and semi-professionals seeking monetization
- Age 18-40, comfortable with technology

**Pain Points:**
- Plot holes accumulate over hundreds of chapters
- Character consistency breaks down (忘了自己写过什么)
- AI-generated content feels hollow, readers drop off
- No good tools for managing million-word narratives
- Context window limits make AI "forget" earlier story

**Goals:**
- Write faster without sacrificing quality
- Maintain consistency across 1000+ chapters
- Build reader-sticky stories that convert to paid subscribers
- Leverage AI without losing their creative voice

### 2.2 Secondary Persona: The AI-First Creator

Heavy AI users who want AI to do more heavy lifting but find outputs generic. Goals: Learn storytelling craft through AI assistance, produce commercially viable content efficiently.

### 2.3 Tertiary Persona: The Learning Writer

Aspiring authors wanting to improve, seeking structured guidance. Goals: Understand what makes stories work, complete a full-length novel, develop repeatable creative process.

---

## 3. Product Positioning

| Market | Product Name | Tagline | Key Message |
|--------|-------------|---------|-------------|
| 中国 | Inxtone 砚台 | 让AI学会讲故事 | 网文创作的AI基建，从人设到大纲到正文，系统性提升AI协作质量 |
| International | Inxtone | AI-Native Storytelling | The framework that turns AI into a story architect, not just a text generator |

**Competitive Differentiation:**
- vs. Sudowrite/NovelAI: Structured methodology, not just generation; **open source**
- vs. Notion/Scrivener: AI-native, built for serial fiction scale
- vs. ChatGPT/Claude direct: Persistent story memory, quality guardrails
- vs. 各种AI写作助手: 不是"一键生成"，而是"系统协作"
- vs. Web-based tools: **Local-first, own your data, no subscription fees**

---

## See Also

- [Features.md](Features.md) - Core functionalities
- [Technical.md](Technical.md) - Architecture details
