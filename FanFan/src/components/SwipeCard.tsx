'use client';

import { Recipe } from '@/src/types';

interface SwipeCardProps {
  recipe: Recipe;
  onTap: () => void;
}

export default function SwipeCard({ recipe, onTap }: SwipeCardProps) {
  return (
    <div
      className="swipe-card absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-white shadow-xl cursor-grab active:cursor-grabbing"
      onClick={onTap}
      data-testid="swipe-card"
    >
      <div className="relative w-full h-3/5">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h2 className="text-white text-xl font-bold leading-tight">{recipe.title}</h2>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          {recipe.readyInMinutes > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon /> {recipe.readyInMinutes} min
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1">
              <ServingsIcon /> {recipe.servings} servings
            </span>
          )}
        </div>

        {recipe.cuisines.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.cuisines.map(c => (
              <span key={c} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                {c}
              </span>
            ))}
          </div>
        )}

        {recipe.dishTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.dishTypes.slice(0, 3).map(d => (
              <span key={d} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {d}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 pt-1">Tap to see ingredients</p>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ServingsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
