const fs = require('fs');
const path = require('path');

const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

console.log('✅ Folder public/images siap!');
