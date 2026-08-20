/**
 * Converts slide-4.png to base64 and writes it as an ESM JS module
 * Run: node scripts/make-base64.js
 */
const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '..', 'public', 'images', 'hero', 'slide-4.png');
const outPath = path.join(__dirname, '..', 'lib', 'heroImage.js');

if (!fs.existsSync(imgPath)) {
  console.error('❌ File tidak ditemukan:', imgPath);
  process.exit(1);
}

const data = fs.readFileSync(imgPath);
const base64 = data.toString('base64');
const dataUri = `data:image/jpeg;base64,${base64}`;

// Write as ESM export (compatible with Next.js)
const jsContent = `// Auto-generated hero image - do not edit manually\nexport const HERO_IMAGE = '${dataUri}';\n`;

fs.writeFileSync(outPath, jsContent, 'utf8');
console.log('✅ Berhasil! File tersimpan di lib/heroImage.js');
console.log(`   Ukuran: ${Math.round(jsContent.length / 1024)} KB`);
