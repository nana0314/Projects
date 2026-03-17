'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, deleteDoc, getDocs,
  setDoc, updateDoc, increment, query, orderBy,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { useAuth } from '@/src/context/AuthContext';
import { MealPack, Recipe } from '@/src/types';

const LOCAL_PACKS_KEY = 'fanfan_meal_packs';
const LOCAL_RECIPES_KEY = 'fanfan_pack_recipes';

function uuid() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function readLocalPacks(): MealPack[] {
  try {
    const raw = localStorage.getItem(LOCAL_PACKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocalPacks(packs: MealPack[]) {
  localStorage.setItem(LOCAL_PACKS_KEY, JSON.stringify(packs));
}

function readLocalRecipes(packId: string): Recipe[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_RECIPES_KEY}_${packId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocalRecipes(packId: string, recipes: Recipe[]) {
  localStorage.setItem(`${LOCAL_RECIPES_KEY}_${packId}`, JSON.stringify(recipes));
}

export function useMealPacks() {
  const { user } = useAuth();
  const [packs, setPacks] = useState<MealPack[]>([]);
  const [loading, setLoading] = useState(true);

  const isFirebase = !!user;

  // --- Firestore helpers (only when authenticated) ---
  const fetchFirebasePacks = useCallback(async () => {
    if (!user) return [];
    try {
      const q = query(
        collection(db, 'users', user.uid, 'mealPacks'),
        orderBy('updatedAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as MealPack));
    } catch (error) {
      console.error('Failed to fetch meal packs:', error);
      return [];
    }
  }, [user]);

  // --- Unified fetch ---
  const fetchPacks = useCallback(async () => {
    setLoading(true);
    if (isFirebase) {
      const result = await fetchFirebasePacks();
      setPacks(result);
    } else {
      setPacks(readLocalPacks());
    }
    setLoading(false);
  }, [isFirebase, fetchFirebasePacks]);

  useEffect(() => { fetchPacks(); }, [fetchPacks]);

  // --- Create ---
  const createPack = useCallback(async (name: string): Promise<string | null> => {
    if (isFirebase && user) {
      try {
        const ref = await addDoc(collection(db, 'users', user.uid, 'mealPacks'), {
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          recipeCount: 0,
          coverImage: '',
        });
        await fetchPacks();
        return ref.id;
      } catch (error) {
        console.error('Failed to create pack:', error);
        return null;
      }
    }

    const id = uuid();
    const newPack: MealPack = {
      id,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      recipeCount: 0,
      coverImage: '',
    };
    const updated = [newPack, ...readLocalPacks()];
    writeLocalPacks(updated);
    setPacks(updated);
    return id;
  }, [isFirebase, user, fetchPacks]);

  // --- Add recipe to pack ---
  const addRecipeToPack = useCallback(async (packId: string, recipe: Recipe) => {
    if (isFirebase && user) {
      try {
        const recipeRef = doc(db, 'users', user.uid, 'mealPacks', packId, 'recipes', recipe.id);
        await setDoc(recipeRef, { ...recipe, addedAt: Date.now() });
        const packRef = doc(db, 'users', user.uid, 'mealPacks', packId);
        const pack = packs.find(p => p.id === packId);
        const data: Record<string, unknown> = {
          recipeCount: increment(1),
          updatedAt: Date.now(),
        };
        if (!pack?.coverImage) data.coverImage = recipe.image;
        await updateDoc(packRef, data);
        await fetchPacks();
      } catch (error) {
        console.error('Failed to add recipe to pack:', error);
      }
      return;
    }

    const recipes = readLocalRecipes(packId);
    if (!recipes.find(r => r.id === recipe.id)) {
      recipes.push(recipe);
      writeLocalRecipes(packId, recipes);
    }
    const allPacks = readLocalPacks();
    const idx = allPacks.findIndex(p => p.id === packId);
    if (idx >= 0) {
      allPacks[idx].recipeCount = recipes.length;
      allPacks[idx].updatedAt = Date.now();
      if (!allPacks[idx].coverImage) allPacks[idx].coverImage = recipe.image;
      writeLocalPacks(allPacks);
      setPacks([...allPacks]);
    }
  }, [isFirebase, user, packs, fetchPacks]);

  // --- Remove recipe from pack ---
  const removeRecipeFromPack = useCallback(async (packId: string, recipeId: string) => {
    if (isFirebase && user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'mealPacks', packId, 'recipes', recipeId));
        const packRef = doc(db, 'users', user.uid, 'mealPacks', packId);
        await updateDoc(packRef, { recipeCount: increment(-1), updatedAt: Date.now() });
        await fetchPacks();
      } catch (error) {
        console.error('Failed to remove recipe:', error);
      }
      return;
    }

    const recipes = readLocalRecipes(packId).filter(r => r.id !== recipeId);
    writeLocalRecipes(packId, recipes);
    const allPacks = readLocalPacks();
    const idx = allPacks.findIndex(p => p.id === packId);
    if (idx >= 0) {
      allPacks[idx].recipeCount = recipes.length;
      allPacks[idx].updatedAt = Date.now();
      writeLocalPacks(allPacks);
      setPacks([...allPacks]);
    }
  }, [isFirebase, user, fetchPacks]);

  // --- Delete pack ---
  const deletePack = useCallback(async (packId: string) => {
    if (isFirebase && user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'mealPacks', packId));
        await fetchPacks();
      } catch (error) {
        console.error('Failed to delete pack:', error);
      }
      return;
    }

    const allPacks = readLocalPacks().filter(p => p.id !== packId);
    writeLocalPacks(allPacks);
    localStorage.removeItem(`${LOCAL_RECIPES_KEY}_${packId}`);
    setPacks(allPacks);
  }, [isFirebase, user, fetchPacks]);

  // --- Get pack recipes ---
  const getPackRecipes = useCallback(async (packId: string): Promise<Recipe[]> => {
    if (isFirebase && user) {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'mealPacks', packId, 'recipes'),
          orderBy('addedAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => d.data() as Recipe);
      } catch (error) {
        console.error('Failed to get pack recipes:', error);
        return [];
      }
    }
    return readLocalRecipes(packId);
  }, [isFirebase, user]);

  const getPackIdsContainingRecipe = useCallback((recipeId: string): Set<string> => {
    const result = new Set<string>();
    if (isFirebase) return result;
    for (const pack of readLocalPacks()) {
      const recipes = readLocalRecipes(pack.id);
      if (recipes.some(r => r.id === recipeId)) {
        result.add(pack.id);
      }
    }
    return result;
  }, [isFirebase]);

  return {
    packs, loading, createPack, addRecipeToPack,
    removeRecipeFromPack, deletePack, getPackRecipes,
    getPackIdsContainingRecipe, refetch: fetchPacks,
  };
}
