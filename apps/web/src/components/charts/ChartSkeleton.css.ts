import { style } from '@vanilla-extract/css';
import { skeletonPulse } from '../../app/styles/animations.css.ts';

export const chartSkeletonWrap = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  gap: '4px',
  padding: '24px',
  height: '100%',
  minHeight: '200px',
});

export const chartSkeletonBar = style({
  borderRadius: 'var(--radius-sm)',
  background: 'var(--panel-2)',
  animation: `${skeletonPulse} 2s ease infinite`,
});
