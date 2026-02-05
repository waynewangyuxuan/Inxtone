# Implementation Patterns

> Icons, responsive design, accessibility, and implementation notes

**Parent**: [Design/Meta.md](Meta.md)
**Lines**: ~100 | **Updated**: 2026-02-05

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

<!-- Checkmark -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="20 6 9 17 4 12"/>
</svg>
```

---

## Responsive Design

### Breakpoints
```css
/* Desktop: default */
/* Tablet: 1024px */
/* Mobile: 768px */

@media (max-width: 768px) {
    /* Reduce padding: 4rem → 2rem */
    /* Hide custom cursor */
    /* Stack CTAs vertically */
}
```

### Grid Adjustments

| Breakpoint | Why Grid | How Grid | Features |
|------------|----------|----------|----------|
| Desktop | 3-col | 4-col | 2-col |
| Tablet | 2-col | 2-col | 1-col |
| Mobile | 1-col | 1-col | 1-col |

### Mobile Considerations
- Disable custom cursor (`cursor: auto`)
- Ensure touch targets ≥ 44px
- Stack navigation items

---

## Accessibility

### Color Contrast
- Primary text (`--white` on `--black`): ~18:1 ✓
- Secondary text (`--gray` on `--black`): ~5:1 ✓
- Gold accents (`--gold` on `--black`): ~7:1 ✓

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
    .grain, #inkCanvas { display: none; }
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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
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
```

### Performance Tips
1. Use `transform` and `opacity` for animations
2. Limit ink drops array size
3. Use `will-change: transform` sparingly
4. Debounce resize handlers

---

## See Also

- [Animation.md](Animation.md) - Motion system
- [component-preview.html](component-preview.html) - Live preview
