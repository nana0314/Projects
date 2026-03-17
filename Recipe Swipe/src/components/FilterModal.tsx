'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import { UserFilters } from '@/src/types';
import { CUISINE_GROUPS, DIETS, INTOLERANCES, MEAL_TYPES } from '@/src/config/cuisines';

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  filters: UserFilters;
  onApply: (filters: UserFilters) => void;
}

export default function FilterModal({ open, onClose, filters, onApply }: FilterModalProps) {
  const [local, setLocal] = useState<UserFilters>(filters);

  const toggleCuisine = (c: string) => {
    setLocal(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(c)
        ? prev.cuisines.filter(x => x !== c)
        : [...prev.cuisines, c],
    }));
  };

  const toggleDiet = (d: string) => {
    setLocal(prev => ({
      ...prev,
      diets: prev.diets.includes(d)
        ? prev.diets.filter(x => x !== d)
        : [...prev.diets, d],
    }));
  };

  const toggleIntolerance = (values: string[]) => {
    setLocal(prev => {
      const hasAll = values.every(v => prev.intolerances.includes(v));
      return {
        ...prev,
        intolerances: hasAll
          ? prev.intolerances.filter(x => !values.includes(x))
          : [...new Set([...prev.intolerances, ...values])],
      };
    });
  };

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    const empty: UserFilters = { cuisines: [], diets: [], intolerances: [], mealType: '' };
    setLocal(empty);
    onApply(empty);
    onClose();
  };

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) onClose(); else setLocal(filters); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col" data-testid="filter-modal">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />

          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600">
              Reset
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-6">
            {/* Cuisine */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Cuisine</h3>
              {Object.entries(CUISINE_GROUPS).map(([group, cuisines]) => (
                <div key={group} className="mb-3">
                  <p className="text-xs text-gray-400 mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cuisines.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleCuisine(c)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          local.cuisines.includes(c)
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Diet */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Diet</h3>
              <div className="flex flex-wrap gap-1.5">
                {DIETS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => toggleDiet(d.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      local.diets.includes(d.value)
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Intolerances */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Intolerances</h3>
              <div className="flex flex-wrap gap-1.5">
                {INTOLERANCES.map(i => {
                  const values = 'values' in i ? i.values as unknown as string[] : [i.value as string];
                  const active = values.every(v => local.intolerances.includes(v));
                  return (
                    <button
                      key={i.label}
                      onClick={() => toggleIntolerance(values)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        active
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                      }`}
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meal Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Meal Type</h3>
              <div className="flex flex-wrap gap-1.5">
                {MEAL_TYPES.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setLocal(prev => ({
                      ...prev,
                      mealType: prev.mealType === m.value ? '' : m.value,
                    }))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      local.mealType === m.value
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 safe-area-bottom">
            <button
              onClick={handleApply}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:scale-[0.98] transition-all"
              data-testid="apply-filters"
            >
              Apply Filters
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
