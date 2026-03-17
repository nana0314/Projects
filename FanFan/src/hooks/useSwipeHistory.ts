'use client';

import { useState, useCallback } from 'react';
import { Recipe } from '@/src/types';

const MAX_HISTORY = 20;

export function useSwipeHistory() {
  const [history, setHistory] = useState<Recipe[]>([]);

  const push = useCallback((recipe: Recipe) => {
    setHistory(prev => {
      const next = [recipe, ...prev];
      return next.slice(0, MAX_HISTORY);
    });
  }, []);

  const pop = useCallback((): Recipe | null => {
    if (history.length === 0) return null;
    const [top, ...rest] = history;
    setHistory(rest);
    return top;
  }, [history]);

  const canUndo = history.length > 0;

  return { push, pop, canUndo };
}
