/**
 * Upload hero slide photos to Supabase Storage
 * Run: node scripts/upload-hero-photos.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://nimqptwgvatvlvhvugdf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbXFwdHdndmF0dmx2aHZ1Z2RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU0NDQ0MywiZXhwIjoyMTAyMTIwNDQzfQ.uoRyakjys11sbNtJ5GwxbTkjgRGU-cuLTXPX2KYrPZs';
const BUCKET = 'hero-slides';

const tempMediaStorage = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\8cf1459c-4097-4e30-9fc4-e619d693209b\\.tempmediaStorage';

const photos = [
  { file: 'media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557142829.png', name: 'slide-1.png' },
  { file: 'media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557147541.png', name: 'slide-2.png' },
  { file: 'media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557137423.png', name: 'slide-3.png' },
  { file: 'media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557093443.png', name: 'slide-4.png' },
];

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function ensureBucket() {
  const url = new URL(`${SUPABASE_URL}/storage/v1/bucket`);
  try {
    // Try to create bucket (idempotent - won't fail if exists)
    const body = JSON.stringify({ id: BUCKET, name: BUCKET, public: true });
    const res = await httpsRequest({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    }, body);
    if (res.status === 200 || res.status === 201) {
      console.log(`✅ Bucket "${BUCKET}" siap`);
    } else {
      // Bucket may already exist, try to make it public
      const body2 = JSON.stringify({ public: true });
      await httpsRequest({
        hostname: url.hostname,
        path: `${url.pathname}/${BUCKET}`,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body2),
        }
      }, body2);
      console.log(`✅ Bucket "${BUCKET}" sudah ada`);
    }
  } catch (e) {
    console.log(`⚠️  Bucket check: ${e.message}`);
  }
}

async function uploadFile(localPath, remoteName) {
  const fileBuffer = fs.readFileSync(localPath);
  const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${remoteName}`);

  const res = await httpsRequest({
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'image/png',
      'Content-Length': fileBuffer.length,
      'x-upsert': 'true',
    }
  }, fileBuffer);

  if (res.status === 200 || res.status === 201) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${remoteName}`;
    return publicUrl;
  } else {
    throw new Error(`HTTP ${res.status}: ${res.body}`);
  }
}

async function main() {
  console.log('🚀 Upload foto hero ke Supabase Storage...\n');

  await ensureBucket();

  const urls = [];
  for (const photo of photos) {
    const srcPath = path.join(tempMediaStorage, photo.file);
    if (!fs.existsSync(srcPath)) {
      console.log(`❌ File tidak ditemukan: ${photo.file}`);
      continue;
    }

    try {
      const url = await uploadFile(srcPath, photo.name);
      urls.push({ name: photo.name, url });
      console.log(`✅ ${photo.name} → ${url}`);
    } catch (e) {
      console.log(`❌ Gagal upload ${photo.name}: ${e.message}`);
    }
  }

  if (urls.length > 0) {
    console.log('\n📋 SALIN URL INI ke HeroSlider.jsx:');
    urls.forEach((u, i) => {
      console.log(`  slide ${i + 1}: '${u.url}'`);
    });
  }
}

main();
