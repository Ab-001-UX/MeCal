# design-system.md — MeCal

## Guiding Principle

MeCal should feel calm, warm, and intelligent — like a supportive friend who knows nutrition, not a clinical health dashboard. Every visual decision should reinforce that.

---

## Token File

All design tokens live in one file: `client/src/styles/tokens.css`
All other CSS files consume tokens via `var()` — never hardcode values.

```css
/* client/src/styles/tokens.css */

:root {

  /* ─── Color — Primitives ─── */
  --color-green-50: #F0FBF4;
  --color-green-100: #D6F5E0;
  --color-green-500: #3DAA6A;
  --color-green-600: #2E8F57;
  --color-green-900: #0F3D24;

  --color-amber-50: #FFF9ED;
  --color-amber-100: #FDEDC8;
  --color-amber-500: #F5A623;
  --color-amber-600: #D4891A;

  --color-blue-50: #EEF6FF;
  --color-blue-100: #CCE4FF;
  --color-blue-500: #3A8EE6;
  --color-blue-600: #2B72C2;

  --color-neutral-0:   #FFFFFF;
  --color-neutral-50:  #F8F8F6;
  --color-neutral-100: #F0EFEC;
  --color-neutral-200: #E2E0DB;
  --color-neutral-300: #C8C5BE;
  --color-neutral-400: #9E9B94;
  --color-neutral-500: #6E6C67;
  --color-neutral-700: #3A3935;
  --color-neutral-900: #1A1917;

  --color-red-50:  #FFF2F2;
  --color-red-500: #E04E4E;

  /* ─── Color — Semantic ─── */
  --color-bg-base:       var(--color-neutral-0);
  --color-bg-soft:       var(--color-neutral-50);
  --color-bg-subtle:     var(--color-neutral-100);

  --color-text-primary:  var(--color-neutral-900);
  --color-text-secondary:var(--color-neutral-500);
  --color-text-disabled: var(--color-neutral-300);
  --color-text-inverse:  var(--color-neutral-0);

  --color-primary:       var(--color-green-500);
  --color-primary-hover: var(--color-green-600);
  --color-primary-soft:  var(--color-green-50);

  --color-calorie:       var(--color-amber-500);
  --color-calorie-soft:  var(--color-amber-50);

  --color-hydration:     var(--color-blue-500);
  --color-hydration-soft:var(--color-blue-50);

  --color-success:       var(--color-green-500);
  --color-success-soft:  var(--color-green-50);
  --color-error:         var(--color-red-500);
  --color-error-soft:    var(--color-red-50);

  --color-border:        var(--color-neutral-200);
  --color-border-strong: var(--color-neutral-300);

  /* ─── Typography ─── */
  --font-family-base: 'Inter', system-ui, -apple-system, sans-serif;

  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-md:   1rem;      /* 16px — base */
  --font-size-lg:   1.125rem;  /* 18px */
  --font-size-xl:   1.25rem;   /* 20px */
  --font-size-2xl:  1.5rem;    /* 24px */
  --font-size-3xl:  1.875rem;  /* 30px */
  --font-size-4xl:  2.25rem;   /* 36px */

  --font-weight-regular: 400;
  --font-weight-medium:  500;
  --font-weight-semibold:600;
  --font-weight-bold:    700;

  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed:1.75;

  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;

  /* ─── Spacing — 8pt grid ─── */
  --space-1:  0.25rem;  /* 4px */
  --space-2:  0.5rem;   /* 8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */

  /* ─── Border Radius ─── */
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-full: 9999px;

  /* ─── Shadow ─── */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.10), 0 4px 8px rgba(0, 0, 0, 0.04);

  /* ─── Transitions ─── */
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;

  /* ─── Layout ─── */
  --max-width-app:    430px;
  --nav-height:       64px;
  --safe-area-top:    44px;
  --safe-area-bottom: 34px;
}
```

---

## Typography Usage

| Role | Size token | Weight | Use for |
|---|---|---|---|
| Display | `--font-size-3xl` | Bold | Completion score, big numbers |
| Heading 1 | `--font-size-2xl` | Semibold | Page titles |
| Heading 2 | `--font-size-xl` | Semibold | Section titles |
| Heading 3 | `--font-size-lg` | Medium | Card titles |
| Body | `--font-size-md` | Regular | Default text |
| Body small | `--font-size-sm` | Regular | Secondary info, captions |
| Label | `--font-size-xs` | Medium | Tags, badges, labels |

---

## Spacing Rules

- All spacing values must use `--space-*` tokens — no arbitrary pixel values
- Internal component padding: `--space-4` (16px) default, `--space-6` (24px) for larger cards
- Gap between stacked elements: `--space-3` or `--space-4`
- Page horizontal padding: `--space-4` on mobile, `--space-6` on wider screens
- Section vertical spacing: `--space-8` between major sections

---

## Layout

- App max-width: `var(--max-width-app)` — centered on larger screens
- Mobile-first: base styles at 375px, adjust at 768px
- Bottom navigation height: `var(--nav-height)` — always account for this in page scroll containers
- Use CSS Grid for page-level layout, Flexbox for component-level layout
- Never use fixed pixel widths on containers — use percentages or `max-width`

---

## Component Patterns

### Cards
```css
.card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}
```

### Buttons

Primary:
```css
.buttonPrimary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--radius-full);
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  min-height: 48px;
  width: 100%;
  transition: background var(--transition-fast);
}

.buttonPrimary:hover {
  background: var(--color-primary-hover);
}
```

Secondary:
```css
.buttonSecondary {
  background: var(--color-bg-soft);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: var(--space-3) var(--space-6);
  min-height: 48px;
}
```

Ghost (for skip links and low-priority actions):
```css
.buttonGhost {
  background: transparent;
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
}
```

### Input Fields
```css
.input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  background: var(--color-bg-base);
  width: 100%;
  min-height: 48px;
  transition: border-color var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
}
```

### Feature Color Usage

Use feature-specific colors consistently across all feature surfaces:

| Feature | Color token |
|---|---|
| Calories / Nutrition | `--color-calorie` (amber) |
| Hydration | `--color-hydration` (blue) |
| Movement / Steps | `--color-primary` (green) |
| Error / missed goal | `--color-error` (red) |
| Success / completed | `--color-success` (green) |

---

## Hydration Icons

- Sachet water → cup icon with `--color-hydration` when tapped, `--color-border` when untapped
- Bottled water → bottle icon, same colour logic
- Missed at day end → `--color-error`
- Use Lucide outline icons consistently

---

## Icons

- Library: Lucide React — outline style only, no filled icons
- Default size: 20px for inline, 24px for standalone actions
- Icon colour inherits from parent text colour unless feature-coloured
- Never use icons without a visible label or accessible `aria-label`

---

## Motion and Animation

MeCal should feel alive but never distracting. Motion is used to confirm actions, not to decorate.

- Transitions on interactive elements: `var(--transition-fast)` (150ms)
- Page transitions: `var(--transition-normal)` (250ms) fade or slide
- Blob companion: slow, breathing-style animation — `var(--transition-slow)` or longer
- No bouncing, no spinning loaders for primary actions — use a subtle opacity pulse
- Reduce motion: always respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## CSS Module Rules

- One CSS Module file per component — same name as the component
- Only style what is inside the component — never reach into a child component's internals
- Use descriptive, semantic class names — not utility-style names

```css
/* Wrong */
.mt16 { margin-top: 16px; }
.flexRow { display: flex; }

/* Correct */
.scanHeader { ... }
.confidenceBadge { ... }
.editableField { ... }
```

- Compose related states with data attributes or modifier classes:

```css
.badge { ... }
.badge[data-confidence="high"]   { background: var(--color-success-soft); }
.badge[data-confidence="medium"] { background: var(--color-calorie-soft); }
.badge[data-confidence="low"]    { background: var(--color-error-soft); }
```

---

## States to Always Design

Every interactive component needs all four states accounted for in CSS:

- **Default** — resting state
- **Loading** — skeleton or opacity pulse, never a full-page spinner
- **Empty** — friendly zero state with a helpful prompt, not a blank screen
- **Error** — soft error message using `--color-error`, never a raw error string

---

## What Not to Do

- Do not hardcode hex values anywhere — always use `var(--token-name)`
- Do not use purple gradients, heavy drop shadows, or neon accent colours
- Do not use `px` for spacing — use `--space-*` tokens
- Do not design desktop-first — all base styles are mobile (375px)
- Do not use inline styles in JSX
- Do not add decorative animation to health or progress data — keep it clear and readable
- Do not use filled Lucide icons