import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
} from './src/theme/tokens';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      ...colors,
    },
    spacing,
    fontFamily: {
      sans: typography.fontFamily.sans,
      mono: typography.fontFamily.mono,
    },
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    extend: {
      borderRadius,
      boxShadow: shadows,
      zIndex,
      screens: breakpoints,
      transitionTimingFunction: {
        fast: transitions.fast,
        DEFAULT: transitions.base,
        slow: transitions.slow,
      },
    },
  },
  plugins: [forms()],
};

export default config;
