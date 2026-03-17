'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Recipe, UserFilters } from '@/src/types';
import { searchRecipes } from '@/src/services/RecipeService';

const PREFETCH_THRESHOLD = 3;

export function useRecipeQueue(filters: UserFilters) {
  const [queue, setQueue] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const offsetRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const fetchingRef = useRef(false);
  const loopedRef = useRef(false);

  const fetchBatch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const results = await searchRecipes(filters, offsetRef.current);
      let newRecipes = results.filter(r => !seenIdsRef.current.has(r.id));

      if (newRecipes.length === 0 && results.length === 0 && !loopedRef.current) {
        seenIdsRef.current.clear();
        offsetRef.current = 0;
        loopedRef.current = true;
        fetchingRef.current = false;
        fetchBatch();
        return;
      }

      if (newRecipes.length === 0 && results.length > 0) {
        seenIdsRef.current.clear();
        offsetRef.current = 0;
        loopedRef.current = true;
        fetchingRef.current = false;
        fetchBatch();
        return;
      }

      loopedRef.current = false;
      newRecipes.forEach(r => seenIdsRef.current.add(r.id));
      offsetRef.current += 10;

      setQueue(prev => [...prev, ...newRecipes]);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setQueue([]);
    seenIdsRef.current.clear();
    offsetRef.current = 0;
    loopedRef.current = false;
    setLoading(true);
    fetchBatch();
  }, [fetchBatch]);

  useEffect(() => {
    if (queue.length > 0 && queue.length <= PREFETCH_THRESHOLD && !fetchingRef.current) {
      fetchBatch();
    }
  }, [queue.length, fetchBatch]);

  const currentRecipe = queue[0] || null;

  const removeTop = useCallback(() => {
    setQueue(prev => prev.slice(1));
  }, []);

  const prependToQueue = useCallback((recipe: Recipe) => {
    setQueue(prev => [recipe, ...prev]);
  }, []);

  return { currentRecipe, queue, loading, removeTop, prependToQueue };
}
