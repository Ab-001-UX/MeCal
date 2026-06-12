import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const token = req.cookies.mecal_token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorised' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')
    req.user = { id: decoded.userId }
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
  }
}
