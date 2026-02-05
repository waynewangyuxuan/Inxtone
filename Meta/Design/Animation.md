# Animation & Effects

> Motion system, reveal animations, and interactive effects

**Parent**: [Design/Meta.md](Meta.md)
**Lines**: ~170 | **Updated**: 2026-02-05

---

## Timing Functions

```css
/* Standard easing */
transition: all 0.3s ease;

/* GSAP entrance */
ease: 'power3.out'  /* smooth deceleration */

/* Scroll-linked */
ease: 'none'  /* Linear for progress indicators */
```

---

## Reveal Animations

### Base State
```css
.reveal {
    opacity: 0;
    transform: translateY(30px);
}

.reveal.visible {
    opacity: 1;
    transform: translateY(0);
}
```

### GSAP Configuration
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

---

## Micro-interactions

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

/* Hover expansion */
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
    animation: grainShift 0.5s steps(10) infinite;
}
```

### Ink Canvas

Interactive ink splash effect responding to mouse movement and clicks.

**Behavior:**
- Splashes appear on click (intensity: 1.5)
- Small drops trail fast mouse movement (speed > 5px)
- Drops expand, drift slightly, then fade

**Visual Properties:**
- Base size: 4-10px, max 3-5x growth
- Opacity: 0.3-0.5, decay rate 0.004-0.006
- Color: Gold (`rgba(201, 168, 108, ...)`)

### Custom Cursor
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

## See Also

- [Components.md](Components.md) - UI components
- [Patterns.md](Patterns.md) - Implementation patterns
