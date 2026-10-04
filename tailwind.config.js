/** @type {import('tailwindcss').Config} */

/*
 * Tailwind ist die Utility-Schicht für Layout. Farben, Radien, Schatten und
 * Dauern kommen aus den Design-Tokens (src/design-system/tokens-v2.css, --ds-*),
 * die mit dem Playlist Generator geteilt werden. Die Variablen wechseln mit dem
 * Theme (html[data-theme]), deshalb braucht es keine dark:-Varianten.
 * Rollen und Regeln: src/design-system/README.md
 */
const colors = {
  transparent: 'transparent',
  current: 'currentColor',
  white: '#ffffff',
  black: '#000000',
  // Flächen: Seite, Panel, Eingabe/Chip, Hover
  surface: {
    0: 'var(--ds-surface-0)',
    1: 'var(--ds-surface-1)',
    2: 'var(--ds-surface-2)',
    3: 'var(--ds-surface-3)',
  },
  // Rahmen und Trennlinien; strong für Felder und Sekundär-Buttons
  line: {
    DEFAULT: 'var(--ds-border)',
    strong: 'var(--ds-border-strong)',
  },
  // Text in drei Stufen
  ink: {
    DEFAULT: 'var(--ds-text)',
    2: 'var(--ds-text-2)',
    3: 'var(--ds-text-3)',
  },
  // Die einzige Aktionsfarbe: Primäraktion, Fokus, aktive Zustände
  accent: {
    DEFAULT: 'var(--ds-accent)',
    hover: 'var(--ds-accent-hover)',
    soft: 'var(--ds-accent-soft)',
  },
  'on-accent': 'var(--ds-on-accent)',
  link: 'var(--ds-link)',
  success: 'var(--ds-success)',
  warning: 'var(--ds-warning)',
  danger: 'var(--ds-danger)',
  info: 'var(--ds-info)',
}

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    colors,
    borderColor: {
      ...colors,
      DEFAULT: 'var(--ds-border)',
    },
    ringColor: {
      ...colors,
      DEFAULT: 'var(--ds-accent)',
    },
    // Drei Radien: 6 / 10 / 16 (plus voll gerundet)
    borderRadius: {
      none: '0',
      DEFAULT: 'var(--ds-radius-sm)',
      sm: 'var(--ds-radius-sm)',
      md: 'var(--ds-radius-md)',
      lg: 'var(--ds-radius-lg)',
      full: 'var(--ds-radius-full)',
    },
    // Schatten nur für Overlays; der Fokus-Ring ist ein box-shadow
    boxShadow: {
      none: 'none',
      overlay: 'var(--ds-shadow-overlay)',
      focus: 'var(--ds-focus-ring)',
    },
    transitionDuration: {
      DEFAULT: 'var(--ds-duration)',
      slow: 'var(--ds-duration-slow)',
    },
    transitionTimingFunction: {
      DEFAULT: 'var(--ds-ease)',
    },
    extend: {
      fontFamily: {
        sans: ['Supreme', 'sans-serif'],
      },
      zIndex: {
        topbar: 'var(--ds-z-topbar)',
        backdrop: 'var(--ds-z-backdrop)',
        dialog: 'var(--ds-z-dialog)',
        toast: 'var(--ds-z-toast)',
      },
    },
  },
  plugins: [],
}
