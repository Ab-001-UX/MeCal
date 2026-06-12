import { AUTH_COOKIE_MAX_AGE_MS } from './userHelpers.js'

export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('mecal_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE_MS
  })
}

