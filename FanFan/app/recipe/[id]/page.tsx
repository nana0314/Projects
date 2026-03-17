'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Recipe } from '@/src/types';
import { getRecipeById } from '@/src/services/RecipeService';
import AddToPackSheet from '@/src/components/AddToPackSheet';
import { useMealPacks } from '@/src/hooks/useMealPacks';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { packs, addRecipeToPack, createPack, getPackIdsContainingRecipe } = useMealPacks();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [packSheetOpen, setPackSheetOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRecipeById(id).then(r => {
      setRecipe(r);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full h-56 skeleton-shimmer" />
        <div className="p-4 space-y-3">
          <div className="h-6 w-3/4 rounded skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded skeleton-shimmer" />
          <div className="space-y-2 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 w-full rounded skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="text-gray-500">Recipe not found</p>
          <button onClick={() => router.push('/')} className="mt-4 text-orange-500 font-medium">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white safe-area-top pb-24">
      <div className="relative">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-56 sm:h-64 object-cover"
        />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setPackSheetOpen(true)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <h1 className="text-white text-xl font-bold leading-tight">{recipe.title}</h1>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-100">
        {recipe.readyInMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {recipe.readyInMinutes} min
          </div>
        )}
        {recipe.servings > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {recipe.servings} servings
          </div>
        )}
      </div>

      {(recipe.cuisines.length > 0 || recipe.diets.length > 0) && (
        <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-gray-100">
          {recipe.cuisines.map(c => (
            <span key={c} className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">{c}</span>
          ))}
          {recipe.diets.map(d => (
            <span key={d} className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">{d}</span>
          ))}
        </div>
      )}

      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Ingredients ({recipe.ingredients.length})
        </h2>
        <ul className="space-y-2.5">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
              <span className="text-gray-700">{ing.original || `${ing.amount} ${ing.unit} ${ing.name}`}</span>
            </li>
          ))}
        </ul>
      </div>

      {recipe.instructions.length > 0 && (
        <div className="px-4 py-4 border-t border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map(step => (
              <li key={step.number} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.number}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">{step.step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="px-4 py-3 text-center">
        <p className="text-xs text-gray-300">
          {recipe.source === 'spoonacular' ? 'Powered by Spoonacular' : 'Data from TheMealDB'}
        </p>
      </div>

      <AddToPackSheet
        open={packSheetOpen}
        onClose={() => setPackSheetOpen(false)}
        recipe={recipe}
        packs={packs}
        onAddToPack={(packId) => addRecipeToPack(packId, recipe)}
        onCreatePack={createPack}
        savedInPackIds={getPackIdsContainingRecipe(recipe.id)}
      />
    </div>
  );
}
