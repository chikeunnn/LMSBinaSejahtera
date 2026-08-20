'use client';

/**
 * HeaderLogos Component
 * Menampilkan logo asli institusi (Tut Wuri, DIKTISAINTEK, Ditjen Risbang, JGU, Bina Sejahtera)
 * Menggunakan base64 dari lib/logoImage.js agar 100% tampil di Vercel tanpa perlu upload manual.
 */

let LOGO_HEADER = null;
try {
  // Import dinamis — hanya jalan setelah generate base64
  const logoModule = require('@/lib/logoImage');
  LOGO_HEADER = logoModule.LOGO_HEADER;
} catch (e) {
  // File belum di-generate — fallback ke gambar dari public/images
  LOGO_HEADER = null;
}

export default function HeaderLogos({ size = 36, className = '' }) {
  // Hitung width proporsional: gambar asli ~1000x130px, rasio ~7.7:1
  const logoWidth = Math.round(size * 4.5);

  if (LOGO_HEADER) {
    return (
      <div
        className={`header-logos-container ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: size,
          flexShrink: 0,
        }}
      >
        <img
          src={LOGO_HEADER}
          alt="Logo Tut Wuri Handayani, DIKTISAINTEK, Ditjen Risbang, JGU, SMP Bina Sejahtera"
          style={{
            height: size,
            width: logoWidth,
            objectFit: 'contain',
            objectPosition: 'left center',
          }}
        />
      </div>
    );
  }

  // Fallback: coba dari public/images/logo-header.png
  return (
    <div
      className={`header-logos-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: size,
        flexShrink: 0,
      }}
    >
      <img
        src="/images/logo-header.png"
        alt="Logo Tut Wuri Handayani, DIKTISAINTEK, Ditjen Risbang, JGU, SMP Bina Sejahtera"
        style={{
          height: size,
          width: 'auto',
          maxWidth: logoWidth,
          objectFit: 'contain',
          objectPosition: 'left center',
        }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}
