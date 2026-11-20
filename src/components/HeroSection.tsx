import React from 'react';
import { ArrowDown, FileImage, Phone, Clock, Instagram } from 'lucide-react';
import { CATEGORY_IMAGES, RESTAURANT_INFO } from '../data/menuData';
import { QuioskLogo } from './QuioskLogo';

interface HeroSectionProps {
  onExploreMenu: () => void;
  onOpenOriginalMenu: () => void;
  onOpenTracking: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMenu,
  onOpenOriginalMenu,
  onOpenTracking,
}) => {
  return (
    <section className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
        {/* Left: Editorial Copy & Logo */}
        <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8A0000]">
            <span className="w-6 h-0.5 bg-[#D4A017]" />
            <span>Cardápio Oficial · Pedido com Comanda Automática</span>
          </div>

          <div className="space-y-3">
            <QuioskLogo size="lg" showTagline={false} />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#111111] leading-[1.1]">
              Espetinhos na brasa, chapa acebolada e rabada no tucupí.
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base max-w-xl leading-relaxed">
              Escolha para <strong className="text-[#111111]">Delivery</strong>,{' '}
              <strong className="text-[#111111]">Retirada no Balcão</strong> ou{' '}
              <strong className="text-[#111111]">Mesa Presencial</strong>. Sua comanda é
              numerada automaticamente e enviada com todos os adicionais direto para a
              cozinha via WhatsApp.
            </p>
          </div>

          {/* Inline Key Specs separated by subtle dividers (Zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-neutral-700 pt-1 border-t border-neutral-100">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#D4A017]" />
              {RESTAURANT_INFO.openingHours}
            </span>
            <span className="text-neutral-300">·</span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <Phone className="w-4 h-4 text-[#8A0000]" />
              {RESTAURANT_INFO.phone}
            </span>
            <span className="text-neutral-300">·</span>
            <span className="flex items-center gap-1.5">
              <Instagram className="w-4 h-4 text-neutral-500" />
              {RESTAURANT_INFO.instagram}
            </span>
          </div>

          {/* Primary Action & Secondary Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onExploreMenu}
              className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-6 py-3.5 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Fazer Pedido Agora</span>
              <ArrowDown className="w-4 h-4 text-[#D4A017]" />
            </button>

            <button
              type="button"
              onClick={onOpenOriginalMenu}
              className="bg-[#D4A017] hover:bg-[#B8860B] text-[#111111] font-bold px-5 py-3.5 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FileImage className="w-4 h-4" />
              <span>Ver Cardápio Original</span>
            </button>

            <button
              type="button"
              onClick={onOpenTracking}
              className="border border-neutral-300 hover:border-[#111111] text-[#111111] font-semibold px-4 py-3.5 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Acompanhar Comanda
            </button>
          </div>
        </div>

        {/* Right: Clean Photo Showcase */}
        <div className="lg:col-span-5 h-64 sm:h-80 lg:h-full min-h-[320px] relative bg-neutral-100 border-t lg:border-t-0 lg:border-l border-neutral-200">
          <img
            src={CATEGORY_IMAGES.espetinhos}
            alt="Espetinhos na brasa do Quiosk da Preta"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 text-white">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4A017]">
              Destaque da Brasa
            </p>
            <p className="text-base font-extrabold">
              Picanha na Chapa · R$ 35,00
            </p>
            <p className="text-xs text-neutral-200">
              Arroz, Baião, vinagrete, farofa e macaxeira
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
