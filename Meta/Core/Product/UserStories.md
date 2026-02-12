# User Stories

> User stories organized by workflow phase

**Parent**: [Product/Meta.md](Meta.md)
**Lines**: ~240 | **Updated**: 2026-02-05

---

## 5.1 Onboarding & Setup

**US-001: Quick Start**
As a new writer, I want to install Inxtone and start a project quickly so that I can begin writing without friction.

*Acceptance Criteria:*
- Install via brew/cargo in one command
- `inxtone init my-novel` creates project structure
- `inxtone serve` opens browser with welcome tutorial
- First chapter creatable within 2 minutes

**US-002: Import Existing Work** `[M6 — Smart Intake]`
As a writer with an in-progress novel, I want to import my existing chapters and notes so that I can use Inxtone without starting over.

*Acceptance Criteria:*
- Upload/paste chapter files (TXT/MD/DOCX) or bulk text
- AI extracts characters, relationships, world rules, plot threads from imported content
- Step-by-step review: AI suggests → writer confirms/edits → commit to Story Bible
- Natural language descriptions also accepted (paste character sketch → structured card)
- Outline import → auto-populate arc structure and chapter goals
- Original content preserved exactly

*Note: M6 scope, not part of MVP. See [M6.md](../../Milestone/M6.md), [ADR-0003](../../Decisions/ADR-0003-milestone-reorder-smart-intake.md).*

**US-002b: Configure AI**
As a writer, I want to set up my Gemini API key easily so that I can use AI features.

*Acceptance Criteria:*
- `inxtone config set api-key` prompts for key
- Key stored securely in ~/.inxtone/config.toml
- Clear error message if key is invalid

---

## 5.2 Story Bible Creation

**US-003: Character Creation**
As a writer, I want to create detailed character profiles using guided templates so that AI can maintain character consistency.

*Acceptance Criteria:*
- Template prompts for appearance, personality, motivation (3 layers)
- Can add custom fields
- Visual relationship mapping
- AI can suggest missing details

**US-004: World Building**
As a writer, I want to define my world's rules systematically so that AI never generates content that breaks these rules.

*Acceptance Criteria:*
- Structured templates for magic/power systems
- Faction relationship builder
- Location registry with tags
- Rules explicitly codified (not prose)

**US-005: Plot Outlining**
As a writer, I want to outline my story at multiple levels (arc → chapter → scene) so that I always know where the story is going.

*Acceptance Criteria:*
- Nested outline structure
- Drag-and-drop reordering
- Foreshadowing links between outline items
- Progress percentage per arc

---

## 5.3 Writing Workflow

**US-006: Start Writing Session**
As a writer, I want to quickly resume where I left off so that I can maximize writing time.

*Acceptance Criteria:*
- Dashboard shows current chapter, word count, daily goal
- One-click to continue writing
- Recent AI conversations preserved

**US-007: AI-Assisted Drafting**
As a writer, I want AI to help me write while respecting my story's established elements so that generated content is consistent and useful.

*Acceptance Criteria:*
- AI automatically receives relevant Story Bible context
- Can select specific characters/locations to include
- Generated content matches story tone
- Easy accept/reject/edit workflow

**US-008: Dialogue Writing**
As a writer, I want to generate dialogue that sounds like my characters so that each character has a distinct voice.

*Acceptance Criteria:*
- Select participants from character list
- AI references voice samples and personality
- Multiple dialogue options generated

**US-009: Scene Continuation**
As a writer stuck mid-scene, I want AI to suggest how to continue so that I can overcome writer's block.

*Acceptance Criteria:*
- "Continue" button in editor
- AI reads recent paragraphs + scene outline
- Generates 2-3 continuation options

---

## 5.4 Quality & Consistency

**US-010: Consistency Check**
As a writer, I want to verify my chapter doesn't contradict earlier content so that readers don't find plot holes.

*Acceptance Criteria:*
- Run check on draft chapter
- AI compares against Story Bible + previous chapters
- Lists potential contradictions with references
- Can mark issues as "intentional" or "needs fix"

**US-011: Foreshadowing Management**
As a writer, I want to track all planted story seeds so that I never forget to pay them off.

*Acceptance Criteria:*
- Log foreshadowing when writing
- Link to planned payoff chapter/scene
- Alert when approaching payoff point
- Dashboard of open vs. resolved threads

**US-012: Character Arc Tracking**
As a writer, I want to visualize each character's growth over the story so that arcs feel complete and satisfying.

*Acceptance Criteria:*
- Timeline view of character moments
- Tag moments as "growth", "setback", "revelation"
- AI suggests if arc feels incomplete

---

## 5.5 Long-form Management

**US-013: Chapter Navigation**
As a writer with 500+ chapters, I want to quickly find and reference earlier content so that I can maintain consistency.

*Acceptance Criteria:*
- Chapter list with search
- Filter by character appearance, location, plot arc
- Quick preview without leaving editor

**US-014: Story Bible Search**
As a writer, I want to search across all my story notes so that I can quickly find established facts.

*Acceptance Criteria:*
- Full-text search across Story Bible
- Search by entity type (character, location, etc.)
- AI-powered "ask about my story" feature

**US-015: Context Window Management**
As a writer using AI for a 1M+ word novel, I want AI to "remember" my entire story so that suggestions are always relevant.

*Acceptance Criteria:*
- Story Bible auto-summarized for AI context
- Recent chapter summaries maintained
- Relevant historical content retrieved on-demand

---

## 5.6 Export & Publishing

**US-016: Export to TXT/Word**
As a writer, I want to export my chapters as plain text or Word document so that I can upload to publishing platforms.

*Acceptance Criteria:*
- Select chapters to export
- Choose format: TXT or DOCX
- Configurable formatting (chapter titles, separators)
- Preserves Chinese/Unicode correctly

---

## See Also

- [Features.md](Features.md) - Feature specifications
- [Interfaces.md](Interfaces.md) - UI mockups
