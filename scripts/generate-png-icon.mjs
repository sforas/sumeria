import sharp from 'sharp'

// SVG of ziggurat on ink background
const svg = `<svg viewBox="0 0 400 420" width="512" height="512"
  xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="420" fill="#1A1A1A"/>
  <path d="M 5 380 L 395 380 L 365.8 346.2 L 34.2 346.2 Z" fill="#D8C9A3"/>
  <path d="M 49.2 337.1 L 350.8 337.1 L 328.2 303.3 L 71.8 303.3 Z" fill="#D8C9A3"/>
  <path d="M 83 294.2 L 317 294.2 L 299.4 260.4 L 100.5 260.4 Z" fill="#D8C9A3"/>
  <path d="M 111.6 251.3 L 288.4 251.3 L 275.1 217.5 L 124.9 217.5 Z" fill="#D8C9A3"/>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M 135 208.4 L 265 208.4 L 265 156.4 L 135 156.4 Z M 171.4 208.4 L 228.6 208.4 L 215.7 176.2 L 184.3 176.2 Z"
    fill="#D8C9A3"
  />
</svg>`

async function generateIcons() {
  const svgBuffer = Buffer.from(svg)

  // Generate 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png')
  console.log('✓ public/icon-512.png')

  // Generate 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png')
  console.log('✓ public/icon-192.png')

  // Generate 180x180 PNG (apple-touch-icon)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png')
  console.log('✓ public/apple-touch-icon.png')
}

generateIcons().catch(console.error)
