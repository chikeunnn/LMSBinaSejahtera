/**
 * Converts logo header image to base64 and writes it as an ESM JS module
 * Run: node scripts/make-logo-base64.js
 *
 * CARA PAKAI:
 * 1. Simpan gambar logo Anda sebagai: public/images/logo-header.png
 * 2. Jalankan: node scripts/make-logo-base64.js
 * 3. File lib/logoImage.js akan otomatis dibuat
 */
const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '..', 'public', 'images', 'logo-header.png');
const outPath = path.join(__dirname, '..', 'lib', 'logoImage.js');

// Cek apakah file tersedia
if (!fs.existsSync(imgPath)) {
  console.error('❌ File tidak ditemukan:', imgPath);
  console.log('');
  console.log('Langkah yang harus dilakukan:');
  console.log('  1. Simpan gambar logo kamu ke: public/images/logo-header.png');
  console.log('  2. Jalankan ulang script ini: node scripts/make-logo-base64.js');
  process.exit(1);
}

// Baca dan konversi ke base64
const data = fs.readFileSync(imgPath);
const base64 = data.toString('base64');
const ext = path.extname(imgPath).replace('.', '');
const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
const dataUri = `data:${mime};base64,${base64}`;

// Tulis sebagai ESM module (kompatibel dengan Next.js)
const jsContent = `// Auto-generated logo image - do not edit manually\nexport const LOGO_HEADER = '${dataUri}';\n`;

fs.writeFileSync(outPath, jsContent, 'utf8');
console.log('✅ Berhasil! Logo tersimpan di lib/logoImage.js');
console.log(`   Ukuran file: ${Math.round(jsContent.length / 1024)} KB`);
console.log('');
console.log('Langkah selanjutnya:');
console.log('  1. Jalankan: npm run dev');
console.log('  2. Cek header di browser — logo harus sudah muncul!');
console.log('  3. Push ke GitHub: git add . && git commit -m "Add logo header" && git push origin main');
