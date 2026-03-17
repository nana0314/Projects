'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMealPacks } from '@/src/hooks/useMealPacks';

export default function MealPacksPage() {
  const router = useRouter();
  const { packs, loading, createPack } = useMealPacks();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await createPack(newName.trim());
    setNewName('');
    setCreating(false);
    if (id) router.push(`/packs/${id}/`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 safe-area-top pb-24">
        <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Meal Packs</h1>
          <p className="text-xs text-gray-400 mt-0.5">Your saved recipe collections</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="aspect-[4/3] skeleton-shimmer" />
              <div className="p-3 space-y-1.5">
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
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meal Packs</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {packs.length === 0 ? 'Save recipes into collections' : `${packs.length} collection${packs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Pack
            </button>
          )}
        </div>

        {creating && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Weeknight Dinners"
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 bg-gray-50"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(''); }}
              className="px-3 py-2.5 text-sm text-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {packs.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-5">
            <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">No Meal Packs Yet</h2>
          <p className="text-sm text-gray-400 text-center max-w-[240px] mb-6">
            Swipe up on a recipe or tap the Save button to create your first collection
          </p>
          <button
            onClick={() => setCreating(true)}
            className="px-5 py-2.5 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            Create Your First Pack
          </button>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-3">
          {packs.map(pack => (
            <button
              key={pack.id}
              onClick={() => router.push(`/packs/${pack.id}/`)}
              className="rounded-2xl bg-white overflow-hidden text-left shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {pack.coverImage ? (
                  <img src={pack.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                    <svg className="w-10 h-10 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">{pack.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{pack.recipeCount} recipe{pack.recipeCount !== 1 ? 's' : ''}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
