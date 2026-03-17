import { test as base, Page } from '@playwright/test';

const MOCK_RECIPES = Array.from({ length: 20 }, (_, i) => ({
  id: 100 + i,
  title: `Test Recipe ${i + 1}`,
  image: `https://img.spoonacular.com/recipes/${100 + i}-312x231.jpg`,
  readyInMinutes: 25 + i * 5,
  servings: 2 + (i % 4),
  cuisines: [['Italian', 'Japanese', 'Mexican', 'Chinese', 'Indian'][i % 5]],
  diets: i % 3 === 0 ? ['vegetarian'] : [],
  dishTypes: [['main course', 'dessert', 'appetizer', 'salad', 'breakfast'][i % 5]],
  summary: `A delicious test recipe number ${i + 1}.`,
  spoonacularScore: 70 + i,
  extendedIngredients: [
    { name: 'flour', amount: 2, unit: 'cups', original: '2 cups flour' },
    { name: 'sugar', amount: 1, unit: 'tbsp', original: '1 tbsp sugar' },
    { name: 'butter', amount: 100, unit: 'g', original: '100g butter' },
    { name: 'eggs', amount: 2, unit: '', original: '2 eggs' },
    { name: 'milk', amount: 1, unit: 'cup', original: '1 cup milk' },
  ],
  analyzedInstructions: [{
    steps: [
      { number: 1, step: 'Preheat the oven to 180°C (350°F).' },
      { number: 2, step: 'Mix dry ingredients in a large bowl.' },
      { number: 3, step: 'Add wet ingredients and stir until combined.' },
      { number: 4, step: 'Pour into a greased baking dish and bake for 25 minutes.' },
      { number: 5, step: 'Let cool for 5 minutes before serving.' },
    ],
  }],
}));

const MOCK_RANDOM = {
  recipes: [{
    id: 999,
    title: 'Daily Inspiration Mock Recipe',
    image: 'https://img.spoonacular.com/recipes/999-312x231.jpg',
    readyInMinutes: 30,
    servings: 4,
    cuisines: ['Italian'],
    diets: [],
    dishTypes: ['main course'],
    summary: 'A beautiful daily inspiration recipe.',
    spoonacularScore: 90,
    extendedIngredients: [
      { name: 'pasta', amount: 400, unit: 'g', original: '400g pasta' },
      { name: 'tomato sauce', amount: 2, unit: 'cups', original: '2 cups tomato sauce' },
      { name: 'parmesan', amount: 50, unit: 'g', original: '50g parmesan' },
    ],
    analyzedInstructions: [{
      steps: [
        { number: 1, step: 'Boil water and cook pasta according to package directions.' },
        { number: 2, step: 'Heat tomato sauce in a saucepan.' },
        { number: 3, step: 'Drain pasta, toss with sauce, and top with parmesan.' },
      ],
    }],
  }],
};

async function mockSpoonacularApi(page: Page) {
  await page.route('**/api.spoonacular.com/recipes/complexSearch**', async (route) => {
    const url = new URL(route.request().url());
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const number = parseInt(url.searchParams.get('number') || '10');
    const slice = MOCK_RECIPES.slice(offset, offset + number);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: slice,
        offset,
        number: slice.length,
        totalResults: MOCK_RECIPES.length,
      }),
    });
  });

  await page.route('**/api.spoonacular.com/recipes/random**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RANDOM),
    });
  });

  await page.route('**/api.spoonacular.com/recipes/*/information**', async (route) => {
    const url = route.request().url();
    const idMatch = url.match(/\/recipes\/(\d+)\/information/);
    const id = idMatch ? parseInt(idMatch[1]) : 100;
    const recipe = MOCK_RECIPES.find(r => r.id === id) || MOCK_RANDOM.recipes[0];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...recipe, id }),
    });
  });

  // Mock the recipe images to avoid 404s on fake URLs
  await page.route('**/img.spoonacular.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="312" height="231">
        <rect width="312" height="231" fill="#f97316" rx="8"/>
        <text x="156" y="120" text-anchor="middle" fill="white" font-size="20" font-family="sans-serif">Recipe</text>
      </svg>`,
    });
  });
}

export const test = base.extend<{ mockApi: void }>({
  mockApi: [async ({ page }, use) => {
    await mockSpoonacularApi(page);
    await use();
  }, { auto: true }],
});

export { expect } from '@playwright/test';
