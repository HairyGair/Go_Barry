# Design Tokens - Quick Reference Guide

Fast lookup for using the design system in your components.

---

## 🎨 Colors

### Primary Brand
```css
--color-red-primary:    #E30613    /* Main brand color */
--color-red-dark:       #B80410    /* Hover state */
--color-red-light:      #F5E5E5    /* Light background */
```

### Status Indicators
```css
--color-success:        #10B981    /* ✓ OK / Complete */
--color-warning:        #F59E0B    /* ⚠ Caution / Pending */
--color-critical:       #DC2626    /* ✗ Error / Critical */
--color-info:           #3B82F6    /* ℹ Information */
```

### Text Colors
```css
--color-text-primary:      #111827    /* Main text */
--color-text-secondary:    #6B7280    /* Secondary text */
--color-text-tertiary:     #9CA3AF    /* Muted text */
--color-text-inverse:      #FFFFFF    /* Text on dark */
```

---

## 📏 Spacing

Use for padding, margin, gap:

```css
--spacing-xs:    4px     /* Tiny gaps (within buttons) */
--spacing-sm:    8px     /* Small gaps (between items) */
--spacing-md:    16px    /* Standard padding (cards, inputs) */
--spacing-lg:    24px    /* Large spacing (sections) */
--spacing-xl:    32px    /* Extra large (major spacing) */
--spacing-2xl:   48px    /* Double large */
--spacing-3xl:   64px    /* Triple large (page sections) */
```

### Common Usage
```css
/* Button padding */
padding: var(--spacing-sm) var(--spacing-md);  /* 8px 16px */

/* Card padding */
padding: var(--spacing-lg);  /* 24px */

/* Between sections */
margin-bottom: var(--spacing-xl);  /* 32px */

/* Grid gap */
gap: var(--spacing-lg);  /* 24px */
```

---

## 🔲 Border Radius

```css
--radius-sm:      4px     /* Small buttons, badges */
--radius-md:      8px     /* Standard (most components) */
--radius-lg:      12px    /* Cards, modals */
--radius-xl:      16px    /* Large containers */
--radius-2xl:     20px    /* Extra large */
--radius-full:    9999px  /* Pills, circles */
```

---

## 🌀 Shadows

```css
--shadow-sm:      Subtle (cards) */
--shadow-md:      Medium (default cards) */
--shadow-lg:      Large (elevated) */
--shadow-hover:   Hover lift effect */
--shadow-lift:    Lifting effect */
```

### Usage
```css
.card {
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-hover);
}
```

---

## ⏱️ Transitions

```css
--transition-fast:      150ms ease-out   /* Quick feedback */
--transition-base:      200ms ease-out   /* Standard */
--transition-slow:      300ms ease-out   /* Smooth */
--transition-slowest:   500ms ease-out   /* Gradual */
```

### Usage
```css
.button {
  transition: all var(--transition-base);
}

.button:hover {
  transform: translateY(-2px);
}
```

---

## ✨ Typography

```css
--font-family:    System fonts (Apple, Segoe, Roboto, etc.)
--font-mono:      Monaco, Menlo, Ubuntu Mono

--text-xs:        12px    /* Captions */
--text-sm:        14px    /* Labels, small text */
--text-base:      16px    /* Body text (default) */
--text-lg:        18px    /* Larger text */
--text-xl:        20px    /* Section title */
--text-2xl:       24px    /* Page title */
--text-3xl:       32px    /* Main heading */
--text-4xl:       40px    /* Large heading */

--font-semibold:  600     /* Most text */
--font-bold:      700     /* Headings */
```

---

## 🎯 Component Classes

### Buttons
```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-danger">Delete</button>
<button class="btn btn-success">Save</button>
<button class="btn btn-lg">Large Button</button>
<button class="btn btn-sm">Small Button</button>
```

### Cards
```html
<div class="card">Basic card with subtle shadow</div>
<div class="card card--glass">Glassmorphism card</div>
<div class="card card--elevated">Higher shadow card</div>
<div class="card card--error">Error state card</div>
<div class="card card--success">Success state card</div>
```

### Forms
```html
<div class="form-group">
  <label class="form-label required">Name</label>
  <input class="form-input" type="text" />
  <span class="form-help">Helper text</span>
</div>
```

### Layout
```html
<div class="flex flex-between flex-gap-lg">
  <div>Left</div>
  <div>Right</div>
</div>

<div class="grid grid-4 grid-gap-lg">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
  <div class="card">Item 4</div>
</div>
```

---

## 🎨 Status Colors in Components

```css
/* Success (Green) */
.status-success {
  background: var(--color-success);
  color: white;
}

/* Warning (Amber) */
.status-warning {
  background: var(--color-warning);
  color: white;
}

/* Critical (Red) */
.status-critical {
  background: var(--color-critical);
  color: white;
}

/* Info (Blue) */
.status-info {
  background: var(--color-info);
  color: white;
}
```

---

## 📱 Responsive Classes

```html
<!-- Hide on mobile -->
<div class="hide-mobile">Desktop only content</div>

<!-- Hide on tablet -->
<div class="hide-tablet">Desktop only content</div>

<!-- Stack on mobile -->
<div class="flex flex-column-mobile">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## ✅ DO's and DON'Ts

### DO ✅
```css
/* Use design tokens */
color: var(--color-text-primary);
padding: var(--spacing-lg);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-md);
transition: all var(--transition-base);
```

### DON'T ❌
```css
/* Don't hardcode values */
color: #111827;              /* ❌ Use token instead */
padding: 24px;               /* ❌ Use token instead */
border-radius: 12px;         /* ❌ Use token instead */
box-shadow: 0 4px 6px ...;   /* ❌ Use token instead */
transition: all 0.2s ease;   /* ❌ Use token instead */
```

---

## 🚀 Common Patterns

### Professional Button
```css
.my-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-red-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.my-button:hover {
  background: var(--color-red-dark);
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}
```

### Professional Card
```css
.my-card {
  background: white;
  border: 1px solid var(--color-grey-200);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.my-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Form Group
```css
.my-form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.my-form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-navy-dark);
}

.my-form-input {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-grey-200);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}

.my-form-input:focus {
  outline: none;
  border-color: var(--color-red-primary);
  box-shadow: 0 0 0 3px rgba(227, 6, 19, 0.1);
}
```

---

## 🔗 Import Tokens in Your CSS

```css
/* At the top of your CSS file */
@import './styles/design-tokens.css';

/* Now use tokens */
.my-component {
  color: var(--color-text-primary);
  padding: var(--spacing-lg);
}
```

Or use component classes already defined:

```html
<!-- Just use the pre-built classes -->
<button class="btn btn-primary">Click me</button>
<div class="card">Content</div>
<input class="form-input" />
```

---

## 📚 Full Documentation

For complete design system documentation, see: `DESIGN_SYSTEM.md`

For design tokens reference, see: `src/styles/design-tokens.css`

For component styles, see: `src/styles/components.css`

---

## 💡 Quick Tips

1. **Always use tokens** - They're designed for consistency
2. **Use component classes** - Pre-built .btn, .card, .form-input are optimized
3. **Mobile-first** - Design for mobile, enhance for desktop
4. **Check contrast** - All colors meet WCAG AA standards
5. **Test on device** - Always test on real phones/tablets
6. **Keyboard navigation** - All components must work with keyboard
7. **Dark mode ready** - Your CSS works with dark mode automatically

---

**Last Updated:** November 11, 2025
**Version:** 1.0.0
