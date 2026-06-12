# Skill: Component Builder

## Purpose
This skill guide details how to build reusable UI components for MeCal. It ensures consistency in styling, responsiveness, and architecture according to the project's strict design rules.

## Core Rules
- **Framework**: React 18 with Vite.
- **Styling**: CSS Modules only. No inline styles, no Tailwind, no styled-components.
- **Design Tokens**: All colors, spacing, and typography must use the CSS custom properties defined in `src/styles/tokens.css`.
- **Icons**: Use `lucide-react` (outline style only).
- **Spacing Grid**: Follow an 8pt spacing grid (all spacing values should be multiples of 8).
- **Responsive**: Mobile-first responsive: base at 375px, breakpoints at 768px and 1024px.
- **Aesthetic**: Calm, supportive, premium-soft wellness. Avoid heavy drop shadows and generic AI gradients.

## Implementation Flow

### 1. File Structure
Every component should live in its own folder within `client/src/components/` (or a subfolder if grouped).
```
MyComponent/
├── MyComponent.jsx
└── MyComponent.module.css
```

### 2. Component Logic (`MyComponent.jsx`)
- Use functional components.
- Keep components focused and reusable.
- Import styles from the CSS Module.
- Example:
  ```jsx
  import React from 'react';
  import styles from './MyComponent.module.css';
  import { Sparkles } from 'lucide-react';

  export const MyComponent = ({ title, description, children }) => {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Sparkles className={styles.icon} size={20} />
          <h3 className={styles.title}>{title}</h3>
        </div>
        <p className={styles.description}>{description}</p>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    );
  };
  ```

### 3. Styling (`MyComponent.module.css`)
- Use CSS Modules for scoped styles.
- Reference variables for tokens.
- Example:
  ```css
  .container {
    padding: var(--spacing-16);
    background-color: var(--color-surface);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-8);
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--spacing-8);
  }

  .icon {
    color: var(--color-primary);
  }

  .title {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  .description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  /* Responsive adjustments */
  @media (min-width: 768px) {
    .container {
      padding: var(--spacing-24);
    }
  }
  ```

## Best Practices
- **Accessibility**: Use semantic HTML elements (e.g., `<button>`, `<header>`, `<nav>`) and ensure proper ARIA attributes where needed.
- **Performance**: Avoid unnecessary re-renders. Keep local UI state in the component and global state in Zustand.
- **Review**: Always read `rules/design-system.md` before writing CSS for a new component.

## Reference Files
- `AGENT.md` (Project rules and structure)
- `rules/design-system.md` (Detailed design rules)
- `rules/code-style.md` (JS/React guidelines)
