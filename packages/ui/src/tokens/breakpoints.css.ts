export const breakpoints = {
  mobile: '640px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

/** Media query helpers for vanilla-extract */
export const media = {
  mobile: `screen and (max-width: ${breakpoints.mobile})`,
  tablet: `screen and (max-width: ${breakpoints.tablet})`,
  desktop: `screen and (min-width: ${breakpoints.tablet})`,
  wide: `screen and (min-width: ${breakpoints.desktop})`,
} as const;
