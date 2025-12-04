const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const inputSvg = path.join(__dirname, 'icons', 'icon.svg');
const outputDir = path.join(__dirname, 'icons');

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating PNG icons from SVG...\n');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon${size}.png`);

    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated icon${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate icon${size}.png:`, error.message);
    }
  }

  console.log('\nDone! All icons generated.');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
