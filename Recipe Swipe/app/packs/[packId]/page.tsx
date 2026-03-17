'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Recipe } from '@/src/types';
import { useMealPacks } from '@/src/hooks/useMealPacks';

export default function PackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params.packId as string;
  const { packs, getPackRecipes, removeRecipeFromPack, deletePack } = useMealPacks();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const pack = packs.find(p => p.id === packId);

  useEffect(() => {
    if (!packId) return;
    getPackRecipes(packId).then(r => {
      setRecipes(r);
      setLoading(false);
    });
  }, [packId, getPackRecipes]);

  const handleRemove = async (recipeId: string) => {
    await removeRecipeFromPack(packId, recipeId);
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
  };

  const handleDelete = async () => {
    await deletePack(packId);
    router.push('/packs/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 safe-area-top">
        <div className="bg-white p-4 border-b border-gray-100 space-y-2">
          <div className="h-6 w-1/3 rounded skeleton-shimmer" />
          <div className="h-4 w-1/4 rounded skeleton-shimmer" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-2xl bg-white">
              <div className="w-20 h-20 rounded-xl skeleton-shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-area-top pb-24">
      <div className="bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push('/packs/')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{pack?.name || 'Meal Pack'}</h1>
            <p className="text-xs text-gray-400">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 -mr-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete pack"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="mx-4 mt-3 p-4 rounded-2xl bg-red-50 border border-red-100">
          <p className="text-sm text-red-700 font-medium mb-3">Delete "{pack?.name}"? This can't be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 rounded-xl bg-white text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Empty Pack</h3>
          <p className="text-sm text-gray-400 text-center">Swipe up on recipes to add them here</p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all"
            >
              <button
                onClick={() => router.push(`/recipe/${recipe.id}/`)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{recipe.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    {recipe.cuisines[0] && <span>{recipe.cuisines[0]}</span>}
                    {recipe.readyInMinutes > 0 && <span>• {recipe.readyInMinutes} min</span>}
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleRemove(recipe.id)}
                className="p-2 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Remove from pack"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
