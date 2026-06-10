import { createTheme } from '@vanilla-extract/css';
import { colors, darkColors, lightColors } from './tokens/colors.css.js';

export const lightThemeClass = createTheme(colors, lightColors);
export const darkThemeClass = createTheme(colors, darkColors);
export const vars = colors;

export { colors, darkColors, lightColors } from './tokens/colors.css.js';
export { duration, easing } from './tokens/motion.css.js';
export { radii } from './tokens/radii.css.js';
export { glows, shadows } from './tokens/shadows.css.js';
export { spacing } from './tokens/spacing.css.js';
export { fontFamily, fontSize, fontWeight, lineHeight } from './tokens/typography.css.js';
