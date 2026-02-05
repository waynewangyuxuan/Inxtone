# UI Components

> Buttons, cards, terminal boxes, tags, and navigation

**Parent**: [Design/Meta.md](Meta.md)
**Lines**: ~200 | **Updated**: 2026-02-05

---

## Buttons

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

---

## Cards

```css
.card {
    background: linear-gradient(135deg,
        rgba(255,255,255,0.03) 0%,
        rgba(255,255,255,0.01) 100%
    );
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 4px;
    padding: 2rem;
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

---

## Tags/Pills

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

---

## Terminal Box

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

---

## Icon Containers

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

---

## File Tree

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

---

## Navigation Links

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

## See Also

- [Foundations.md](Foundations.md) - Colors, typography
- [Animation.md](Animation.md) - Motion and effects
