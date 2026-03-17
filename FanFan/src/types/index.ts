export interface Recipe {
  id: string;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  cuisines: string[];
  diets: string[];
  dishTypes: string[];
  summary: string;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
  source: 'spoonacular' | 'mealdb';
  spoonacularScore?: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  original: string;
}

export interface InstructionStep {
  number: number;
  step: string;
}

export interface MealPack {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  recipeCount: number;
  coverImage: string;
}

export interface SavedRecipe extends Recipe {
  addedAt: number;
}

export interface UserFilters {
  cuisines: string[];
  diets: string[];
  intolerances: string[];
  mealType: string;
}
