'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { MealPack, Recipe } from '@/src/types';

interface AddToPackSheetProps {
  open: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  packs: MealPack[];
  onAddToPack: (packId: string) => void;
  onCreatePack: (name: string) => Promise<string | null>;
  savedInPackIds?: Set<string>;
}

export default function AddToPackSheet({
  open,
  onClose,
  recipe,
  packs,
  onAddToPack,
  onCreatePack,
  savedInPackIds = new Set(),
}: AddToPackSheetProps) {
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelectedPacks(new Set());
      setJustSaved(new Set());
      setCreating(false);
      setNewName('');
    }
  }, [open]);

  const togglePack = (id: string) => {
    if (savedInPackIds.has(id) || justSaved.has(id)) return;
    setSelectedPacks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await onCreatePack(newName.trim());
    if (id) {
      setSelectedPacks(prev => new Set([...prev, id]));
      setNewName('');
      setCreating(false);
    }
  };

  const handleDone = () => {
    selectedPacks.forEach(id => onAddToPack(id));
    setJustSaved(prev => new Set([...prev, ...selectedPacks]));
    setSelectedPacks(new Set());
    onClose();
  };

  if (!recipe) return null;

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) { setSelectedPacks(new Set()); onClose(); } }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] flex flex-col" data-testid="add-to-pack-sheet">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-3" />

          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Save to Meal Pack</h2>
            <button
              onClick={handleDone}
              disabled={selectedPacks.size === 0}
              className="text-sm font-semibold text-orange-500 disabled:text-gray-300 transition-colors"
            >
              Done
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
            <img src={recipe.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
            <span className="text-sm font-medium text-gray-700 line-clamp-1">{recipe.title}</span>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {packs.map(pack => {
              const alreadySaved = savedInPackIds.has(pack.id) || justSaved.has(pack.id);
              return (
                <button
                  key={pack.id}
                  onClick={() => togglePack(pack.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                    alreadySaved ? 'opacity-70' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {pack.coverImage ? (
                      <img src={pack.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800">{pack.name}</p>
                    {alreadySaved ? (
                      <p className="text-xs text-green-500 font-medium">Already Saved ✓</p>
                    ) : (
                      <p className="text-xs text-gray-400">{pack.recipeCount} recipes</p>
                    )}
                  </div>
                  {!alreadySaved && (
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedPacks.has(pack.id) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                    }`}>
                      {selectedPacks.has(pack.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                  {alreadySaved && (
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}

            {creating ? (
              <div className="flex items-center gap-2 px-3 py-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Pack name..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-3 py-2 text-sm font-medium text-orange-500 disabled:text-gray-300"
                >
                  Add
                </button>
                <button
                  onClick={() => { setCreating(false); setNewName(''); }}
                  className="px-2 py-2 text-sm text-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-orange-500"
              >
                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-orange-300 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="text-sm font-medium" data-testid="create-pack-label">Create new Meal Pack</span>
              </button>
            )}
          </div>

          <div className="safe-area-bottom" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
