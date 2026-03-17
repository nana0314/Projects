import { Recipe, Ingredient, InstructionStep, UserFilters } from '@/src/types';

const API_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY || '';
const BASE_URL = 'https://api.spoonacular.com';

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  cuisines: string[];
  diets: string[];
  dishTypes: string[];
  summary: string;
  spoonacularScore: number;
  extendedIngredients?: {
    name: string;
    amount: number;
    unit: string;
    original: string;
  }[];
  analyzedInstructions?: {
    steps: {
      number: number;
      step: string;
    }[];
  }[];
}

function mapSpoonacularRecipe(r: SpoonacularRecipe): Recipe {
  const ingredients: Ingredient[] = (r.extendedIngredients || []).map(i => ({
    name: i.name,
    amount: i.amount,
    unit: i.unit,
    original: i.original,
  }));

  const instructions: InstructionStep[] = (r.analyzedInstructions?.[0]?.steps || []).map(s => ({
    number: s.number,
    step: s.step,
  }));

  return {
    id: String(r.id),
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes,
    servings: r.servings,
    cuisines: r.cuisines || [],
    diets: r.diets || [],
    dishTypes: r.dishTypes || [],
    summary: r.summary || '',
    ingredients,
    instructions,
    source: 'spoonacular',
    spoonacularScore: r.spoonacularScore,
  };
}

export async function searchSpoonacular(filters: UserFilters, offset: number = 0): Promise<Recipe[]> {
  const params = new URLSearchParams({
    apiKey: API_KEY,
    number: '10',
    offset: String(offset),
    addRecipeInformation: 'true',
    fillIngredients: 'true',
    instructionsRequired: 'true',
  });

  if (filters.cuisines.length > 0) params.set('cuisine', filters.cuisines.join(','));
  if (filters.diets.length > 0) params.set('diet', filters.diets.join(','));
  if (filters.intolerances.length > 0) params.set('intolerances', filters.intolerances.join(','));
  if (filters.mealType) params.set('type', filters.mealType);

  try {
    const res = await fetch(`${BASE_URL}/recipes/complexSearch?${params}`);
    const data = await res.json();
    return (data.results || []).map(mapSpoonacularRecipe);
  } catch (error) {
    console.error('Spoonacular search error:', error);
    return [];
  }
}

export async function getRandomSpoonacular(): Promise<Recipe | null> {
  try {
    const params = new URLSearchParams({
      apiKey: API_KEY,
      number: '1',
    });
    const res = await fetch(`${BASE_URL}/recipes/random?${params}`);
    const data = await res.json();
    if (!data.recipes?.[0]) return null;
    return mapSpoonacularRecipe(data.recipes[0]);
  } catch {
    return null;
  }
}

export async function getSpoonacularById(id: string): Promise<Recipe | null> {
  try {
    const params = new URLSearchParams({ apiKey: API_KEY });
    const res = await fetch(`${BASE_URL}/recipes/${id}/information?${params}`);
    const data = await res.json();
    return mapSpoonacularRecipe(data);
  } catch {
    return null;
  }
}
