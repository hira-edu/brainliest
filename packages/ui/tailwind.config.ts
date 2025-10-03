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

const sansFontStack = [...typography.fontFamily.sans];
const monoFontStack = [...typography.fontFamily.mono];

const tailwindFontSizes = Object.fromEntries(
  Object.entries(typography.fontSize).map(([key, value]) => [
    key,
    [value[0], { ...value[1] }],
  ])
) as Record<string, [string, { lineHeight: string }]>;

const tailwindFontWeights = Object.fromEntries(
  Object.entries(typography.fontWeight).map(([key, value]) => [key, value.toString()])
);

const tailwindZIndex = Object.fromEntries(
  Object.entries(zIndex).map(([key, value]) => [key, value.toString()])
);

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
      sans: sansFontStack,
      mono: monoFontStack,
    },
    fontSize: tailwindFontSizes,
    fontWeight: tailwindFontWeights,
    extend: {
      borderRadius,
      boxShadow: shadows,
      zIndex: tailwindZIndex,
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
