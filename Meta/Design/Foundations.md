# Design Foundations

> Colors, typography, and spacing system

**Parent**: [Design/Meta.md](Meta.md)
**Lines**: ~150 | **Updated**: 2026-02-05

---

## Color System

### Core Palette

```css
:root {
    --black: #0a0a0a;      /* Primary background */
    --white: #f0f0eb;      /* Primary text, warm off-white */
    --gray: #888888;       /* Secondary text */
    --gray-dark: #444444;  /* Tertiary text, borders */
    --gold: #c9a86c;       /* Accent, highlights, links */
    --gold-dim: rgba(201, 168, 108, 0.3);  /* Subtle gold */
    --green: #4ade80;      /* Terminal commands, success states */
    --ink: #1a1a1a;        /* Slightly lighter than black, for layers */
}
```

### Usage Guidelines

| Color | Usage |
|-------|-------|
| `--black` | Page backgrounds, card backgrounds |
| `--white` | Headings, primary body text, primary buttons |
| `--gray` | Secondary text, descriptions, placeholders |
| `--gray-dark` | Borders, dividers, disabled states |
| `--gold` | Links, accents, highlights, hover states |
| `--green` | Terminal commands, code, success indicators |

### Gradients

```css
/* Card backgrounds */
background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);

/* Progress bar */
background: linear-gradient(90deg, var(--gold), var(--white));

/* Vertical accent line */
background: linear-gradient(180deg, var(--gold), transparent);
```

### Opacity Patterns

- **03% white** — Card backgrounds
- **06-08% white** — Card borders
- **10% white** — Terminal box borders
- **30% gold** — Dimmed gold accents

---

## Typography

### Font Stack

```css
/* Primary UI font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Code/Terminal font */
font-family: 'JetBrains Mono', 'Menlo', 'Monaco', monospace;
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Hero Title | `clamp(2.5rem, 8vw, 5rem)` | 300 | 1.1 |
| Section Title | `clamp(2rem, 4vw, 3rem)` | 300 | 1.2 |
| Card Title | `1.125rem - 1.5rem` | 400-500 | 1.3 |
| Body | `0.875rem - 1rem` | 300-400 | 1.7-1.8 |
| Navigation | `0.75rem` | 500 | 1 |
| Labels/Tags | `0.7rem` | 400 | 1 |
| Code | `0.8-0.9rem` | 400 | 1.6 |

### Weight Usage

- **300 (Light)** — Large headings, body text
- **400 (Regular)** — Most UI text
- **500 (Medium)** — Navigation, card headings
- **600 (Semibold)** — Hero background text only

---

## Spacing System

### Base Unit: 4px (0.25rem)

```
4px   (0.25rem)  — xs
8px   (0.5rem)   — sm
12px  (0.75rem)  — md
16px  (1rem)     — base
24px  (1.5rem)   — lg
32px  (2rem)     — xl
48px  (3rem)     — 2xl
64px  (4rem)     — 3xl (section padding)
128px (8rem)     — 4xl (vertical section spacing)
```

### Section Spacing

- **Horizontal padding:** `4rem` desktop, `2rem` mobile
- **Vertical section spacing:** `8rem`
- **Grid gaps:** `2rem` (cards), `3rem` (features)

---

## See Also

- [Components.md](Components.md) - UI component styles
- [Animation.md](Animation.md) - Motion system
