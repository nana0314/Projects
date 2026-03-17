import { Recipe, Ingredient, InstructionStep, UserFilters } from '@/src/types';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  [key: string]: string | null;
}

function parseMealDBIngredients(meal: MealDBMeal): Ingredient[] {
  const ingredients: Ingredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({
        name: name.trim(),
        amount: 0,
        unit: measure?.trim() || '',
        original: `${measure?.trim() || ''} ${name.trim()}`.trim(),
      });
    }
  }
  return ingredients;
}

function parseMealDBInstructions(text: string): InstructionStep[] {
  return text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map((step, i) => ({ number: i + 1, step }));
}

function mapMealToRecipe(meal: MealDBMeal): Recipe {
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb,
    readyInMinutes: 30,
    servings: 4,
    cuisines: meal.strArea ? [meal.strArea] : [],
    diets: [],
    dishTypes: meal.strCategory ? [meal.strCategory] : [],
    summary: '',
    ingredients: parseMealDBIngredients(meal),
    instructions: parseMealDBInstructions(meal.strInstructions || ''),
    source: 'mealdb',
  };
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
const AREAS = [
  'American', 'British', 'Canadian', 'Chinese', 'Croatian', 'Dutch',
  'Egyptian', 'Filipino', 'French', 'Greek', 'Indian', 'Irish',
  'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian', 'Mexican',
  'Moroccan', 'Polish', 'Portuguese', 'Russian', 'Spanish', 'Thai',
  'Tunisian', 'Turkish', 'Vietnamese',
];

let allMealsCache: MealDBMeal[] = [];
let cacheReady = false;

async function loadAllMeals(): Promise<MealDBMeal[]> {
  if (cacheReady && allMealsCache.length > 0) return allMealsCache;

  const seen = new Set<string>();
  const results: MealDBMeal[] = [];

  const fetches = ALPHABET.map(async (letter) => {
    try {
      const res = await fetch(`${BASE_URL}/search.php?f=${letter}`);
      const data = await res.json();
      return (data.meals || []) as MealDBMeal[];
    } catch {
      return [];
    }
  });

  const batches = await Promise.all(fetches);
  for (const batch of batches) {
    for (const meal of batch) {
      if (!seen.has(meal.idMeal)) {
        seen.add(meal.idMeal);
        results.push(meal);
      }
    }
  }

  allMealsCache = results;
  cacheReady = true;
  return results;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function searchMealDB(filters: UserFilters, offset: number = 0): Promise<Recipe[]> {
  try {
    if (filters.cuisines.length > 0) {
      const area = filters.cuisines[0];
      const url = `${BASE_URL}/filter.php?a=${area}`;
      const res = await fetch(url);
      const data = await res.json();
      const meals: MealDBMeal[] = data.meals || [];
      if (!meals.length) return [];

      const shuffled = shuffle(meals).slice(offset, offset + 10);
      const detailed = await Promise.all(
        shuffled.map(m => getMealDBById(m.idMeal))
      );
      return detailed.filter((r): r is Recipe => r !== null);
    }

    if (filters.mealType) {
      const categoryMap: Record<string, string> = {
        breakfast: 'Breakfast', dessert: 'Dessert',
        'side dish': 'Side', appetizer: 'Starter',
        'main course': 'Beef', snack: 'Starter',
        soup: 'Starter', salad: 'Vegetarian',
      };
      const cat = categoryMap[filters.mealType] || 'Beef';
      const url = `${BASE_URL}/filter.php?c=${cat}`;
      const res = await fetch(url);
      const data = await res.json();
      const meals: MealDBMeal[] = data.meals || [];
      if (!meals.length) return [];

      const shuffled = shuffle(meals).slice(offset, offset + 10);
      const detailed = await Promise.all(
        shuffled.map(m => getMealDBById(m.idMeal))
      );
      return detailed.filter((r): r is Recipe => r !== null);
    }

    // No filters: load ALL meals from MealDB and paginate from cache
    const allMeals = await loadAllMeals();
    const shuffled = shuffle(allMeals);
    const page = shuffled.slice(offset, offset + 10);

    if (page.length === 0) return [];
    return page.map(mapMealToRecipe);
  } catch (error) {
    console.error('MealDB search error:', error);
    return [];
  }
}

export async function getRandomMealDB(): Promise<Recipe | null> {
  try {
    const res = await fetch(`${BASE_URL}/random.php`);
    const data = await res.json();
    if (!data.meals?.[0]) return null;
    return mapMealToRecipe(data.meals[0]);
  } catch {
    return null;
  }
}

export async function getMealDBById(id: string): Promise<Recipe | null> {
  try {
    const res = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    const data = await res.json();
    if (!data.meals?.[0]) return null;
    return mapMealToRecipe(data.meals[0]);
  } catch {
    return null;
  }
}
