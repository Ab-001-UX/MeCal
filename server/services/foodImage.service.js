import dotenv from 'dotenv';
dotenv.config();

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

const FOOD_IMAGE_MAP = {
  jollof: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9c785?w=600&h=400&fit=crop',
  rice: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9c785?w=600&h=400&fit=crop',
  plantain: 'https://images.unsplash.com/photo-1614790840969-62b5d53ef994?w=600&h=400&fit=crop',
  yam: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=400&fit=crop',
  fufu: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&h=400&fit=crop',
  egusi: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
  soup: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
  stew: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
  chicken: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=400&fit=crop',
  beef: 'https://images.unsplash.com/photo-1544025162-d76538b88ea2?w=600&h=400&fit=crop',
  meat: 'https://images.unsplash.com/photo-1544025162-d76538b88ea2?w=600&h=400&fit=crop',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop',
  beans: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=400&fit=crop',
  egg: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600&h=400&fit=crop',
  salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
  fruit: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'
};

function getFallbackFoodImage(foodName = '') {
  const name = foodName.toLowerCase();
  for (const [key, url] of Object.entries(FOOD_IMAGE_MAP)) {
    if (name.includes(key)) return url;
  }
  return FOOD_IMAGE_MAP.default;
}

export async function fetchFoodImageUrl(foodName = '') {
  if (!foodName) return FOOD_IMAGE_MAP.default;

  if (!UNSPLASH_KEY || UNSPLASH_KEY.includes('PASTE')) {
    return getFallbackFoodImage(foodName);
  }

  try {
    const query = encodeURIComponent(`${foodName} food meal`);
    const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
    });
    if (!res.ok) return getFallbackFoodImage(foodName);
    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return getFallbackFoodImage(foodName);
    return photo.urls?.regular || photo.urls?.small || getFallbackFoodImage(foodName);
  } catch (err) {
    console.warn(`[FoodImage] Unsplash search fallback for "${foodName}":`, err.message);
    return getFallbackFoodImage(foodName);
  }
}
