import { AUTH_COOKIE_MAX_AGE_MS } from './userHelpers.js'

export function setAuthCookie(res, token) {
  res.cookie('mecal_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_COOKIE_MAX_AGE_MS
  })
}
