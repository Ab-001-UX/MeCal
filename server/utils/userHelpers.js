export const BCRYPT_ROUNDS = 12
export const JWT_EXPIRES_IN = '7d'
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function parseAllergies(allergiesField) {
  if (!allergiesField) return []
  if (Array.isArray(allergiesField)) return allergiesField
  try {
    const parsed = JSON.parse(allergiesField)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function serializeAllergies(allergies) {
  if (!allergies) return null
  const list = Array.isArray(allergies) ? allergies : []
  return list.length ? JSON.stringify(list) : null
}

export function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return {
    ...safe,
    allergies: parseAllergies(user.allergies)
  }
}

export function profileForAi(user) {
  if (!user) return {}
  return {
    ...sanitizeUser(user),
    allergies: parseAllergies(user.allergies)
  }
}
