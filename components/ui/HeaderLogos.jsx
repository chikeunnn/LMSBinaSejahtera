'use client';

import { LOGO_HEADER } from '@/lib/logoImage';

/**
 * HeaderLogos Component
 * Menampilkan logo asli institusi (Tut Wuri, DIKTISAINTEK, Ditjen Risbang, JGU, Bina Sejahtera)
 * Menggunakan base64 dari lib/logoImage.js agar 100% tampil di Vercel tanpa perlu upload manual.
 */
export default function HeaderLogos({ size = 48, className = '' }) {
  // Gambar logo adalah banner landscape panjang ~1000x130px (rasio 7.7:1)
  // Kita biarkan auto-width agar logo tidak terdistorsi
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
          width: 'auto',
          maxWidth: Math.round(size * 7.7),
          objectFit: 'contain',
          objectPosition: 'left center',
        }}
      />
    </div>
  );
}
