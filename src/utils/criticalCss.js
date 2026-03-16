/**
 * Critical CSS
 * 
 * Kritische CSS-Regeln für Above-the-Fold Content
 * Werden inline in den <head> eingefügt
 */

export const criticalCSS = `
/* ============================================
   KochPlan - Critical CSS
   ============================================ */

/* CSS Custom Properties */
:root {
  --color-primary: #e65100;
  --color-primary-dark: #d84315;
  --color-primary-light: #ff9800;
  --color-background: #ffffff;
  --color-surface: #f5f5f5;
  --color-text: #1a1a1a;
  --color-text-secondary: #666666;
  --color-border: #e0e0e0;
  --color-success: #4caf50;
  --color-warning: #ff9800;
  --color-error: #f44336;
  --color-info: #2196f3;
  
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  
  --header-height: 56px;
  --nav-height: 64px;
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
}

/* Reset & Base */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  -webkit-text-size-adjust: 100%;
}

body {
  background-color: var(--color-background);
  color: var(--color-text);
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;
}

/* App Container */
#app {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ============================================
   Skeleton Loading
   ============================================ */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e8e8e8 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

.skeleton-text {
  height: 1em;
  margin-bottom: 0.5em;
}

.skeleton-text:last-child {
  width: 80%;
}

.skeleton-image {
  aspect-ratio: 16/10;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============================================
   App Header
   ============================================ */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(var(--header-height) + var(--safe-area-top));
  padding-top: var(--safe-area-top);
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
  z-index: 100;
  box-shadow: var(--shadow-md);
}

.app-header__title {
  font-size: 1.25rem;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-header__actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

/* ============================================
   Content Area
   ============================================ */
.app-content {
  flex: 1;
  padding-top: calc(var(--header-height) + var(--safe-area-top));
  padding-bottom: calc(var(--nav-height) + var(--safe-area-bottom));
  padding-left: var(--spacing-md);
  padding-right: var(--spacing-md);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* ============================================
   Bottom Navigation
   ============================================ */
.app-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(var(--nav-height) + var(--safe-area-bottom));
  padding-bottom: var(--safe-area-bottom);
  background: white;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.app-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--spacing-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.75rem;
  min-width: 64px;
  min-height: 48px;
  transition: color 0.2s;
}

.app-nav__item--active {
  color: var(--color-primary);
}

.app-nav__icon {
  width: 24px;
  height: 24px;
}

/* ============================================
   Offline Indicator
   ============================================ */
.offline-indicator {
  position: fixed;
  top: calc(var(--header-height) + var(--safe-area-top));
  left: 0;
  right: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  z-index: 99;
  transition: all 0.3s;
}

.offline-indicator--offline {
  background: var(--color-warning);
  color: white;
}

.offline-indicator--syncing {
  background: var(--color-info);
  color: white;
}

.offline-indicator--pending {
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.offline-indicator--error {
  background: var(--color-error);
  color: white;
}

/* ============================================
   Buttons
   ============================================ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  min-height: 44px;
  min-width: 44px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-border);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--color-surface);
}

/* ============================================
   Cards
   ============================================ */
.card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card__image {
  width: 100%;
  aspect-ratio: 16/10;
  object-fit: cover;
  background: var(--color-surface);
}

.card__content {
  padding: var(--spacing-md);
}

.card__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__meta {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* ============================================
   Forms
   ============================================ */
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 44px;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(230, 81, 0, 0.1);
}

/* ============================================
   Loading States
   ============================================ */
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   Utility Classes
   ============================================ */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============================================
   Reduced Motion
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .skeleton {
    animation: none;
    background: var(--color-surface);
  }
}

/* ============================================
   Dark Mode Support (vorbereitet)
   ============================================ */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #121212;
    --color-surface: #1e1e1e;
    --color-text: #ffffff;
    --color-text-secondary: #b0b0b0;
    --color-border: #333333;
  }
}
`;

/**
 * Critical CSS in den Head einfügen
 */
export function injectCriticalCSS() {
  // Prüfen ob bereits vorhanden
  if (document.getElementById('critical-css')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'critical-css';
  style.textContent = criticalCSS;
  
  // Vor dem ersten Link-Tag einfügen
  const firstLink = document.head.querySelector('link');
  if (firstLink) {
    document.head.insertBefore(style, firstLink);
  } else {
    document.head.appendChild(style);
  }
}

/**
 * Critical CSS als String zurückgeben (für SSR)
 */
export function getCriticalCSS() {
  return criticalCSS;
}

export default {
  criticalCSS,
  injectCriticalCSS,
  getCriticalCSS,
};
