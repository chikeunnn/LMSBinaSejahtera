'use client';

import { useState } from 'react';

export default function HeaderLogos({ size = 36, className = '' }) {
  const [imgError, setImgError] = useState(false);

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
      {!imgError ? (
        <img
          src="/images/logo-header.png"
          alt="Logo Diktisainstek, JGU & Bina Sejahtera"
          onError={() => setImgError(true)}
          style={{
            height: size,
            width: 'auto',
            maxHeight: size,
            objectFit: 'contain',
            borderRadius: 6,
          }}
        />
      ) : (
        /* Fallback SVG Badge dengan Logo Kemdiktisainstek, JGU, & Sekolah */
        <div
          title="Logo Sponsor & Institusi (DPPM Kemdiktisainstek & JGU)"
          style={{
            height: size,
            padding: '0 8px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Logo 1: DIKTISAINTEK / Kemdiktisainstek Symbol */}
          <svg width={Math.round(size * 0.65)} height={Math.round(size * 0.65)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#1D4ED8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* Divider kecil */}
          <div style={{ width: 1, height: Math.round(size * 0.5), background: '#CBD5E1' }} />

          {/* Logo 2: JGU & Sekolah Text Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
            <span style={{ fontSize: Math.max(9, Math.round(size * 0.28)), fontWeight: 800, color: '#1E3A8A', letterSpacing: '0.02em' }}>
              DIKTI • JGU
            </span>
            <span style={{ fontSize: Math.max(7, Math.round(size * 0.2)), color: '#64748B', fontWeight: 600, marginTop: 1 }}>
              Bina Sejahtera
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
