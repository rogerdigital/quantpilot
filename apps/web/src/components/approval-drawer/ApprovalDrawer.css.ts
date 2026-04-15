import { globalStyle, keyframes, style } from '@vanilla-extract/css';

const slideUp = keyframes({
  from: { transform: 'translateY(100%)', opacity: 0 },
  to: { transform: 'translateY(0)', opacity: 1 },
});

export const drawerRoot = style({
  position: 'fixed',
  bottom: 0,
  left: '260px', // sidebar width
  right: 0,
  zIndex: 8000,
  padding: '0 24px 20px',
  animation: `${slideUp} 220ms cubic-bezier(0.16, 1, 0.3, 1) both`,
  '@media': {
    '(max-width: 900px)': { left: 0 },
  },
} as any);

export const drawerPanel = style({
  borderRadius: 'var(--radius-lg)',
  border: '1px solid rgba(255, 183, 0, 0.28)',
  background: 'rgba(10, 12, 30, 0.97)',
  backdropFilter: 'blur(12px)',
  boxShadow:
    '0 -8px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 183, 0, 0.06)',
  overflow: 'hidden',
});

export const drawerHead = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 18px 10px',
  borderBottom: '1px solid rgba(255, 183, 0, 0.12)',
  background: 'rgba(255, 183, 0, 0.03)',
});

export const drawerTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  font: '700 11px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--hold)',
});

export const drawerDot = style({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--hold)',
  boxShadow: '0 0 8px rgba(255, 183, 0, 0.7)',
  animation: 'pulse-glow 1.8s ease-in-out infinite',
  flexShrink: 0,
});

export const drawerCount = style({
  minWidth: '20px',
  height: '20px',
  borderRadius: '10px',
  background: 'rgba(255, 183, 0, 0.18)',
  border: '1px solid rgba(255, 183, 0, 0.28)',
  padding: '0 7px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  font: '700 10px/1 var(--font-data)',
  color: 'var(--hold)',
});

export const drawerDismiss = style({
  background: 'transparent',
  border: 'none',
  color: 'rgba(160, 162, 210, 0.5)',
  cursor: 'pointer',
  font: '600 11px/1 var(--font-ui)',
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  transition: 'color 140ms ease',
  ':hover': { color: 'var(--text)' },
} as any);

export const drawerBody = style({
  display: 'flex',
  gap: '10px',
  padding: '12px 18px',
  overflowX: 'auto',
});

export const orderCard = style({
  flexShrink: 0,
  display: 'grid',
  gap: '10px',
  minWidth: '200px',
  padding: '12px 14px',
  borderRadius: 'var(--radius)',
  border: '1px solid rgba(255, 183, 0, 0.16)',
  background: 'rgba(255, 183, 0, 0.04)',
  transition: 'border-color 160ms ease',
  ':hover': { borderColor: 'rgba(255, 183, 0, 0.28)' },
} as any);

export const orderMeta = style({ display: 'grid', gap: '4px' });

export const orderSymbol = style({
  font: '700 15px/1 var(--font-data)',
  letterSpacing: '0.02em',
  color: 'var(--text-strong)',
});

export const orderDetail = style({
  font: '600 11px/1 var(--font-data)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(160, 162, 210, 0.55)',
});

export const orderSideBuy = style({ color: 'var(--buy)' });
export const orderSideSell = style({ color: 'var(--sell)' });

export const orderActions = style({
  display: 'flex',
  gap: '8px',
});

const actionBase = style({
  flex: 1,
  padding: '7px 0',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid',
  cursor: 'pointer',
  font: '700 10px/1 var(--font-data)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  transition: 'background 140ms ease, box-shadow 140ms ease',
});

export const approveBtn = style([
  actionBase,
  {
    background: 'rgba(0, 232, 157, 0.1)',
    borderColor: 'rgba(0, 232, 157, 0.25)',
    color: 'var(--buy)',
    ':hover': {
      background: 'rgba(0, 232, 157, 0.18)',
      boxShadow: '0 0 12px rgba(0, 232, 157, 0.12)',
    },
  } as any,
]);

export const rejectBtn = style([
  actionBase,
  {
    background: 'rgba(255, 51, 88, 0.08)',
    borderColor: 'rgba(255, 51, 88, 0.22)',
    color: 'var(--sell)',
    ':hover': {
      background: 'rgba(255, 51, 88, 0.14)',
      boxShadow: '0 0 12px rgba(255, 51, 88, 0.1)',
    },
  } as any,
]);

globalStyle(`${drawerBody}::-webkit-scrollbar`, { height: '4px' });
globalStyle(`${drawerBody}::-webkit-scrollbar-track`, { background: 'transparent' });
globalStyle(`${drawerBody}::-webkit-scrollbar-thumb`, {
  background: 'rgba(255, 183, 0, 0.2)',
  borderRadius: '2px',
});
