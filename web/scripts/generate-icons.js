const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Try to use sharp if available, otherwise create minimal placeholder
async function generateIcons() {
  try {
    const sharp = require('sharp');
    
    const sizes = [192, 512];
    
    for (const size of sizes) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
        <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#0d9488"/>
        <text x="50%" y="55%" font-size="${Math.round(size * 0.5)}" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial">♻</text>
      </svg>`;
      
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(iconsDir, `icon-${size}.png`));
      
      console.log(`Created icon-${size}.png`);
    }
    
    console.log('Icons generated successfully!');
  } catch (e) {
    console.log('sharp module not available.');
    console.log('To generate proper icons, run: npm install sharp');
    console.log('Then run: node scripts/generate-icons.js');
    console.log('');
    console.log('Creating fallback placeholder icons...');
    
    // Create minimal valid PNG files as placeholders
    // These are 1x1 pixel PNGs that browsers will accept
    const minimalPNG = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, // bit depth: 8, color type: RGB
      0x00, 0x00, 0x00, // compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0xD7, 0x63, 0x50, 0xD2, 0x60, 0x00, 0x00, 0x00, 0x22, 0x00, 0x11, // compressed data
      0x01, 0x00, 0x00, 0x00, // IEND length (should be 0)
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), minimalPNG);
    fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), minimalPNG);
    console.log('Created placeholder icons (1x1 pixels)');
    console.log('Replace these with proper icons before production deployment.');
  }
}

generateIcons();
