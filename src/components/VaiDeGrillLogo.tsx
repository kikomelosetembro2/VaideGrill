import React from 'react';

interface VaiDeGrillLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'badge';
  lightBg?: boolean;
}

export const VaiDeGrillLogo: React.FC<VaiDeGrillLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  lightBg = false,
}) => {
  const dimensions = {
    sm: { width: 38, height: 38, textClass: 'text-sm font-black', subtitleClass: 'text-[8px]' },
    md: { width: 50, height: 50, textClass: 'text-lg font-black', subtitleClass: 'text-[10px]' },
    lg: { width: 75, height: 75, textClass: 'text-2xl font-black', subtitleClass: 'text-xs' },
    xl: { width: 115, height: 115, textClass: 'text-4xl font-black', subtitleClass: 'text-sm' },
  }[size];

  // Distinctive Grill & Flame SVG Vector Logo
  const LogoIcon = (
    <svg
      viewBox="0 0 200 200"
      width={dimensions.width}
      height={dimensions.height}
      className="shrink-0 drop-shadow-lg select-none transition-transform hover:scale-105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer shield or circular emblem */}
      <circle cx="100" cy="100" r="94" fill="#580c1f" stroke="#eab308" strokeWidth="5" />
      <circle cx="100" cy="100" r="86" fill="#36050b" stroke="#ca8a04" strokeWidth="2" strokeDasharray="6 4" />

      {/* Sizzling Grill Grate lines */}
      <g stroke="#eab308" strokeWidth="3" opacity="0.4">
        <line x1="50" y1="130" x2="150" y2="130" />
        <line x1="45" y1="142" x2="155" y2="142" />
        <line x1="55" y1="154" x2="145" y2="154" />
      </g>

      {/* Fiery Artisan Grill Flames (Mustard Yellow & Wine Flame) */}
      <g>
        {/* Back flame (Vinho sangue glow) */}
        <path
          d="M 100 28 C 115 50, 142 75, 132 105 C 122 85, 112 80, 106 65 C 100 85, 82 85, 68 105 C 60 78, 85 50, 100 28 Z"
          fill="#881337"
        />
        {/* Core flame (Amarelo mostarda vivo) */}
        <path
          d="M 100 40 C 110 58, 130 80, 122 102 C 114 88, 108 82, 104 70 C 98 84, 86 84, 78 102 C 70 80, 90 58, 100 40 Z"
          fill="#eab308"
        />
        {/* Inner flame hot core (White light) */}
        <path
          d="M 100 62 C 105 72, 114 84, 110 96 C 106 88, 102 85, 100 80 C 98 85, 94 88, 90 96 C 86 84, 95 72, 100 62 Z"
          fill="#ffffff"
        />
      </g>

      {/* Artisan Burger on the Grill */}
      <g transform="translate(0, 15)">
        {/* Top Bun */}
        <path
          d="M 54 95 C 54 75, 75 66, 100 66 C 125 66, 146 75, 146 95 Z"
          fill="#eab308"
          stroke="#36050b"
          strokeWidth="4"
        />
        {/* Sesame Seeds */}
        <ellipse cx="80" cy="78" rx="2" ry="3" fill="#ffffff" transform="rotate(-20 80 78)" />
        <ellipse cx="100" cy="74" rx="2" ry="3" fill="#ffffff" />
        <ellipse cx="120" cy="78" rx="2" ry="3" fill="#ffffff" transform="rotate(20 120 78)" />

        {/* Melted Cheddar Drop peeking */}
        <path
          d="M 60 97 L 140 97 L 132 106 L 120 100 L 105 108 L 88 100 L 75 106 Z"
          fill="#facc15"
          stroke="#ca8a04"
          strokeWidth="2"
        />

        {/* Thick Beef Patty (Picanha / Angus) with Grill marks */}
        <rect
          x="50"
          y="102"
          width="100"
          height="16"
          rx="8"
          fill="#580c1f"
          stroke="#36050b"
          strokeWidth="3"
        />
        {/* Diagonal Grill Char Marks on meat */}
        <line x1="70" y1="104" x2="82" y2="116" stroke="#1f0307" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="94" y1="104" x2="106" y2="116" stroke="#1f0307" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="118" y1="104" x2="130" y2="116" stroke="#1f0307" strokeWidth="2.5" strokeLinecap="round" />

        {/* Bottom Bun */}
        <path
          d="M 54 122 L 146 122 C 146 136, 128 140, 100 140 C 72 140, 54 136, 54 122 Z"
          fill="#ca8a04"
          stroke="#36050b"
          strokeWidth="4"
        />
      </g>

      {/* Crossed Grill Utensils (Parrilla Fork & Spatula) behind or beneath */}
      <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
        <line x1="45" y1="155" x2="70" y2="130" />
        <line x1="155" y1="155" x2="130" y2="130" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{LogoIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Icon with glowing mustard amber border */}
      <div className="relative flex items-center justify-center">
        {LogoIcon}
      </div>

      {/* Brand Typography with white and mustard */}
      <div className="flex flex-col">
        <span
          className={`text-[9px] sm:text-[10px] tracking-[0.25em] uppercase font-black ${
            lightBg ? 'text-[#6b0f1a]' : 'text-white'
          } leading-none mb-0.5 opacity-90`}
        >
          LANCHONETE
        </span>
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`tracking-tight uppercase font-black font-['Plus_Jakarta_Sans',sans-serif] ${
              lightBg ? 'text-[#580c1f]' : 'text-white'
            } ${dimensions.textClass} drop-shadow-md`}
          >
            VAI DE <span className="text-[#eab308]">GRILL</span>
          </span>
        </div>
        <span
          className={`tracking-[0.22em] uppercase font-extrabold ${
            lightBg ? 'text-[#7f1d1d]' : 'text-zinc-200'
          } ${dimensions.subtitleClass} leading-tight mt-1`}
        >
          SANDUÍCHES ARTESANAIS
        </span>
        <span className="text-[9px] text-zinc-300 font-medium tracking-wide">
          João Eduardo • Rio Branco - AC
        </span>
      </div>
    </div>
  );
};
