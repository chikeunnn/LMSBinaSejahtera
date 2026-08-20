const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\8cf1459c-4097-4e30-9fc4-e619d693209b\\.tempmediaStorage';
const dst = path.join(__dirname, '..', 'public', 'images', 'hero');

if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });

const files = [
  ['media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557142829.png', 'slide-1.png'],
  ['media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557147541.png', 'slide-2.png'],
  ['media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557137423.png', 'slide-3.png'],
  ['media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557093443.png', 'slide-4.png'],
];

files.forEach(([from, to]) => {
  const srcFile = path.join(src, from);
  const dstFile = path.join(dst, to);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, dstFile);
    console.log(`✅ ${to} berhasil disalin`);
  } else {
    console.log(`❌ File tidak ditemukan: ${from}`);
  }
});

console.log('\nSelesai! Cek folder: public/images/hero/');
