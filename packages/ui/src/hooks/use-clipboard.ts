import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseClipboardOptions {
  timeout?: number;
}

export interface UseClipboardResult {
  hasCopied: boolean;
  copy: (value: string) => Promise<boolean>;
}

/**
 * Hook for copying text to the clipboard with feedback state.
 */
export function useClipboard({ timeout = 2000 }: UseClipboardOptions = {}): UseClipboardResult {
  const [hasCopied, setHasCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setHasCopied(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setHasCopied(false);
        }, timeout);

        return true;
      } catch (error) {
        setHasCopied(false);
        return false;
      }
    },
    [timeout]
  );

  return { hasCopied, copy };
}
