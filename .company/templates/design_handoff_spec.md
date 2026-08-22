# Design-to-Code Handoff Specification

## Overview

This document defines the structured handoff contract between **Agent 7 (UI Designer)**, **Agent 8 (UX Researcher)**, and **Agent 2 (Lead Developer)**. Every design specification MUST conform to this schema to ensure zero-ambiguity translation from design to code.

---

## 1. Design Tokens

### File: `.company/design/tokens.json`

```json
{
  "meta": {
    "project": "<project-name>",
    "version": "1.0.0",
    "generated_by": "Agent 7 - UI Designer",
    "date": "<ISO-8601-date>"
  },
  "colors": {
    "primary": { "50": "#eff6ff", "100": "#dbeafe", "200": "#bfdbfe", "300": "#93c5fd", "400": "#60a5fa", "500": "#3b82f6", "600": "#2563eb", "700": "#1d4ed8", "800": "#1e40af", "900": "#1e3a5f" },
    "secondary": { "50": "#faf5ff", "100": "#f3e8ff", "200": "#e9d5ff", "300": "#d8b4fe", "400": "#c084fc", "500": "#a855f7", "600": "#9333ea", "700": "#7e22ce", "800": "#6b21a8", "900": "#581c87" },
    "neutral": { "50": "#fafafa", "100": "#f5f5f5", "200": "#e5e5e5", "300": "#d4d4d4", "400": "#a3a3a3", "500": "#737373", "600": "#525252", "700": "#404040", "800": "#262626", "900": "#171717" },
    "semantic": {
      "success": { "light": "#bbf7d0", "default": "#22c55e", "dark": "#15803d" },
      "warning": { "light": "#fef08a", "default": "#f59e0b", "dark": "#b45309" },
      "error": { "light": "#fecaca", "default": "#ef4444", "dark": "#b91c1c" },
      "info": { "light": "#bfdbfe", "default": "#3b82f6", "dark": "#1d4ed8" }
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "Inter, system-ui, -apple-system, sans-serif",
      "serif": "Merriweather, Georgia, serif",
      "mono": "JetBrains Mono, Fira Code, monospace"
    },
    "scale": {
      "xs": { "size": "0.75rem", "lineHeight": "1rem" },
      "sm": { "size": "0.875rem", "lineHeight": "1.25rem" },
      "base": { "size": "1rem", "lineHeight": "1.5rem" },
      "lg": { "size": "1.125rem", "lineHeight": "1.75rem" },
      "xl": { "size": "1.25rem", "lineHeight": "1.75rem" },
      "2xl": { "size": "1.5rem", "lineHeight": "2rem" },
      "3xl": { "size": "1.875rem", "lineHeight": "2.25rem" },
      "4xl": { "size": "2.25rem", "lineHeight": "2.5rem" }
    },
    "fontWeight": {
      "light": "300", "normal": "400", "medium": "500",
      "semibold": "600", "bold": "700", "extrabold": "800"
    }
  },
  "spacing": {
    "0": "0px", "px": "1px",
    "xs": "0.25rem", "sm": "0.5rem", "md": "1rem",
    "lg": "1.5rem", "xl": "2rem", "2xl": "3rem", "3xl": "4rem"
  },
  "breakpoints": {
    "sm": "640px", "md": "768px", "lg": "1024px",
    "xl": "1280px", "2xl": "1536px"
  },
  "shadows": {
    "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
  },
  "borderRadius": {
    "none": "0px", "sm": "0.125rem", "md": "0.375rem",
    "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px"
  },
  "zIndex": {
    "base": "0", "dropdown": "50", "sticky": "100",
    "overlay": "150", "modal": "200", "tooltip": "300", "toast": "400"
  },
  "animation": {
    "duration": { "fast": "150ms", "normal": "200ms", "slow": "300ms" },
    "easing": {
      "default": "cubic-bezier(0.4, 0, 0.2, 1)",
      "in": "cubic-bezier(0.4, 0, 1, 1)",
      "out": "cubic-bezier(0, 0, 0.2, 1)",
      "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)"
    }
  }
}
```

---

## 2. Component Specification

### File: `.company/design/components/<component-name>.md`

```markdown
## Component: <Name> v<version>

### Designer: Agent 7 — UI Designer
### UX Reviewer: Agent 8 — UX Researcher
### Status: [DRAFT | UX REVIEW | APPROVED | REJECTED]

### 2.1 Purpose
<1-2 sentence description of what this component does>

### 2.2 Anatomy
```
┌─────────────────────────────────────┐
│  [Icon]  Label Text          [Badge] │
│         ┌───────────────────┐        │
│         │   Content area    │        │
│         └───────────────────┘        │
│  [Button]                    [Link]  │
└─────────────────────────────────────┘
```

### 2.3 Dimensions
| Property | Value | Token Reference |
|----------|-------|-----------------|
| Width | <fixed/fluid/min/max> | — |
| Min Height | <value> | — |
| Padding | <value> | spacing.<token> |
| Gap between children | <value> | spacing.<token> |
| Border radius | <value> | borderRadius.<token> |

### 2.4 States

| State | Visual | CSS Pseudo | Timing | Accessibility |
|-------|--------|------------|--------|---------------|
| **Default** | bg-white, border-gray-200, text-gray-900 | — | — | — |
| **Hover** | bg-gray-50, shadow-sm, scale(1.02) | `:hover` | 150ms ease-out | — |
| **Active** | bg-gray-100, scale(0.98) | `:active` | 100ms ease-in | — |
| **Focus** | ring-2 ring-primary-500 ring-offset-2 | `:focus-visible` | — | Keyboard navigation |
| **Disabled** | opacity-50, grayscale, cursor-not-allowed | `:disabled` | — | aria-disabled="true" |
| **Loading** | skeleton animation, pulse | `.loading` class | 1.5s infinite | aria-busy="true" |
| **Error** | border-red-500, bg-red-50, error icon | `.error` class | — | aria-invalid="true", aria-describedby |
| **Empty** | dashed border, placeholder illustration | `.empty` class | — | role="status" |

### 2.5 Responsive Behavior

| Breakpoint | Width | Layout Change | Hidden Elements |
|------------|-------|---------------|-----------------|
| < sm (mobile) | 100% - 2rem margins | Stack vertically | Secondary nav |
| sm - md (tablet) | max-w-xl | 2-column grid | — |
| md - lg (desktop) | max-w-4xl | 3-column grid | — |
| > lg (wide) | max-w-7xl | Full layout | — |

### 2.6 Micro-Interactions

```css
/* Transitions */
.component {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.component:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: all 150ms ease-out;
}

.component:active {
  transform: scale(0.98);
  transition: all 100ms ease-in;
}

.component:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #3b82f6, 0 0 0 4px white;
}
```

### 2.7 Accessibility Requirements

- [ ] Role attribute: `<role>`
- [ ] ARIA label: `<label>`
- [ ] Keyboard navigation: Tab, Enter, Escape, Arrow keys
- [ ] Screen reader announcement on state change: `aria-live="polite"`
- [ ] Touch target minimum: 44x44px
- [ ] Focus order: Linear, top-to-bottom, left-to-right

---

## 3. Layout Wireframe

### File: `.company/design/layouts/<page-name>.md`

```markdown
## Layout: <Page Name> v<version>

### 3.1 Grid System
- Framework: <Tailwind CSS Grid / CSS Grid / Flexbox>
- Columns: <12 | 8 | 4 | custom>
- Gutter: spacing.<token>
- Max Width: breakpoint.<token>
- Container padding: spacing.<token>

### 3.2 Section Hierarchy
```
┌─────────────────────────────────────────────────┐
│ Header                                           │
│ h: 64px, sticky top-0, z-index: zIndex.sticky   │
│ bg-white, border-b, shadow-sm                    │
├─────────────────────────────────────────────────┤
│ Hero Section                                     │
│ min-h: 400px, flex centered, px-spacing.lg       │
│ bg-gradient-to-r from-primary-500 to-primary-700 │
├─────────────────────────────────────────────────┤
│ Content Grid                                     │
│ lg: grid-cols-3 gap-spacing.lg                   │
│ md: grid-cols-2 gap-spacing.md                   │
│ sm: grid-cols-1 gap-spacing.sm                   │
│ px-spacing.lg, max-w-7xl mx-auto                 │
├─────────────────────────────────────────────────┤
│ Footer                                           │
│ bg-neutral-900 text-white, py-spacing.xl         │
│ border-t border-neutral-700                      │
└─────────────────────────────────────────────────┘
```

### 3.3 Z-Index Stacking

| Layer | Element | z-index Token |
|-------|---------|---------------|
| Base | Page content | zIndex.base |
| Header | Sticky navigation bar | zIndex.sticky |
| Dropdown | Navigation menus, autocomplete | zIndex.dropdown |
| Overlay | Modal/lightbox backdrop | zIndex.overlay |
| Modal | Dialog, confirmation | zIndex.modal |
| Tooltip | Hover tooltips, popovers | zIndex.tooltip |
| Toast | Notifications, alerts | zIndex.toast |

---

## 4. Tailwind Config Extension

### File: `.company/design/tailwind.design.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
          300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6',
          600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a5f',
        },
        secondary: {
          50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff',
          300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7',
          600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'skeleton': 'skeleton 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        skeleton: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
};
```

---

## 5. Design Verification Checklist

Before Agent 2 (Lead Developer) accepts the handoff:

```markdown
### Tokens
- [ ] All color tokens defined (primary, secondary, neutral, semantic)
- [ ] Typography scale complete (xs through 4xl)
- [ ] Spacing scale complete (0 through 3xl)
- [ ] Breakpoints defined (sm, md, lg, xl, 2xl)
- [ ] Shadow tokens defined (sm, md, lg, xl)
- [ ] Border radius tokens defined
- [ ] Z-index tokens defined
- [ ] Animation tokens defined (duration, easing)

### Components
- [ ] Component anatomy diagram included
- [ ] All 8 states specified (default, hover, active, focus, disabled, loading, error, empty)
- [ ] Responsive behavior at every breakpoint
- [ ] Micro-interaction CSS/Tailwind provided
- [ ] Accessibility requirements listed
- [ ] Touch targets ≥ 44x44px

### Layout
- [ ] Grid system specified
- [ ] Section hierarchy diagram included
- [ ] Z-index stacking documented
- [ ] Container max-width and padding specified
- [ ] Responsive breakpoint behavior detailed

### UX Review (Agent 8 sign-off)
- [ ] User journey mapped
- [ ] State coverage matrix complete
- [ ] WCAG AA compliance verified
- [ ] Friction points documented with mitigations
- [ ] Error recovery paths defined
```

## Approval Block

```markdown
## Design Handoff Approval

| Role | Agent | Signature | Date |
|------|-------|-----------|------|
| UI Designer | Agent 7 | ✅ / ❌ | <date> |
| UX Researcher | Agent 8 | ✅ / ❌ | <date> |
| Lead Developer | Agent 2 | ✅ / ❌ | <date> |
| CEO | Main LLM | ✅ / ❌ | <date> |

**Status:** [PENDING | APPROVED | CHANGES REQUESTED]
**Next Action:** <who needs to do what next>
