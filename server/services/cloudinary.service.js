const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function estimateBase64Bytes(base64Image) {
  const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
  return Math.ceil((data.length * 3) / 4)
}

export async function uploadImage(base64Image) {
  if (!base64Image) {
    throw new Error('Validation failed: No image provided')
  }

  // Enforce type checks before calculating size or uploading
  if (base64Image.startsWith('data:')) {
    const matches = base64Image.match(/^data:([^;]+);base64,/)
    if (matches) {
      const mimeType = matches[1]
      if (!ALLOWED_TYPES.includes(mimeType)) {
        throw new Error('Validation failed: Only JPEG, PNG, and WebP images are allowed')
      }
    } else {
      throw new Error('Validation failed: Invalid image format')
    }
  } else {
    // Raw base64 validation by magic signature prefix
    const prefix = base64Image.substring(0, 30)
    const isJpeg = prefix.startsWith('/9j/')
    const isPng = prefix.startsWith('iVBORw0KGgo')
    const isWebp = prefix.startsWith('UklGR') // RIFF header for WebP
    if (!isJpeg && !isPng && !isWebp) {
      throw new Error('Validation failed: Only JPEG, PNG, and WebP images are allowed')
    }
  }

  if (estimateBase64Bytes(base64Image) > MAX_IMAGE_BYTES) {
    throw new Error('Validation failed: Image must be under 5MB')
  }

  let cloudName = process.env.CLOUDINARY_CLOUD_NAME
  let apiKey = process.env.CLOUDINARY_API_KEY
  let apiSecret = process.env.CLOUDINARY_API_SECRET

  // Fallback to parsing CLOUDINARY_URL if individual variables are not defined
  if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
    try {
      const url = process.env.CLOUDINARY_URL
      // Parse format: cloudinary://api_key:api_secret@cloud_name
      const matches = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/)
      if (matches) {
        apiKey = matches[1]
        apiSecret = matches[2]
        cloudName = matches[3]
      }
    } catch (e) {
      console.error('Failed to parse CLOUDINARY_URL:', e.message)
    }
  }

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('Cloudinary credentials missing — using placeholder image URL')
    return {
      secure_url: 'https://via.placeholder.com/400x300.png?text=MeCal+Food'
    }
  }

  const dataUri = base64Image.startsWith('data:')
    ? base64Image
    : `data:image/jpeg;base64,${base64Image.split(',')[1] || base64Image}`

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: dataUri,
        folder: 'mecal/food-scans'
      })
    }
  )

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    console.error('Cloudinary upload failed:', errBody)
    throw new Error('Failed to upload image')
  }

  const result = await response.json()
  return { secure_url: result.secure_url }
}
