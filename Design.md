# Inkstone Design Language

A comprehensive design system for the Inkstone CLI + Web UI. This document defines the visual language, components, and patterns used across all Inkstone interfaces.

---

## Philosophy

**"Ink meets silicon."**

Inkstone's design merges traditional East Asian calligraphy aesthetics with modern CLI/developer tool sensibilities. The result is a dark, sophisticated interface that feels both literary and technical.

### Design Principles

1. **Local-First Aesthetic** — Dark backgrounds, terminal-inspired elements, emphasize ownership and control
2. **Ink as Interaction** — Subtle ink splatter effects respond to user actions, connecting to the writing theme
3. **Minimal but Expressive** — High contrast, ample white space, selective use of accent colors
4. **Typography-Forward** — Clean sans-serif for UI, monospace for code/commands
5. **Progressive Disclosure** — Reveal complexity gradually through animation and scroll

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

| Color        | Usage |
|--------------|-------|
| `--black`    | Page backgrounds, card backgrounds |
| `--white`    | Headings, primary body text, primary buttons |
| `--gray`     | Secondary text, descriptions, placeholders |
| `--gray-dark`| Borders, dividers, disabled states |
| `--gold`     | Links, accents, highlights, hover states |
| `--green`    | Terminal commands, code, success indicators |

### Gradients

```css
/* Card backgrounds */
background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);

/* Section backgrounds */
background: linear-gradient(180deg, var(--black) 0%, #0d0d0d 50%, var(--black) 100%);

/* Progress bar */
background: linear-gradient(90deg, var(--gold), var(--white));

/* Vertical accent line */
background: linear-gradient(180deg, var(--gold), transparent);
```

### Opacity Patterns

- **03% white** — Card backgrounds
- **06-08% white** — Card borders
- **10% white** — Terminal box borders
- **15% white** — Secondary button borders
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

| Element | Size | Weight | Letter Spacing | Line Height |
|---------|------|--------|----------------|-------------|
| Hero Title | `clamp(2.5rem, 8vw, 5rem)` | 300 | 0 | 1.1 |
| Section Title | `clamp(2rem, 4vw, 3rem)` | 300 | 0 | 1.2 |
| Card Title | `1.125rem - 1.5rem` | 400-500 | 0 | 1.3 |
| Body | `0.875rem - 1rem` | 300-400 | 0 | 1.7-1.8 |
| Navigation | `0.75rem` | 500 | 0.1-0.3em | 1 |
| Labels/Tags | `0.7rem` | 400 | 0.1-0.2em | 1 |
| Code | `0.8-0.9rem` | 400 | 0 | 1.6 |

### Weight Usage

- **300 (Light)** — Large headings, body text, elegant feel
- **400 (Regular)** — Most UI text
- **500 (Medium)** — Navigation, card headings, emphasis
- **600 (Semibold)** — Hero background text only

### Special Typography Treatments

```css
/* All caps with letter spacing for labels */
.label {
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
}

/* Section numbering */
.section-number {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: var(--gold);
}

/* Emphasized text within headings */
em, .highlight {
    font-style: normal;
    color: var(--gold);
}
```

---

## Spacing System

### Base Unit

All spacing derives from a **4px** base unit (0.25rem at 16px root).

### Scale

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

## Components

### Buttons

```css
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    border-radius: 4px;
    transition: all 0.3s ease;
}

/* Primary - filled */
.btn-primary {
    background: var(--white);
    color: var(--black);
    border: 1px solid var(--white);
}
.btn-primary:hover {
    background: var(--gold);
    border-color: var(--gold);
}

/* Secondary - outlined */
.btn-secondary {
    background: transparent;
    color: var(--white);
    border: 1px solid rgba(255,255,255,0.3);
}
.btn-secondary:hover {
    border-color: var(--white);
}
```

### Cards

```css
.card {
    background: linear-gradient(135deg,
        rgba(255,255,255,0.03) 0%,
        rgba(255,255,255,0.01) 100%
    );
    border: 1px solid rgba(255,255,255,0.06-0.08);
    border-radius: 4px;
    padding: 2rem - 2.5rem;
    transition: border-color 0.3s ease;
}
.card:hover {
    border-color: var(--gold-dim);
}

/* Feature card with accent line */
.feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(180deg, var(--gold), transparent);
}
```

### Tags/Pills

```css
.tag {
    font-size: 0.7rem;
    padding: 0.4rem 0.8rem;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 2rem;
    letter-spacing: 0.05em;
}

/* Badge with indicator */
.badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--gold);
    padding: 0.5rem 1rem;
    border: 1px solid var(--gold-dim);
    border-radius: 2rem;
}
.badge::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--green);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
}
```

### Terminal Box

```css
.terminal-box {
    background: linear-gradient(135deg,
        rgba(255,255,255,0.03) 0%,
        rgba(255,255,255,0.01) 100%
    );
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 1.5rem;
}

/* Window controls */
.terminal-header {
    display: flex;
    gap: 0.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 1rem;
}

.terminal-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}
.terminal-dot.red { background: #ff5f56; }
.terminal-dot.yellow { background: #ffbd2e; }
.terminal-dot.green { background: #27ca40; }

/* Command styling */
.command {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
}
.command .prompt { color: var(--gold); }
.command .cmd { color: var(--green); }
```

### Icon Containers

```css
.icon-circle {
    width: 48px;
    height: 48px;
    border: 1px solid var(--gold-dim);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.icon-circle svg {
    width: 20px;
    height: 20px;
    stroke: var(--gold);
    stroke-width: 1.5;
    fill: none;
}

/* Numbered step */
.step-number {
    width: 64px;
    height: 64px;
    border: 1px solid var(--gold-dim);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 300;
    color: var(--gold);
}
```

### File Tree

```css
.file-tree {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    line-height: 1.8;
    background: linear-gradient(135deg,
        rgba(255,255,255,0.03) 0%,
        rgba(255,255,255,0.01) 100%
    );
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 2rem;
}
.file-tree .folder { color: var(--gold); }
.file-tree .file { color: var(--gray); }
.file-tree .comment { color: var(--gray-dark); }
```

### Navigation Links

```css
.nav-link {
    color: var(--white);
    text-decoration: none;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    position: relative;
}
.nav-link::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--gold);
    transition: width 0.3s ease;
}
.nav-link:hover::after {
    width: 100%;
}
```

---

## Animation & Motion

### Timing Functions

```css
/* Standard easing */
transition: all 0.3s ease;

/* Entrance animations */
ease: 'power3.out'  /* GSAP - smooth deceleration */

/* Scroll-linked */
ease: 'none'  /* Linear for progress indicators */
```

### Reveal Animations

```css
/* Base state */
.reveal {
    opacity: 0;
    transform: translateY(30px);
}

/* Revealed state (via GSAP ScrollTrigger) */
.reveal.visible {
    opacity: 1;
    transform: translateY(0);
}
```

**GSAP Configuration:**
```javascript
gsap.fromTo(element,
    { opacity: 0, y: 30 },
    {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
        }
    }
);
```

### Micro-interactions

```css
/* Pulse animation for status indicators */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

/* Scroll line animation */
@keyframes scrollLine {
    0% { left: -100%; }
    50% { left: 100%; }
    100% { left: 100%; }
}

/* Hover expansion for cursor */
.cursor {
    transition: transform 0.1s ease, width 0.3s, height 0.3s;
}
.cursor.hover {
    width: 60px;
    height: 60px;
}
```

---

## Effects & Overlays

### Film Grain

Subtle analog texture overlay for depth.

```css
.grain {
    position: fixed;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    pointer-events: none;
    z-index: 9997;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,..."); /* noise filter */
    animation: grainShift 0.5s steps(10) infinite;
}
```

### Ink Canvas

Interactive ink splash effect responding to mouse movement and clicks.

**Behavior:**
- Splashes appear on click (intensity: 1.5)
- Small drops trail fast mouse movement (speed > 5px)
- Drops expand, drift slightly, then fade
- Uses radial gradient from gold center to transparent

**Visual Properties:**
- Base size: 4-10px, max 3-5x growth
- Opacity: 0.3-0.5, decay rate 0.004-0.006
- Irregular edges via vertex displacement
- Color: Gold (`rgba(201, 168, 108, ...)`)

### Custom Cursor

Replace default cursor with a custom circle + dot.

```css
.cursor {
    width: 20px;
    height: 20px;
    border: 1px solid var(--white);
    border-radius: 50%;
    mix-blend-mode: difference;
}
.cursor-dot {
    width: 4px;
    height: 4px;
    background: var(--white);
    border-radius: 50%;
    mix-blend-mode: difference;
}
```

**Behavior:**
- Dot follows cursor exactly
- Circle follows with 0.1 lerp delay
- Expands to 60px on interactive elements
- Border changes to gold on hover

### Progress Bar

Scroll-linked progress indicator at top of viewport.

```css
.progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--white));
    transform-origin: left;
    transform: scaleX(0);
}
```

---

## Iconography

### Style Guidelines

- **Stroke-based** icons (not filled)
- **Stroke width:** 1.5-2px
- **Default size:** 16-20px
- **Color:** Usually `var(--gold)` or `currentColor`

### Common Icons (SVG)

```html
<!-- Document/File -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
</svg>

<!-- Git/Version Control -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="12" cy="12" r="4"/>
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>
</svg>

<!-- Lock/Security -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>

<!-- Checkmark -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="20 6 9 17 4 12"/>
</svg>

<!-- GitHub -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
</svg>
```

---

## Responsive Design

### Breakpoints

```css
/* Desktop: default */
/* Tablet: 1024px */
/* Mobile: 768px */

@media (max-width: 1024px) {
    /* 3-col → 2-col grids */
}

@media (max-width: 768px) {
    /* 2-col → 1-col grids */
    /* Reduce horizontal padding: 4rem → 2rem */
    /* Hide desktop navigation */
    /* Disable custom cursor */
}
```

### Grid Adjustments

| Breakpoint | Why Grid | How Grid | Features Grid |
|------------|----------|----------|---------------|
| Desktop    | 3-col    | 4-col    | 2-col         |
| Tablet     | 2-col    | 2-col    | 1-col         |
| Mobile     | 1-col    | 1-col    | 1-col         |

### Mobile Considerations

- Disable custom cursor (restore `cursor: auto`)
- Stack CTAs vertically
- Reduce padding to 2rem
- Hide navigation links (consider hamburger menu)
- Ensure touch targets ≥ 44px

---

## Accessibility

### Color Contrast

- Primary text (`--white` on `--black`): ~18:1 ratio ✓
- Secondary text (`--gray` on `--black`): ~5:1 ratio ✓
- Gold accents (`--gold` on `--black`): ~7:1 ratio ✓

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    .grain { display: none; }
    #inkCanvas { display: none; }
}
```

### Focus States

```css
:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
}
```

---

## Implementation Notes

### Required Libraries

```html
<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<!-- Animation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
```

### Z-Index Scale

```
Progress Bar:  10000
Cursor:         9999
Grain Overlay:  9997
Ink Canvas:     9996
Navigation:      100
Content:           1
Background:        0
```

### Performance Tips

1. Use `transform` and `opacity` for animations (GPU-accelerated)
2. Limit ink drops array size (filter dead particles)
3. Use `will-change: transform` sparingly
4. Debounce resize handlers
5. Use `mix-blend-mode: difference` carefully (can impact performance)

---

## Quick Reference

### CSS Custom Properties

```css
:root {
    /* Colors */
    --black: #0a0a0a;
    --white: #f0f0eb;
    --gray: #888888;
    --gray-dark: #444444;
    --gold: #c9a86c;
    --gold-dim: rgba(201, 168, 108, 0.3);
    --green: #4ade80;
    --ink: #1a1a1a;

    /* Typography */
    --font-sans: 'Inter', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    /* Transitions */
    --transition-fast: 0.1s ease;
    --transition-normal: 0.3s ease;
    --transition-slow: 0.8s ease;
}
```

---

*Last updated: February 2026*
*Version: 1.0.0*
