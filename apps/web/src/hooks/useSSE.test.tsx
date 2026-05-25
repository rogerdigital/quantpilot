import { describe, expect, it } from 'vitest';
import { useSSE } from './useSSE.js';

describe('useSSE', () => {
  it('exports a function', () => {
    expect(typeof useSSE).toBe('function');
  });

  it('has arity of 2 (url, handlers)', () => {
    expect(useSSE.length).toBe(2);
  });
});
