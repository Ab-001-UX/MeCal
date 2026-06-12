export function getStartOfToday(req) {
  return getStartOfDay(req, Date.now())
}

export function getEndOfToday(req) {
  return getEndOfDay(req, Date.now())
}

export function getStartOfDay(req, dateInput) {
  const offsetMinutes = parseInt(req.headers['x-timezone-offset'] || '0', 10)
  const userTime = new Date(dateInput).getTime() - offsetMinutes * 60 * 1000
  const userMidnight = new Date(userTime)
  userMidnight.setUTCHours(0, 0, 0, 0)
  return new Date(userMidnight.getTime() + offsetMinutes * 60 * 1000)
}

export function getEndOfDay(req, dateInput) {
  const start = getStartOfDay(req, dateInput)
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}
