'use client';

import { Drawer } from 'vaul';
import { Recipe } from '@/src/types';

interface IngredientSheetProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
  onViewFull: () => void;
  onSave: () => void;
}

export default function IngredientSheet({ recipe, open, onClose, onViewFull, onSave }: IngredientSheetProps) {
  if (!recipe) return null;

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[80vh] flex flex-col" data-testid="ingredient-sheet">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />

          <div className="p-4 flex items-start justify-between border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 line-clamp-2" data-testid="ingredient-title">{recipe.title}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                {recipe.readyInMinutes > 0 && <span>{recipe.readyInMinutes} min</span>}
                {recipe.servings > 0 && <span>• {recipe.servings} servings</span>}
              </div>
            </div>
            <button
              onClick={onSave}
              className="p-2 rounded-full hover:bg-orange-50 text-orange-500 transition-colors flex-shrink-0"
              title="Save to Meal Pack"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Ingredients ({recipe.ingredients.length})
            </h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                  <span className="text-gray-700">{ing.original || `${ing.amount} ${ing.unit} ${ing.name}`}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border-t border-gray-100 safe-area-bottom">
            <button
              onClick={onViewFull}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:scale-[0.98] transition-all"
              data-testid="view-full-recipe"
            >
              View Full Recipe
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
