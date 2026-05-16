import type { FoodData } from '@/types';

const BASE = 'https://world.openfoodfacts.org';
const HEADERS = { 'User-Agent': 'MealsApp/1.0 (github.com/meals)' };

function parseNutriments(product: Record<string, unknown>): FoodData | null {
  const n = (product.nutriments || {}) as Record<string, unknown>;
  const name = (product.product_name as string) || (product.product_name_en as string) || '';
  if (!name) return null;
  return {
    name: name.trim(),
    brand: ((product.brands as string) || '').trim(),
    calories: Number(n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0),
    protein: Number(n['proteins_100g'] ?? 0),
    carbs: Number(n['carbohydrates_100g'] ?? 0),
    fat: Number(n['fat_100g'] ?? 0),
    fiber: Number(n['fiber_100g'] ?? 0),
  };
}

export async function fetchByBarcode(barcode: string): Promise<FoodData | null> {
  try {
    const res = await fetch(`${BASE}/api/v0/product/${barcode}.json`, { headers: HEADERS });
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const food = parseNutriments(data.product);
    if (food) food.barcode = barcode;
    return food;
  } catch {
    return null;
  }
}

export async function searchFoods(query: string): Promise<FoodData[]> {
  try {
    const q = encodeURIComponent(query);
    const url =
      `${BASE}/cgi/search.pl?search_terms=${q}&json=1&page_size=25&action=process` +
      `&fields=product_name,product_name_en,brands,nutriments`;
    const res = await fetch(url, { headers: HEADERS });
    const data = await res.json();
    return (data.products ?? [])
      .map((p: Record<string, unknown>) => parseNutriments(p))
      .filter((f: FoodData | null): f is FoodData => f !== null && f.calories > 0);
  } catch {
    return [];
  }
}
