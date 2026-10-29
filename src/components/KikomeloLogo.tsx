import React from 'react';

interface KikomeloLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  lightBg?: boolean;
}

export const KikomeloLogo: React.FC<KikomeloLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  lightBg = false,
}) => {
  // Dimensions based on size prop
  const dimensions = {
    sm: { width: 36, height: 36, textClass: 'text-xs', subtitleClass: 'text-[7px]' },
    md: { width: 48, height: 48, textClass: 'text-base font-extrabold', subtitleClass: 'text-[9px]' },
    lg: { width: 72, height: 72, textClass: 'text-2xl font-black', subtitleClass: 'text-xs' },
    xl: { width: 110, height: 110, textClass: 'text-3xl font-black', subtitleClass: 'text-sm' },
  }[size];

  // Vector SVG accurately matching the uploaded Kikomelo logo
  const LogoIcon = (
    <svg
      viewBox="0 0 200 200"
      width={dimensions.width}
      height={dimensions.height}
      className="shrink-0 drop-shadow-md select-none transition-transform hover:scale-105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle badge if requested */}
      {variant === 'badge' && (
        <circle cx="100" cy="100" r="96" fill="#fdfaf3" stroke="#e6b17e" strokeWidth="4" />
      )}

      <g transform="translate(10, 10) scale(0.9)">
        {/* Little green leaf on top of burger dome */}
        <path
          d="M 108 42 C 108 30, 126 30, 128 42 C 128 48, 115 50, 108 42 Z"
          fill="#8ba673"
        />

        {/* Top Bun Dome: Left Half (Sage/Olive Green) */}
        <path
          d="M 36 100 C 36 60, 68 45, 98 45 L 98 100 Z"
          fill="#94a86f"
          stroke="#9e5b3f"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Top Bun Dome: Right Half (Warm Golden Yellow / Ochre) */}
        <path
          d="M 98 45 C 128 45, 160 60, 160 100 L 98 100 Z"
          fill="#f3a94f"
          stroke="#9e5b3f"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Dome inner subtle shade curves */}
        <path
          d="M 48 90 C 52 70, 72 58, 88 56"
          stroke="#b2c68f"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M 148 90 C 144 70, 124 58, 108 56"
          stroke="#f8c37d"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Melted Cheese Corner peeking on the right */}
        <path
          d="M 125 102 L 152 102 L 140 120 Z"
          fill="#f59e0b"
          stroke="#9e5b3f"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Burger Patty / Meat Layer (Terracotta Rounded Bar) */}
        <rect
          x="28"
          y="100"
          width="140"
          height="18"
          rx="9"
          fill="#9e5b3f"
          stroke="#7a422d"
          strokeWidth="2"
        />

        {/* Bottom Bun (Golden Ochre with Terracotta outline) */}
        <path
          d="M 34 124 L 162 124 C 162 145, 138 152, 98 152 C 58 152, 34 145, 34 124 Z"
          fill="#f3a94f"
          stroke="#9e5b3f"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Bottom Bun Inner Light Highlight */}
        <path
          d="M 46 130 C 58 142, 138 142, 150 130"
          stroke="#f9d194"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Crossed Utensils White Backing / Plate Outline */}
        <ellipse
          cx="98"
          cy="88"
          rx="25"
          ry="30"
          fill="#ffffff"
          stroke="#9e5b3f"
          strokeWidth="4"
        />

        {/* Fork (left utensil crossing right) */}
        <g stroke="#9e5b3f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          {/* Handle */}
          <line x1="86" y1="110" x2="104" y2="60" />
          {/* Tines base */}
          <path d="M 98 68 Q 104 60 110 68" fill="none" strokeWidth="4" />
          <line x1="100" y1="64" x2="98" y2="52" strokeWidth="3.5" />
          <line x1="104" y1="62" x2="104" y2="50" strokeWidth="3.5" />
          <line x1="108" y1="64" x2="110" y2="52" strokeWidth="3.5" />
        </g>

        {/* Spoon (right utensil crossing left) */}
        <g stroke="#9e5b3f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          {/* Handle */}
          <line x1="110" y1="110" x2="92" y2="60" />
          {/* Spoon bowl */}
          <ellipse cx="88" cy="66" rx="9" ry="12" fill="#9e5b3f" transform="rotate(-15 88 66)" />
        </g>
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{LogoIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Icon with warm rounded aesthetic matching Kikomelo brand */}
      <div className="relative flex items-center justify-center">
        {LogoIcon}
      </div>

      {/* Typography: KIKOMELO + RESTAURANTE & LANCHONETE */}
      <div className="flex flex-col">
        <span
          className={`tracking-wider uppercase font-black font-['Plus_Jakarta_Sans',sans-serif] ${
            lightBg ? 'text-[#9e5b3f]' : 'text-white'
          } ${dimensions.textClass} leading-tight drop-shadow-sm`}
        >
          KIKOMELO<span className="text-orange-500">001</span>
        </span>
        <span
          className={`tracking-[0.2em] uppercase font-bold ${
            lightBg ? 'text-[#7a422d]' : 'text-orange-400'
          } ${dimensions.subtitleClass} leading-none mt-0.5`}
        >
          RESTAURANTE & LANCHONETE
        </span>
      </div>
    </div>
  );
};
