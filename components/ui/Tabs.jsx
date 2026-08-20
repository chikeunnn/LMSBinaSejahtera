'use client';

import { useState } from 'react';

export default function Tabs({ tabs, defaultTab, onChange }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.key);

  const handleClick = (key) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div
      className="tabs"
      role="tablist"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#F1F5F9',
        padding: '6px',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        overflowX: 'auto',
        maxWidth: '100%'
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: isActive ? 700 : 600,
              color: isActive ? '#FFFFFF' : '#475569',
              background: isActive ? '#2563EB' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
