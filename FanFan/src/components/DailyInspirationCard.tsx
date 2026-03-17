'use client';

import { useState, useEffect } from 'react';
import { Recipe } from '@/src/types';
import { getRandomRecipe } from '@/src/services/RecipeService';

const STORAGE_KEY = 'fanfan_daily_inspiration';

interface StoredDaily {
  date: string;
  recipe: Recipe;
}

interface DailyInspirationCardProps {
  onViewRecipe: (recipe: Recipe) => void;
  onSave: (recipe: Recipe) => void;
}

export default function DailyInspirationCard({ onViewRecipe, onSave }: DailyInspirationCardProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed: StoredDaily = JSON.parse(stored);
        if (parsed.date === today && parsed.recipe) {
          setRecipe(parsed.recipe);
          setLoading(false);
          return;
        }
      } catch {}
    }

    getRandomRecipe().then(r => {
      if (r) {
        setRecipe(r);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, recipe: r }));
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="mx-4 mb-4 rounded-xl bg-white shadow-sm p-3">
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-lg skeleton-shimmer flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-3/4 rounded skeleton-shimmer" />
            <div className="h-3 w-1/2 rounded skeleton-shimmer" />
            <div className="h-3 w-1/3 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="mx-4 mb-4 rounded-xl bg-white shadow-sm border border-orange-100 overflow-hidden" data-testid="daily-inspiration">
      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
          Today&apos;s Inspiration
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(recipe); }}
          className="p-1.5 rounded-full hover:bg-orange-50 text-orange-400 transition-colors"
          title="Save to Meal Pack"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
      <button
        onClick={() => onViewRecipe(recipe)}
        className="w-full flex gap-3 p-3 pt-0 text-left hover:bg-orange-50/50 transition-colors"
      >
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{recipe.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            {recipe.cuisines[0] && <span>{recipe.cuisines[0]}</span>}
            {recipe.readyInMinutes > 0 && <span>• {recipe.readyInMinutes} min</span>}
          </div>
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-orange-500">
            View Recipe
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </button>
    </div>
  );
}
