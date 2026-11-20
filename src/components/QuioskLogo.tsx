import React from 'react';

interface QuioskLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const QuioskLogo: React.FC<QuioskLogoProps> = ({
  size = 'md',
  showTagline = false,
}) => {
  const iconDims =
    size === 'sm' ? 'w-11 h-10' : size === 'lg' ? 'w-20 h-16' : 'w-14 h-12';
  const titleSize =
    size === 'sm' ? 'text-base sm:text-lg' : size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl';

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Vector reproduction of the Quiosk da Preta tent/tipi logo from the menu */}
      <svg
        viewBox="0 0 120 92"
        className={`${iconDims} shrink-0`}
        aria-hidden="true"
      >
        {/* Crossed tent poles extending at top */}
        <line
          x1="46"
          y1="6"
          x2="96"
          y2="78"
          stroke="#262626"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="74"
          y1="6"
          x2="24"
          y2="78"
          stroke="#262626"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Apex intersection (60, 26) */}
        {/* Upper-left triangle (Yellow / Mustard) */}
        <polygon points="60,26 42,52 60,52" fill="#FACC15" stroke="#111111" strokeWidth="1.8" />
        {/* Upper-right triangle (Blood Red) */}
        <polygon points="60,26 60,52 78,52" fill="#DC2626" stroke="#111111" strokeWidth="1.8" />
        {/* Lower-left triangle (Royal Blue) */}
        <polygon points="42,52 24,78 60,78 60,52" fill="#1D4ED8" stroke="#111111" strokeWidth="1.8" />
        {/* Lower-right triangle (Green) */}
        <polygon points="60,52 60,78 96,78 78,52" fill="#16A34A" stroke="#111111" strokeWidth="1.8" />

        {/* Ground base lines */}
        <line
          x1="8"
          y1="80"
          x2="112"
          y2="80"
          stroke="#111111"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex flex-col leading-none text-left">
        <span
          className={`${titleSize} font-black tracking-tight text-[#111111]`}
        >
          Quiosk <span className="text-[#8A0000]">da Preta</span>
        </span>
        {showTagline && (
          <span className="text-[11px] font-semibold text-neutral-600 mt-1 tracking-wide">
            Espetinhos · Chapa · Pratos Árabes · Rabada no Tucupí
          </span>
        )}
      </div>
    </div>
  );
};
