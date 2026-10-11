import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  const sourceImage = '/app/applet/src/assets/images/app_icon_1791633595928.jpg';
  const publicDir = '/app/applet/public';

  if (!fs.existsSync(sourceImage)) {
    console.error('Source image not found:', sourceImage);
    process.exit(1);
  }

  console.log('Processing app icons from:', sourceImage);

  // 1. 192x192 PWA icon
  await sharp(sourceImage)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 2. 512x512 PWA icon
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. Maskable 512x512 icon (with safety margin / padding)
  await sharp(sourceImage)
    .resize(400, 400, { fit: 'contain', background: { r: 15, g: 43, b: 92, alpha: 1 } })
    .extend({
      top: 56,
      bottom: 56,
      left: 56,
      right: 56,
      background: { r: 15, g: 43, b: 92, alpha: 1 }
    })
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 4. Apple Touch Icon (180x180)
  await sharp(sourceImage)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  console.log('All application icons successfully updated!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
