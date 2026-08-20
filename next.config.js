const path = require('path');
const fs = require('fs');

// Ensure public/images/hero exists and local files are copied cleanly
try {
  const publicHeroDir = path.join(__dirname, 'public', 'images', 'hero');
  if (!fs.existsSync(publicHeroDir)) {
    fs.mkdirSync(publicHeroDir, { recursive: true });
  }

  const tempMediaStorage = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\8cf1459c-4097-4e30-9fc4-e619d693209b\\.tempmediaStorage';
  const userImages = [
    'media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557142829.png',
    'media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557147541.png',
    'media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557137423.png',
    'media_8cf1459c-4097-4e30-9fc4-e619d693209b_1786557093443.png'
  ];

  userImages.forEach((img, idx) => {
    const src = path.join(tempMediaStorage, img);
    const dest = path.join(publicHeroDir, `slide-${idx + 1}.png`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
} catch (e) {
  // Silent catch
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
};

module.exports = nextConfig;
