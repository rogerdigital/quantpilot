import { useCallback, useRef, useState } from 'react';

interface RetryState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  attempt: number;
}

interface UseRetryableActionOptions {
  maxRetries?: number;
  baseDelay?: number;
  onMaxRetriesReached?: (error: Error) => void;
}

export function useRetryableAction<T>(
  action: () => Promise<T>,
  options: UseRetryableActionOptions = {}
) {
  const { maxRetries = 3, baseDelay = 1000, onMaxRetriesReached } = options;
  const [state, setState] = useState<RetryState<T>>({
    data: null,
    error: null,
    loading: false,
    attempt: 0,
  });
  const abortRef = useRef<AbortController | null>(null);
  // Monotonic id so a slow in-flight action() that resolves after a newer
  // execute() started cannot overwrite the fresh result.
  const requestIdRef = useRef(0);

  const execute = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const myRequestId = ++requestIdRef.current;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const data = await action();
        // Stale guard: a newer execute() has started, drop this result.
        if (myRequestId !== requestIdRef.current) return data;
        setState({ data, error: null, loading: false, attempt });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (myRequestId !== requestIdRef.current) {
          return;
        }

        if (attempt === maxRetries) {
          setState({ data: null, error, loading: false, attempt });
          onMaxRetriesReached?.(error);
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));

        // If superseded by a newer execute(), drop this attempt without
        // touching loading state — the newer request owns the spinner.
        if (abortRef.current?.signal.aborted || myRequestId !== requestIdRef.current) {
          return;
        }
      }
    }
  }, [action, maxRetries, baseDelay, onMaxRetriesReached]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ data: null, error: null, loading: false, attempt: 0 });
  }, []);

  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    ...state,
    execute,
    retry,
    reset,
  };
}
