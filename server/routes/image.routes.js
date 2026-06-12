import express from 'express';

const router = express.Router();

router.get('/generate', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).send('Missing query parameter');
    }
    
    // Create a detailed prompt for better food images
    const prompt = encodeURIComponent(`Professional high quality top-down food photography of ${q}, appetizing, realistic, well-lit, restaurant style`);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=400&height=300&nologo=true`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    try {
      const imageResponse = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!imageResponse.ok) {
        return res.status(imageResponse.status).send('Failed to generate image');
      }
      
      // Set caching and content type headers
      res.set('Content-Type', imageResponse.headers.get('content-type') || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      
      // Convert Web stream to buffer and send
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.send(buffer);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`Image generation timed out for: ${q}`);
        return res.status(504).send('Image generation timed out');
      }
      throw error;
    }
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;
