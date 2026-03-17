import { Recipe, UserFilters } from '@/src/types';
import { searchMealDB, getRandomMealDB, getMealDBById } from './mealdb';
import { searchSpoonacular, getRandomSpoonacular, getSpoonacularById } from './spoonacular';

const API_SOURCE = process.env.NEXT_PUBLIC_RECIPE_API || 'mealdb';

export async function searchRecipes(filters: UserFilters, offset: number = 0): Promise<Recipe[]> {
  if (API_SOURCE === 'spoonacular') {
    return searchSpoonacular(filters, offset);
  }
  return searchMealDB(filters, offset);
}

export async function getRandomRecipe(): Promise<Recipe | null> {
  if (API_SOURCE === 'spoonacular') {
    return getRandomSpoonacular();
  }
  return getRandomMealDB();
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  if (API_SOURCE === 'spoonacular') {
    return getSpoonacularById(id);
  }
  return getMealDBById(id);
}
