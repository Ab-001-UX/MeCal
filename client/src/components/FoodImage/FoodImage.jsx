import React, { useState, useEffect, useRef } from 'react'

// Simple grey placeholder — solid colour, no emoji (safe across all browsers)
const PLACEHOLDER_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%232a2a3e'/%3E%3C/svg%3E"

// Pollinations.ai fallback — generates AI food photo from name
function pollinationsUrl(name) {
  const prompt = encodeURIComponent(
    `delicious ${name} food photography realistic appetizing`
  )
  const seed = (name || 'food')
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return `https://image.pollinations.ai/prompt/${prompt}?width=400&height=300&nologo=true&seed=${seed}`
}

// In-memory cache so same food name always gets same URL without re-fetching
const imageCache = {}

export default function FoodImage({ name, className, style, alt }) {
  const [src, setSrc] = useState(imageCache[name] || PLACEHOLDER_SRC)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!name) return

    // Use cache if available
    if (imageCache[name]) {
      setSrc(imageCache[name])
      return
    }

    setSrc(PLACEHOLDER_SRC)

    // 1. Try Wikipedia first (free, real photos)
    const wikiTitle = name.trim().replace(/\s+/g, '_')
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`)
      .then((r) => {
        if (!r.ok) throw new Error('wiki 404')
        return r.json()
      })
      .then((data) => {
        if (!mountedRef.current) return
        if (data.thumbnail?.source) {
          // Request a larger version of the Wikipedia thumbnail
          const imgUrl = data.thumbnail.source.replace(/\/\d+px-/, '/400px-')
          imageCache[name] = imgUrl
          setSrc(imgUrl)
        } else {
          // Wikipedia has no image for this dish
          throw new Error('no wiki image')
        }
      })
      .catch(() => {
        // 2. Fall back to Pollinations AI image generation
        if (!mountedRef.current) return
        const fallback = pollinationsUrl(name)
        imageCache[name] = fallback
        setSrc(fallback)
      })
  }, [name])

  const handleError = () => {
    // If the loaded image URL breaks, try Pollinations instead
    const fallback = pollinationsUrl(name || 'food')
    if (src !== fallback) {
      imageCache[name] = fallback
      setSrc(fallback)
    } else {
      setSrc(PLACEHOLDER_SRC)
    }
  }

  return (
    <img
      src={src}
      alt={alt || name || 'food'}
      className={className}
      style={style}
      onError={handleError}
    />
  )
}
