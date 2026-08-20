'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// URL foto dari Supabase Storage bucket "hero-slides"
const BASE = 'https://nimqptwgvatvlvhvugdf.supabase.co/storage/v1/object/public/hero-slides';

const SLIDES = [
  { id: 1, src: `${BASE}/FOTO%201.jpeg`, alt: 'Foto Kegiatan LMS Bina Sejahtera 1' },
  { id: 2, src: `${BASE}/FOTO%202.jpeg`, alt: 'Foto Kegiatan LMS Bina Sejahtera 2' },
  { id: 3, src: `${BASE}/FOTO%203.jpeg`, alt: 'Foto Kegiatan LMS Bina Sejahtera 3' },
  { id: 4, src: `${BASE}/FOTO%204.jpeg`, alt: 'Foto Kegiatan LMS Bina Sejahtera 4' },
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % SLIDES.length);
  };

  const handleImageError = (id) => {
    setFailedImages(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div
      className="hero-slider-glow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 560,
        aspectRatio: '16 / 9',
        borderRadius: 20,
        overflow: 'hidden',
        background: '#E2E8F0',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Slides */}
      {SLIDES.map((slide, idx) => {
        const isActive = idx === currentIndex;
        const isFailed = failedImages[slide.id];

        return (
          <div
            key={slide.id}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {!isFailed ? (
              <img
                src={slide.src}
                alt={slide.alt}
                onError={() => handleImageError(slide.id)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            ) : (
              /* Fallback jika foto belum di-copy ke public/images/hero */
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                color: '#93C5FD',
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>
                  Foto {idx + 1} — Salin ke public/images/hero/slide-{idx + 1}.png
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Prev Arrow */}
      <button
        onClick={handlePrev}
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.50)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          transition: 'background 0.2s ease',
        }}
        aria-label="Slide sebelumnya"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Next Arrow */}
      <button
        onClick={handleNext}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.50)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          transition: 'background 0.2s ease',
        }}
        aria-label="Slide selanjutnya"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dot Indicators */}
      <div style={{
        position: 'absolute',
        bottom: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 7,
        zIndex: 20,
      }}>
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: idx === currentIndex ? 20 : 7,
              height: 7,
              borderRadius: 4,
              background: idx === currentIndex ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
            aria-label={`Ke slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
