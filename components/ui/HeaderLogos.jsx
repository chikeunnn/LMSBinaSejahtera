'use client';

import { useState } from 'react';

/**
 * HeaderLogos Component
 * Menampilkan 3 Logo Utama (Kemdiktisainstek, Jakarta Global University / JGU, & SMP Bina Sejahtera)
 * Menggunakan Pure SVG Vector agar 100% tajam, tanpa dependensi file eksternal, dan langsung tampil di Vercel.
 */
export default function HeaderLogos({ size = 36, className = '' }) {
  const [useCustomImg, setUseCustomImg] = useState(false);

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
      {useCustomImg ? (
        <img
          src="/images/logo-header.png"
          alt="Logo Diktisainstek, JGU & Bina Sejahtera"
          onError={() => setUseCustomImg(false)}
          style={{
            height: size,
            width: 'auto',
            maxHeight: size,
            objectFit: 'contain',
            borderRadius: 6,
          }}
        />
      ) : (
        /* Vector Logo Group (Kemdiktisainstek + JGU + Bina Sejahtera) */
        <div
          title="Logo Institusi: Kemdiktisainstek, JGU, & SMP Bina Sejahtera"
          style={{
            height: size,
            padding: '0 8px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: Math.max(6, Math.round(size * 0.18)),
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Logo 1: Kemdiktisainstek / DIKTI emblem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L3 8L16 14L29 8L16 2Z" fill="#1D4ED8" stroke="#1E40AF" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M5 14.5L16 20.5L27 14.5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 20L16 24.5L24 20" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="8" r="2.5" fill="#F59E0B"/>
            </svg>
            <span style={{ fontSize: Math.max(8, Math.round(size * 0.24)), fontWeight: 800, color: '#1E3A8A', letterSpacing: '-0.02em', lineHeight: 1 }}>
              DIKTI
            </span>
          </div>

          {/* Divider 1 */}
          <div style={{ width: 1, height: Math.round(size * 0.5), background: '#CBD5E1' }} />

          {/* Logo 2: JGU - Jakarta Global University emblem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 3L27 8V17C27 23.5 22 28.5 16 30C10 28.5 5 23.5 5 17V8L16 3Z" fill="#DC2626" opacity="0.9"/>
              <path d="M16 7L24 11V16.5C24 21C20.5 24.8 16 26 16 26C16 26 11.5 24.8 8 21V11L16 7Z" fill="#1E3A8A"/>
              <path d="M12 16L15 19L20 13" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: Math.max(8, Math.round(size * 0.24)), fontWeight: 800, color: '#DC2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
              JGU
            </span>
          </div>

          {/* Divider 2 */}
          <div style={{ width: 1, height: Math.round(size * 0.5), background: '#CBD5E1' }} />

          {/* Logo 3: Bina Sejahtera Emblem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="13" fill="#2563EB"/>
              <circle cx="16" cy="16" r="11" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="2 2"/>
              <path d="M10 18C10 15 12.5 12 16 12C19.5 12 22 15 22 18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round"/>
              <polygon points="16,8 20,13 12,13" fill="#F59E0B"/>
            </svg>
            <span style={{ fontSize: Math.max(8, Math.round(size * 0.24)), fontWeight: 800, color: '#2563EB', letterSpacing: '-0.02em', lineHeight: 1 }}>
              BINA SEJAHTERA
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
