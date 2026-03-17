'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SwipeStack from '@/src/components/SwipeStack';
import ActionButtons from '@/src/components/ActionButtons';
import DailyInspirationCard from '@/src/components/DailyInspirationCard';
import IngredientSheet from '@/src/components/IngredientSheet';
import AddToPackSheet from '@/src/components/AddToPackSheet';
import FilterModal from '@/src/components/FilterModal';
import { useRecipeQueue } from '@/src/hooks/useRecipeQueue';
import { useSwipeHistory } from '@/src/hooks/useSwipeHistory';
import { useMealPacks } from '@/src/hooks/useMealPacks';
import { useFilters } from '@/src/context/FilterContext';
import { Recipe } from '@/src/types';

export default function DiscoveryPage() {
  const router = useRouter();
  const { filters, setFilters, hasActiveFilters } = useFilters();
  const { currentRecipe, queue, loading, removeTop, prependToQueue } = useRecipeQueue(filters);
  const { push, pop, canUndo } = useSwipeHistory();
  const { packs, addRecipeToPack, createPack, getPackIdsContainingRecipe } = useMealPacks();

  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [packSheetOpen, setPackSheetOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);

  const handleSwipeLeft = useCallback(() => {
    if (currentRecipe) {
      push(currentRecipe);
      removeTop();
    }
  }, [currentRecipe, push, removeTop]);

  const handleSwipeRight = useCallback(() => {
    const prev = pop();
    if (prev) {
      prependToQueue(prev);
    }
  }, [pop, prependToQueue]);

  const handleSwipeUp = useCallback(() => {
    if (currentRecipe) {
      setActiveRecipe(currentRecipe);
      setPackSheetOpen(true);
    }
  }, [currentRecipe]);

  const handleTap = useCallback(() => {
    if (currentRecipe) {
      setActiveRecipe(currentRecipe);
      setIngredientOpen(true);
    }
  }, [currentRecipe]);

  const handleViewFull = useCallback(() => {
    setIngredientOpen(false);
    if (activeRecipe) {
      router.push(`/recipe/${activeRecipe.id}/`);
    }
  }, [activeRecipe, router]);

  const handleSaveFromIngredient = useCallback(() => {
    setIngredientOpen(false);
    if (activeRecipe) {
      setPackSheetOpen(true);
    }
  }, [activeRecipe]);

  const handleAddToPack = useCallback((packId: string) => {
    if (activeRecipe) {
      addRecipeToPack(packId, activeRecipe);
    }
  }, [activeRecipe, addRecipeToPack]);

  const handleDailyView = useCallback((recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}/`);
  }, [router]);

  const handleDailySave = useCallback((recipe: Recipe) => {
    setActiveRecipe(recipe);
    setPackSheetOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white safe-area-top" data-testid="discovery-page">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="app-title">FanFan</h1>
          <p className="text-xs text-gray-400">Swipe to discover recipes</p>
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          data-testid="filter-button"
          className={`p-2.5 rounded-full transition-colors ${
            hasActiveFilters
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-orange-300'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
        </button>
      </div>

      {/* Daily Inspiration */}
      <DailyInspirationCard onViewRecipe={handleDailyView} onSave={handleDailySave} />

      {/* Swipe Stack */}
      <div className="px-4">
        <SwipeStack
          recipe={currentRecipe}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSwipeUp={handleSwipeUp}
          onTap={handleTap}
          loading={loading}
        />

        <ActionButtons
          onSkip={handleSwipeLeft}
          onSave={handleSwipeUp}
          onUndo={handleSwipeRight}
          canUndo={canUndo}
        />
      </div>

      {/* Remaining count */}
      {queue.length > 0 && (
        <p className="text-center text-xs text-gray-300 mt-4">
          {queue.length} recipes in queue
        </p>
      )}

      {/* Drawers */}
      <IngredientSheet
        recipe={activeRecipe}
        open={ingredientOpen}
        onClose={() => setIngredientOpen(false)}
        onViewFull={handleViewFull}
        onSave={handleSaveFromIngredient}
      />

      <AddToPackSheet
        open={packSheetOpen}
        onClose={() => setPackSheetOpen(false)}
        recipe={activeRecipe}
        packs={packs}
        onAddToPack={handleAddToPack}
        onCreatePack={createPack}
        savedInPackIds={activeRecipe ? getPackIdsContainingRecipe(activeRecipe.id) : new Set()}
      />

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
}
