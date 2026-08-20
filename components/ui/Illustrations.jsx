// Inline SVG illustrations untuk LMS Bina Sejahtera
// Dengan animasi CSS halus dan kanvas viewBox luas agar tidak terpotong saat bergerak

export function HeroIllustration({ width = 320, height = 240 }) {
  return (
    <svg viewBox="-20 -20 440 340" width={width} height={height} xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      {/* Background circles */}
      <circle cx="320" cy="70" r="90" fill="#DBEAFE" opacity="0.65" className="animate-pulse-glow" />
      <circle cx="50" cy="220" r="70" fill="#EDE9FE" opacity="0.55" className="animate-pulse-glow" />

      {/* Desk */}
      <rect x="40" y="215" width="320" height="12" rx="6" fill="#94A3B8" />
      <rect x="70" y="227" width="10" height="35" rx="5" fill="#CBD5E1" />
      <rect x="320" y="227" width="10" height="35" rx="5" fill="#CBD5E1" />

      {/* --- STUDENT BEHIND THE DESK --- */}
      {/* Shirt */}
      <path d="M150 215 L150 160 C150 142 165 130 200 130 C235 130 250 142 250 160 L250 215 Z" fill="#2563EB" />
      {/* Collar */}
      <polygon points="200,148 185,130 200,132 215,130" fill="#FFFFFF" />

      {/* Neck */}
      <rect x="190" y="112" width="20" height="20" fill="#FDE68A" rx="4" />

      {/* Head */}
      <circle cx="200" cy="92" r="28" fill="#FEF3C7" />
      {/* Hair */}
      <path d="M172 90 C172 65 228 65 228 90 C228 92 225 80 200 78 C175 80 172 92 172 90 Z" fill="#1E293B" />
      <path d="M172 90 Q168 100 174 108" stroke="#1E293B" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M228 90 Q232 100 226 108" stroke="#1E293B" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Graduation Cap on Head */}
      <g transform="translate(160, 42)">
        <polygon points="40,4 80,18 40,32 0,18" fill="#1E3A8A" />
        <rect x="20" y="22" width="40" height="14" rx="3" fill="#1E293B" />
        <path d="M72 20 L72 36" stroke="#F59E0B" strokeWidth="2.5" />
        <circle cx="72" cy="37" r="3" fill="#F59E0B" />
      </g>

      {/* Eyes & Smile */}
      <circle cx="190" cy="94" r="3.5" fill="#1E293B" />
      <circle cx="210" cy="94" r="3.5" fill="#1E293B" />
      <circle cx="191" cy="93" r="1.2" fill="white" />
      <circle cx="211" cy="93" r="1.2" fill="white" />
      <path d="M192 104 Q200 110 208 104" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Smart Glasses */}
      <circle cx="190" cy="94" r="8" fill="none" stroke="#2563EB" strokeWidth="2" />
      <circle cx="210" cy="94" r="8" fill="none" stroke="#2563EB" strokeWidth="2" />
      <line x1="198" y1="94" x2="202" y2="94" stroke="#2563EB" strokeWidth="2" />

      {/* --- LAPTOP IN FRONT ON DESK --- */}
      <rect x="110" y="115" width="180" height="95" rx="8" fill="#1E293B" />
      <rect x="118" y="121" width="164" height="83" rx="5" fill="#0F172A" />

      {/* LMS Dashboard Screen */}
      <rect x="120" y="123" width="160" height="79" rx="4" fill="#EFF6FF" />
      {/* Screen Header */}
      <rect x="120" y="123" width="160" height="16" rx="4" fill="#2563EB" />
      <circle cx="128" cy="131" r="3" fill="#EF4444" />
      <circle cx="136" cy="131" r="3" fill="#F59E0B" />
      <circle cx="144" cy="131" r="3" fill="#10B981" />
      <rect x="156" y="128" width="60" height="6" rx="3" fill="#BFDBFE" />

      {/* Screen Video / Course Player Box */}
      <rect x="128" y="145" width="80" height="48" rx="4" fill="#DBEAFE" />
      <circle cx="168" cy="169" r="12" fill="#2563EB" />
      <polygon points="165,163 174,169 165,175" fill="white" />

      {/* Course Info & Progress Bar */}
      <rect x="216" y="145" width="56" height="6" rx="3" fill="#1E293B" />
      <rect x="216" y="155" width="40" height="4" rx="2" fill="#64748B" />
      <rect x="216" y="163" width="50" height="4" rx="2" fill="#64748B" />
      
      {/* Green Progress */}
      <rect x="216" y="175" width="56" height="6" rx="3" fill="#E2E8F0" />
      <rect x="216" y="175" width="42" height="6" rx="3" fill="#10B981" />

      {/* Laptop Base Keyboard */}
      <path d="M90 215 L110 210 L290 210 L310 215 Z" fill="#64748B" />
      <rect x="180" y="211" width="40" height="3" rx="1" fill="#94A3B8" />

      {/* --- FLOATING EDUCATIONAL CARDS WITH ANIMATION --- */}
      {/* 1. PDF / Material Card - Top Left */}
      <g transform="translate(30, 45)">
        <g className="animate-float">
          <rect x="0" y="0" width="64" height="48" rx="8" fill="#FFFFFF" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.08))" />
          <rect x="8" y="8" width="24" height="24" rx="6" fill="#DBEAFE" />
          <path d="M14 14 L26 14 M14 18 L26 18 M14 22 L22 22" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
          <rect x="36" y="10" width="20" height="4" rx="2" fill="#1E293B" />
          <rect x="36" y="18" width="16" height="3" rx="1.5" fill="#94A3B8" />
          <rect x="8" y="36" width="48" height="4" rx="2" fill="#EFF6FF" />
          <rect x="8" y="36" width="32" height="4" rx="2" fill="#3B82F6" />
        </g>
      </g>

      {/* 2. Passed Quiz Badge - Bottom Right */}
      <g transform="translate(310, 145)">
        <g className="animate-float-delayed">
          <rect x="0" y="0" width="68" height="52" rx="8" fill="#FFFFFF" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.08))" />
          <circle cx="20" cy="20" r="12" fill="#D1FAE5" />
          <path d="M15 20 L18 23 L25 16" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="36" y="14" width="24" height="4" rx="2" fill="#065F46" />
          <rect x="36" y="22" width="18" height="3" rx="1.5" fill="#10B981" />
          <rect x="8" y="38" width="52" height="6" rx="3" fill="#ECFDF5" />
        </g>
      </g>

      {/* 3. Golden Star - Top Center */}
      <g transform="translate(200, 10)">
        <g className="animate-float">
          <polygon points="12,0 15,8 24,9 17,15 19,24 12,19 5,24 7,15 0,9 9,8" fill="#F59E0B" />
        </g>
      </g>
    </svg>
  );
}

export function StudyIllustration({ width = 300, height = 260 }) {
  return (
    <svg viewBox="-30 -30 460 380" width={width} height={height} xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      {/* Background blobs */}
      <circle cx="200" cy="160" r="130" fill="#EDE9FE" opacity="0.55" className="animate-pulse-glow" />
      <circle cx="80" cy="260" r="60" fill="#DBEAFE" opacity="0.4" className="animate-pulse-glow" />

      {/* Stack of books - bottom */}
      <g className="animate-float-slow">
        <rect x="60" y="240" width="160" height="26" rx="5" fill="#2563EB" />
        <rect x="66" y="247" width="148" height="4" rx="2" fill="#93C5FD" opacity="0.6" />
        <rect x="70" y="214" width="140" height="26" rx="5" fill="#059669" />
        <rect x="76" y="221" width="128" height="4" rx="2" fill="#6EE7B7" opacity="0.6" />
        <rect x="80" y="188" width="120" height="26" rx="5" fill="#D97706" />
        <rect x="86" y="195" width="108" height="4" rx="2" fill="#FDE68A" opacity="0.6" />
      </g>

      {/* Student Character - right side */}
      <g>
        {/* Body / shirt */}
        <path d="M255 295 L255 235 C255 215 272 200 300 200 C328 200 345 215 345 235 L345 295 Z" fill="#7C3AED" />
        {/* Collar detail */}
        <polygon points="300,218 285,200 300,203 315,200" fill="#FFFFFF" opacity="0.9" />

        {/* Neck */}
        <rect x="290" y="182" width="20" height="20" rx="4" fill="#FDE68A" />

        {/* Head */}
        <circle cx="300" cy="160" r="32" fill="#FEF3C7" />

        {/* Hair - full and neat */}
        <path d="M268 155 C268 125 332 125 332 155 C332 158 328 142 300 140 C272 142 268 158 268 155 Z" fill="#1E293B" />
        {/* Side hair strands */}
        <path d="M268 155 Q264 168 270 178" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M332 155 Q336 168 330 178" stroke="#1E293B" strokeWidth="5" fill="none" strokeLinecap="round" />

        {/* Graduation cap */}
        <g transform="translate(258, 110)">
          <polygon points="42,4 84,20 42,36 0,20" fill="#1E3A8A" />
          <rect x="22" y="24" width="40" height="16" rx="4" fill="#1E293B" />
          <path d="M76 22 L76 42" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
          <circle cx="76" cy="44" r="4" fill="#F59E0B" />
        </g>

        {/* Eyes */}
        <circle cx="291" cy="162" r="4" fill="#1E293B" />
        <circle cx="309" cy="162" r="4" fill="#1E293B" />
        {/* Eye shine */}
        <circle cx="293" cy="160" r="1.5" fill="white" />
        <circle cx="311" cy="160" r="1.5" fill="white" />
        {/* Smile */}
        <path d="M291 172 Q300 180 309 172" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Cheek blush */}
        <circle cx="282" cy="172" r="5" fill="#FCA5A5" opacity="0.5" />
        <circle cx="318" cy="172" r="5" fill="#FCA5A5" opacity="0.5" />
      </g>

      {/* Floating lightbulb - top left */}
      <g className="animate-float" transform="translate(30, 60)">
        <circle cx="22" cy="22" r="18" fill="#FDE68A" />
        <circle cx="22" cy="22" r="13" fill="#F59E0B" />
        <rect x="17" y="38" width="10" height="7" rx="2" fill="#94A3B8" />
        <rect x="16" y="44" width="12" height="3" rx="1.5" fill="#94A3B8" />
        {/* Light rays */}
        <line x1="22" y1="0" x2="22" y2="-6" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="38" y1="6" x2="42" y2="2" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="44" y1="22" x2="50" y2="22" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="4" y1="6" x2="0" y2="2" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="0" y1="22" x2="-6" y2="22" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Floating star - top right */}
      <g className="animate-wave" transform="translate(360, 80)">
        <polygon points="12,0 15,9 24,10 17,17 19,26 12,21 5,26 7,17 0,10 9,9" fill="#F59E0B" />
      </g>

      {/* Floating check badge */}
      <g className="animate-float-delayed" transform="translate(340, 200)">
        <rect x="0" y="0" width="52" height="40" rx="10" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.08))" />
        <circle cx="18" cy="20" r="10" fill="#D1FAE5" />
        <path d="M13 20 L17 24 L24 14" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="30" y="14" width="16" height="3" rx="1.5" fill="#10B981" />
        <rect x="30" y="21" width="12" height="3" rx="1.5" fill="#6EE7B7" />
      </g>
    </svg>
  );
}

export function LoginIllustration({ width = 280, height = 320 }) {
  return (
    <svg viewBox="-20 -20 440 360" width={width} height={height} xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
      <circle cx="200" cy="160" r="130" fill="rgba(255,255,255,0.12)" className="animate-pulse-glow" />

      {/* Open book */}
      <path d="M80 180 Q140 160 200 180 Q260 160 320 180 L320 250 Q260 230 200 250 Q140 230 80 250 Z" fill="white" opacity="0.95" />
      <path d="M200 180 L200 250" stroke="#CBD5E1" strokeWidth="3" />

      {/* Lines on pages */}
      <line x1="100" y1="198" x2="180" y2="192" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="100" y1="212" x2="170" y2="206" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="100" y1="226" x2="175" y2="220" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

      <line x1="220" y1="192" x2="300" y2="198" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="230" y1="206" x2="300" y2="212" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="225" y1="220" x2="300" y2="226" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Floating Graduation Cap */}
      <g className="animate-float" transform="translate(140, 50)">
        <polygon points="60,10 120,35 60,60 0,35" fill="white" />
        <rect x="30" y="44" width="60" height="28" rx="6" fill="rgba(255,255,255,0.85)" />
        <path d="M110 38 L110 75" stroke="#FDE047" strokeWidth="4" />
        <circle cx="110" cy="78" r="6" fill="#FDE047" />
      </g>

      {/* Floating Star */}
      <g className="animate-wave" transform="translate(50, 90)">
        <polygon points="15,0 19,10 30,11 22,19 24,30 15,24 6,30 8,19 0,11 11,10" fill="#FDE047" />
      </g>

      {/* Floating Checkmark */}
      <g className="animate-float-delayed" transform="translate(310, 100)">
        <circle cx="20" cy="20" r="20" fill="#4ADE80" />
        <path d="M12 20 L18 26 L29 14" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
