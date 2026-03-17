export const CUISINE_GROUPS = {
  Asian: ['Chinese', 'Japanese', 'Korean', 'Thai', 'Vietnamese', 'Indian'],
  European: ['Italian', 'French', 'Spanish', 'Greek', 'German', 'British', 'Irish', 'Nordic', 'Eastern European'],
  American: ['American', 'Cajun', 'Southern', 'Latin American', 'Caribbean', 'Mexican'],
  'Middle East & Africa': ['Middle Eastern', 'Mediterranean', 'African', 'Jewish'],
} as const;

export const ALL_CUISINES = Object.values(CUISINE_GROUPS).flat();

export const DIETS = [
  { label: 'Vegetarian', value: 'Vegetarian' },
  { label: 'Vegan', value: 'Vegan' },
  { label: 'Keto', value: 'Ketogenic' },
  { label: 'Paleo', value: 'Paleo' },
  { label: 'Pescetarian', value: 'Pescetarian' },
  { label: 'Whole30', value: 'Whole30' },
  { label: 'Lacto-Vegetarian', value: 'Lacto-Vegetarian' },
  { label: 'Ovo-Vegetarian', value: 'Ovo-Vegetarian' },
] as const;

export const INTOLERANCES = [
  { label: 'Gluten-Free', value: 'Gluten' },
  { label: 'Dairy-Free', value: 'Dairy' },
  { label: 'Nut-Free', values: ['Tree Nut', 'Peanut'] },
  { label: 'Egg-Free', value: 'Egg' },
  { label: 'Soy-Free', value: 'Soy' },
  { label: 'Seafood-Free', values: ['Seafood', 'Shellfish'] },
  { label: 'Wheat-Free', value: 'Wheat' },
] as const;

export const MEAL_TYPES = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Appetizer', value: 'appetizer' },
  { label: 'Soup', value: 'soup' },
  { label: 'Main Course', value: 'main course' },
  { label: 'Side Dish', value: 'side dish' },
  { label: 'Salad', value: 'salad' },
  { label: 'Snack', value: 'snack' },
  { label: 'Fingerfood', value: 'fingerfood' },
  { label: 'Dessert', value: 'dessert' },
  { label: 'Beverage', value: 'beverage' },
  { label: 'Bread', value: 'bread' },
] as const;
