import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'sm', showText = true, className = '' }) => {
  const containerWidths = {
    xs: 'w-20',
    sm: 'w-32',
    md: 'w-44',
    lg: 'w-56',
    xl: 'w-64',
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${containerWidths[size]} ${className}`}>
      <svg
        viewBox="0 0 620 400"
        className="w-full h-auto drop-shadow-2xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 3D Metallic Gold Gradients */}
          <linearGradient id="primeGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="25%" stopColor="#F5D061" />
            <stop offset="50%" stopColor="#D4A017" />
            <stop offset="75%" stopColor="#AA7A0A" />
            <stop offset="100%" stopColor="#634503" />
          </linearGradient>

          <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#FBE385" />
            <stop offset="100%" stopColor="#B3830E" />
          </linearGradient>

          <linearGradient id="goldPulse" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFE07D" />
            <stop offset="50%" stopColor="#F5C431" />
            <stop offset="100%" stopColor="#CA920E" />
          </linearGradient>

          {/* Deep Purple Glossy Gradients */}
          <radialGradient id="purpleGlossCross" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#5E1D94" />
            <stop offset="45%" stopColor="#370B5C" />
            <stop offset="85%" stopColor="#1F0438" />
            <stop offset="100%" stopColor="#120124" />
          </radialGradient>

          <linearGradient id="purpleTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A1180" />
            <stop offset="50%" stopColor="#2D0752" />
            <stop offset="100%" stopColor="#17012B" />
          </linearGradient>

          {/* Shadow & Glow Filters */}
          <filter id="logoDepth" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="6" stdDeviation="5" floodColor="#0A0214" floodOpacity="0.45" />
          </filter>

          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- MAIN EMBLEM GROUP --- */}
        <g filter="url(#logoDepth)">
          {/* Stethoscope Golden Circular Outer Tube Arc */}
          <path
            d="M 400 85 A 120 120 0 1 0 395 255 C 415 270 425 290 395 310 C 375 322 355 305 350 288"
            fill="none"
            stroke="url(#primeGold)"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Top-Right Golden Stethoscope Node Ball */}
          <circle cx="403" cy="80" r="11" fill="url(#primeGold)" />
          <circle cx="401" cy="78" r="4" fill="#FFF8D6" opacity="0.9" />

          {/* Bottom Golden Stethoscope Chest Piece / Bell */}
          <g transform="translate(365, 275)">
            <circle cx="20" cy="20" r="18" fill="url(#primeGold)" />
            <circle cx="20" cy="20" r="13" fill="#2D0752" stroke="url(#primeGold)" strokeWidth="2.5" />
            <circle cx="20" cy="20" r="6" fill="url(#primeGold)" />
            <circle cx="18" cy="18" r="2" fill="#FFF8D6" opacity="0.8" />
          </g>

          {/* CENTRAL DEEP PURPLE MEDICAL CROSS */}
          {/* 1. Outer Gold Bevel Border Frame */}
          <path
            d="M 245 50 L 295 50 Q 305 50 305 60 L 305 100 Q 305 110 315 110 L 355 110 Q 365 110 365 120 L 365 170 Q 365 180 355 180 L 315 180 Q 305 180 305 190 L 305 230 Q 305 240 295 240 L 245 240 Q 235 240 235 230 L 235 190 Q 235 180 225 180 L 185 180 Q 175 180 175 170 L 175 120 Q 175 110 185 110 L 225 110 Q 235 110 235 100 L 235 60 Q 235 50 245 50 Z"
            fill="none"
            stroke="url(#primeGold)"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          {/* 2. Glossy Purple Cross Core */}
          <path
            d="M 245 50 L 295 50 Q 305 50 305 60 L 305 100 Q 305 110 315 110 L 355 110 Q 365 110 365 120 L 365 170 Q 365 180 355 180 L 315 180 Q 305 180 305 190 L 305 230 Q 305 240 295 240 L 245 240 Q 235 240 235 230 L 235 190 Q 235 180 225 180 L 185 180 Q 175 180 175 170 L 175 120 Q 175 110 185 110 L 225 110 Q 235 110 235 100 L 235 60 Q 235 50 245 50 Z"
            fill="url(#purpleGlossCross)"
            stroke="url(#goldHighlight)"
            strokeWidth="2"
          />

          {/* SMARTPHONE DEVICE ON RIGHT */}
          <g transform="translate(385, 95)">
            {/* Outer Gold & Purple Phone Casing */}
            <rect x="0" y="0" width="70" height="122" rx="16" fill="#2D0752" stroke="url(#primeGold)" strokeWidth="4.5" />
            {/* White Screen Viewport */}
            <rect x="5" y="6" width="60" height="110" rx="12" fill="#FFFFFF" />
            {/* Top Speaker Notch */}
            <rect x="25" y="9" width="20" height="3.5" rx="2" fill="#2D0752" />
            {/* Doctor Silhouette */}
            <circle cx="35" cy="33" r="11" fill="#2D0752" />
            <path d="M 18 63 C 18 48 24 45 35 45 C 46 45 52 48 52 63 Z" fill="#2D0752" />
            {/* Collar & Tie */}
            <polygon points="35,45 30,56 40,56" fill="#FFFFFF" />
            <polygon points="35,48 33,60 37,60" fill="#2D0752" />
            {/* Stethoscope on Doctor */}
            <path d="M 26 48 Q 26 57 35 57 Q 44 57 44 48" fill="none" stroke="url(#primeGold)" strokeWidth="2.5" />
            <circle cx="42" cy="52" r="3" fill="url(#primeGold)" />
            {/* 3 Interactive Dots below doctor */}
            <circle cx="26" cy="103" r="3" fill="#2D0752" />
            <circle cx="35" cy="103" r="3" fill="#2D0752" />
            <circle cx="44" cy="103" r="3" fill="#2D0752" />
          </g>

          {/* GOLD ECG HEARTBEAT PULSE LINE */}
          <g filter="url(#goldGlow)">
            {/* Left Starburst Spark Tip */}
            <path d="M 125 145 L 185 145" stroke="url(#primeGold)" strokeWidth="7" strokeLinecap="round" />
            <polygon points="125,145 116,140 125,135 134,140" fill="url(#primeGold)" />
            <polygon points="125,145 130,145 125,155 120,145" fill="url(#primeGold)" />

            {/* Sharp Pulse Wave Line */}
            <path
              d="M 175 145 L 240 145 L 252 95 L 268 185 L 282 80 L 298 165 L 310 135 L 320 145 L 392 145"
              fill="none"
              stroke="url(#primeGold)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* --- BRAND NAME & CROWN SECTION --- */}
        {showText && (
          <g transform="translate(10, 290)">
            {/* 3D Gold Crown above the letters 'P' and 'R' in PRIME */}
            <g transform="translate(102, 0)">
              <path
                d="M 5 24 L 0 5 L 13 14 L 22 0 L 31 14 L 44 5 L 39 24 Z"
                fill="url(#primeGold)"
                stroke="#634503"
                strokeWidth="1"
                filter="url(#logoDepth)"
              />
              {/* Crown Tip Pearls */}
              <circle cx="0" cy="5" r="2.5" fill="#FFFFFF" />
              <circle cx="22" cy="0" r="3" fill="#FFFFFF" />
              <circle cx="44" cy="5" r="2.5" fill="#FFFFFF" />
              {/* Crown Base Band with Gold Bevel */}
              <rect x="4" y="22" width="36" height="5" rx="1.5" fill="#5C3F02" />
              <rect x="5" y="23.5" width="34" height="2" rx="1" fill="url(#goldHighlight)" />
              {/* Center Purple Diamond Gemstone */}
              <polygon points="22,12 26,17 22,22 18,17" fill="#6B1D9C" stroke="url(#primeGold)" strokeWidth="1" />
            </g>

            {/* PRIME TEXT (Gold Metallic Serif) */}
            <text
              x="20"
              y="92"
              fontFamily="Playfair Display, Georgia, serif"
              fontSize="68"
              fontWeight="900"
              letterSpacing="2"
              fill="url(#primeGold)"
              stroke="#5C3F02"
              strokeWidth="1.5"
              filter="url(#logoDepth)"
            >
              PRIME
            </text>

            {/* TELECARE TEXT (Deep Purple Metallic Serif) */}
            <text
              x="272"
              y="92"
              fontFamily="Playfair Display, Georgia, serif"
              fontSize="68"
              fontWeight="900"
              letterSpacing="1"
              fill="url(#purpleTextGrad)"
              stroke="url(#primeGold)"
              strokeWidth="1.2"
              filter="url(#logoDepth)"
            >
              TELECARE
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

