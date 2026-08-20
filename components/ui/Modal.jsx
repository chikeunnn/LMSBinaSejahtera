'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer, size = 'md', closeOnBackdropClick = false }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const maxWidths = { sm: 400, md: 520, lg: 640, xl: 760 };

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (closeOnBackdropClick && e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      <div
        className="modal"
        style={{
          maxWidth: maxWidths[size] || 520,
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            gap: 16,
            background: '#FFFFFF'
          }}
        >
          <h2
            className="modal-title"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary, #0F172A)',
              margin: 0,
              lineHeight: 1.4,
              flex: 1
            }}
          >
            {title}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Tutup Modal"
            style={{
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              padding: 0,
              outline: 'none'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E2E8F0';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#F1F5F9';
              e.currentTarget.style.color = '#475569';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="modal-body"
          style={{
            padding: 20,
            overflowY: 'auto',
            flex: 1
          }}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            className="modal-footer"
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border, #E2E8F0)',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
