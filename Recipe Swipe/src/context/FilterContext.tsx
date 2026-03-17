'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserFilters } from '@/src/types';

const STORAGE_KEY = 'fanfan_filters';

const defaultFilters: UserFilters = {
  cuisines: [],
  diets: [],
  intolerances: [],
  mealType: '',
};

interface FilterContextType {
  filters: UserFilters;
  setFilters: (filters: UserFilters) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterContext = createContext<FilterContextType>({
  filters: defaultFilters,
  setFilters: () => {},
  resetFilters: () => {},
  hasActiveFilters: false,
});

export const useFilters = () => useContext(FilterContext);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<UserFilters>(defaultFilters);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFiltersState(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const setFilters = useCallback((newFilters: UserFilters) => {
    setFiltersState(newFilters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasActiveFilters = filters.cuisines.length > 0 || filters.diets.length > 0
    || filters.intolerances.length > 0 || filters.mealType !== '';

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters, hasActiveFilters }}>
      {children}
    </FilterContext.Provider>
  );
}
