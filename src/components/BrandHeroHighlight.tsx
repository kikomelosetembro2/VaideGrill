import React from 'react';
import { Flame, MapPin, Clock, Phone, Sparkles, ChefHat } from 'lucide-react';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';
import { RESTAURANT_INFO } from '../data/menuData';

interface BrandHeroHighlightProps {
  onOpenBuildBurger?: () => void;
  onOpenExtrasShop?: () => void;
}

export const BrandHeroHighlight: React.FC<BrandHeroHighlightProps> = ({
  onOpenBuildBurger,
  onOpenExtrasShop,
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#420a13] via-[#24060b] to-[#12080a] border-2 border-[#eab308]/60 shadow-[0_10px_40px_rgba(107,15,26,0.5)] p-5 sm:p-8 my-2">
      {/* Background ambient flame glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-[#eab308]/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 left-1/4 w-72 h-36 bg-[#6b0f1a]/40 blur-3xl pointer-events-none rounded-full" />

      {/* Centralized container with logo on the left and prominent name */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
        {/* Top artisan category badge */}
        <div className="inline-flex items-center gap-2 bg-[#1a0508]/80 border border-[#eab308]/50 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-[#eab308] shadow-md mb-4 backdrop-blur-sm">
          <Flame className="w-4 h-4 text-[#eab308] animate-pulse" />
          <span className="text-white">CARDÁPIO OFICIAL DA BRASA</span>
          <span className="text-[#eab308]">•</span>
          <span className="text-[#facc15]">RIO BRANCO - ACRE</span>
          <Flame className="w-4 h-4 text-[#eab308] animate-pulse" />
        </div>

        {/* Highlighted Brand Title Block: Logo on the left, Name in the center/prominence */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full my-1">
          {/* Logo on the left */}
          <div className="shrink-0 transition-transform hover:scale-105 duration-300 drop-shadow-[0_4px_16px_rgba(234,179,8,0.35)]">
            <VaiDeGrillLogo variant="icon" size="xl" />
          </div>

          {/* Centralized High-Impact Typography using pure white with mustard & blood wine */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-sm sm:text-base font-extrabold uppercase tracking-[0.22em] text-[#eab308] flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-[#eab308]" />
              LANCHONETE ARTESANAL
            </span>

            {/* Destaque: Nome Lanchonete Vai de Grill em cor branca com toques mostarda e vinho */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] mt-1">
              LANCHONETE <span className="text-[#eab308] underline decoration-[#6b0f1a] decoration-4 sm:decoration-6 underline-offset-4">VAI DE GRILL</span>
            </h1>

            <p className="text-sm sm:text-lg font-bold text-white uppercase tracking-wider mt-2.5 max-w-xl">
              SANDUÍCHES ARTESANAIS GRELHADOS NO FOGO • CARNES NOBRES & PÃES ESPECIAIS
            </p>
          </div>
        </div>

        {/* Information Badges in White & Mustard (Address, Hours, WhatsApp) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mt-5 text-xs sm:text-sm font-semibold text-white">
          <div className="flex items-center gap-1.5 bg-[#2d0a12]/95 border border-[#eab308]/40 px-3.5 py-1.5 rounded-full shadow-sm text-white hover:border-[#eab308] transition-colors">
            <MapPin className="w-4 h-4 text-[#eab308] shrink-0" />
            <span>{RESTAURANT_INFO.address} - Rio Branco, AC</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#2d0a12]/95 border border-[#eab308]/40 px-3.5 py-1.5 rounded-full shadow-sm text-white">
            <Clock className="w-4 h-4 text-[#eab308] shrink-0" />
            <span>Terça a Domingo: 18h às 23h <span className="text-[#eab308] font-bold">(Segunda Fechado)</span></span>
          </div>

          <a
            href={`https://wa.me/${RESTAURANT_INFO.whatsappRaw}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#6b0f1a] to-[#881337] hover:from-[#881337] hover:to-[#6b0f1a] border border-[#eab308]/60 px-3.5 py-1.5 rounded-full text-white font-black shadow-sm transition-all hover:scale-105"
          >
            <Phone className="w-4 h-4 text-[#eab308] shrink-0" />
            <span>Delivery: {RESTAURANT_INFO.phone}</span>
          </a>

          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-full text-emerald-300 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>Aberto para Pedidos</span>
          </div>
        </div>

        {/* Quick actions bar */}
        {(onOpenBuildBurger || onOpenExtrasShop) && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6 pt-5 border-t border-[#eab308]/20 w-full">
            {onOpenBuildBurger && (
              <button
                onClick={onOpenBuildBurger}
                className="flex items-center gap-2 bg-[#eab308] hover:bg-[#facc15] text-black font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-lg shadow-[#eab308]/20 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Monte seu Sanduíche do Zero</span>
              </button>
            )}
            {onOpenExtrasShop && (
              <button
                onClick={onOpenExtrasShop}
                className="flex items-center gap-2 bg-[#6b0f1a] hover:bg-[#881337] border border-[#eab308]/60 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-lg transition-all hover:scale-105"
              >
                <span className="text-[#eab308] font-black text-base">+</span>
                <span>Turbinar com Adicionais da Brasa</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
