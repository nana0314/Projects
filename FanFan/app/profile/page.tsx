'use client';

import { useAuth } from '@/src/context/AuthContext';
import { useFilters } from '@/src/context/FilterContext';
import { CUISINE_GROUPS, DIETS, INTOLERANCES, MEAL_TYPES } from '@/src/config/cuisines';

export default function ProfilePage() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { filters, setFilters, resetFilters, hasActiveFilters } = useFilters();

  const toggleCuisine = (c: string) => {
    setFilters({
      ...filters,
      cuisines: filters.cuisines.includes(c)
        ? filters.cuisines.filter(x => x !== c)
        : [...filters.cuisines, c],
    });
  };

  const toggleDiet = (d: string) => {
    setFilters({
      ...filters,
      diets: filters.diets.includes(d)
        ? filters.diets.filter(x => x !== d)
        : [...filters.diets, d],
    });
  };

  const toggleIntolerance = (values: string[]) => {
    const hasAll = values.every(v => filters.intolerances.includes(v));
    setFilters({
      ...filters,
      intolerances: hasAll
        ? filters.intolerances.filter(x => !values.includes(x))
        : [...new Set([...filters.intolerances, ...values])],
    });
  };

  const activeCount = filters.cuisines.length + filters.diets.length +
    filters.intolerances.length + (filters.mealType ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 safe-area-top pb-24">
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-xs text-gray-400 mt-0.5">Manage your account & preferences</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Account Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</h2>
          </div>
          {user ? (
            <div className="flex items-center gap-3 p-4">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full ring-2 ring-orange-100" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-lg">
                  {user.displayName?.[0] || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Sign in to sync your Meal Packs across devices</p>
              <button
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                </svg>
                Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Filter Preferences Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Default Filters</h2>
              {activeCount > 0 && (
                <p className="text-xs text-orange-500 mt-0.5">{activeCount} active</p>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-xs font-medium text-gray-400 border border-gray-200 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors"
              >
                Reset all
              </button>
            )}
          </div>

          <div className="p-4 space-y-5">
            {/* Cuisines */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Cuisines</h3>
              {Object.entries(CUISINE_GROUPS).map(([group, cuisines]) => (
                <div key={group} className="mb-3">
                  <p className="text-xs text-gray-400 mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cuisines.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleCuisine(c)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          filters.cuisines.includes(c)
                            ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
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

            <hr className="border-gray-100" />

            {/* Diets */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Diet</h3>
              <div className="flex flex-wrap gap-1.5">
                {DIETS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => toggleDiet(d.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      filters.diets.includes(d.value)
                        ? 'bg-green-500 border-green-500 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Intolerances */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Intolerances</h3>
              <div className="flex flex-wrap gap-1.5">
                {INTOLERANCES.map(i => {
                  const values = 'values' in i ? i.values as unknown as string[] : [i.value as string];
                  const active = values.every(v => filters.intolerances.includes(v));
                  return (
                    <button
                      key={i.label}
                      onClick={() => toggleIntolerance(values)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                        active
                          ? 'bg-red-500 border-red-500 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                      }`}
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Meal Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Meal Type</h3>
              <div className="flex flex-wrap gap-1.5">
                {MEAL_TYPES.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setFilters({
                      ...filters,
                      mealType: filters.mealType === m.value ? '' : m.value,
                    })}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      filters.mealType === m.value
                        ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* About Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400">Powered by Spoonacular & TheMealDB</p>
          <p className="text-xs text-gray-300 mt-1">FanFan v1.0</p>
        </div>
      </div>
    </div>
  );
}
