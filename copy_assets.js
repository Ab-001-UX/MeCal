import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_PATH = "C:\\Users\\MONSURAT\\.gemini\\antigravity-ide\\brain\\73f74894-ab96-430f-8fe3-310b18f8baa9\\mecal_logo_icon_1781209173491.png";

const targets = [
  path.join(__dirname, 'client', 'public', 'icons', 'icon-192.png'),
  path.join(__dirname, 'client', 'public', 'icons', 'icon-512.png'),
  path.join(__dirname, 'client', 'public', 'icons', 'apple-touch-icon.png'),
  path.join(__dirname, 'client', 'public', 'favicon.png')
];

try {
  if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`Source image not found at: ${SOURCE_PATH}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(SOURCE_PATH);

  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'client', 'public', 'icons');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const target of targets) {
    fs.writeFileSync(target, imageBuffer);
    console.log(`Successfully written: ${target}`);
  }

  console.log("All PWA PNG icons copied successfully!");
} catch (error) {
  console.error("Failed to copy PWA assets:", error);
}
