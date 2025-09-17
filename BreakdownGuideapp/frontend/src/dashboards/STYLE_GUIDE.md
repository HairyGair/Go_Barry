# React Dashboard Conversion - Style Guide

## About Style JSX

The dashboard components use `style jsx` syntax for component-scoped CSS. This provides:
- Component-scoped styles (no global CSS pollution)
- Dynamic styles based on props/state
- Better maintainability

## Important Note

If you encounter issues with `style jsx` in the Vite environment:

1. The styles are written in JSX format but can be easily extracted to regular CSS files
2. Alternative CSS files are provided in each dashboard folder
3. You can use CSS modules instead: `styles.module.css`

## Converting Style JSX to CSS Modules

If needed, convert from:
```jsx
<style jsx>{`
  .my-class {
    color: red;
  }
`}</style>
```

To CSS Module:
```css
/* MyComponent.module.css */
.myClass {
  color: red;
}
```

```jsx
import styles from './MyComponent.module.css';
<div className={styles.myClass}>
```

## Current Implementation

All dashboard components include inline `style jsx` for easier development and component portability. If build issues occur, use the provided CSS files or convert to CSS modules as needed.
