const BASE_URL = 'https://world.openfoodfacts.org/api/v2'

export async function lookupBarcode(barcode) {
  if (!barcode || !/^\d{8,14}$/.test(String(barcode).trim())) {
    throw new Error('Invalid barcode format')
  }

  const response = await fetch(`${BASE_URL}/product/${barcode.trim()}.json`, {
    headers: { 'User-Agent': 'MeCal/1.0 (wellness app)' }
  })

  if (!response.ok) {
    throw new Error('Product lookup failed')
  }

  const data = await response.json()
  if (data.status !== 1 || !data.product) {
    throw new Error('Product not found in Open Food Facts')
  }

  const p = data.product
  const n = p.nutriments || {}

  return {
    foodName: p.product_name || p.generic_name || 'Packaged Food',
    brand: p.brands || '',
    calories: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
    protein: Math.round(n.proteins_100g || n.proteins || 0),
    carbs: Math.round(n.carbohydrates_100g || n.carbohydrates || 0),
    fat: Math.round(n.fat_100g || n.fat || 0),
    servingSize: p.serving_size || '100g',
    imageUrl: p.image_front_url || p.image_url || null
  }
}
