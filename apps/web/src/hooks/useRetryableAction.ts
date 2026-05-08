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
  options: UseRetryableActionOptions = {},
) {
  const { maxRetries = 3, baseDelay = 1000, onMaxRetriesReached } = options;
  const [state, setState] = useState<RetryState<T>>({
    data: null,
    error: null,
    loading: false,
    attempt: 0,
  });
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const data = await action();
        setState({ data, error: null, loading: false, attempt });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        if (attempt === maxRetries) {
          setState({ data: null, error, loading: false, attempt });
          onMaxRetriesReached?.(error);
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));

        if (abortRef.current?.signal.aborted) {
          setState((prev) => ({ ...prev, loading: false }));
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
