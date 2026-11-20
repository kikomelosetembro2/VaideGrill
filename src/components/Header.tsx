import React from 'react';
import {
  ShoppingBag,
  FileImage,
  ClipboardList,
  ShieldCheck,
  UtensilsCrossed,
  Star,
  Award,
  Instagram,
} from 'lucide-react';
import { QuioskLogo } from './QuioskLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { Order } from '../types';
import { RESTAURANT_INFO, getOrderStatusLabel } from '../data/menuData';
import { formatCurrency } from '../utils/helpers';

interface HeaderProps {
  cartItemCount: number;
  cartTotal: number;
  loyaltyPoints: number;
  activeOrder: Order | null;
  activeMainTab: 'cardapio' | 'eventos';
  onChangeMainTab: (tab: 'cardapio' | 'eventos') => void;
  onOpenCart: () => void;
  onOpenLoyalty: () => void;
  onOpenOriginalMenu: () => void;
  onOpenTracking: () => void;
  onOpenAdminPanel: () => void;
  onScrollToMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartItemCount,
  cartTotal,
  loyaltyPoints,
  activeOrder,
  activeMainTab,
  onChangeMainTab,
  onOpenCart,
  onOpenLoyalty,
  onOpenOriginalMenu,
  onOpenTracking,
  onOpenAdminPanel,
  onScrollToMenu,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Subtle top strip with restaurant hours and contact */}
      <div className="bg-[#111111] text-white text-[11px] py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-neutral-200">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D4A017]" />
            <span>{RESTAURANT_INFO.openingHours}</span>
            <span className="text-neutral-500">·</span>
            <a
              href={RESTAURANT_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-neutral-100 hover:text-[#D4A017] transition-colors font-semibold"
              aria-label="Instagram Quiosk da Preta"
            >
              <Instagram className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>{RESTAURANT_INFO.instagram}</span>
            </a>
          </div>
          <a
            href={`https://wa.me/${RESTAURANT_INFO.whatsappRaw}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#D4A017] hover:underline tabular-nums"
          >
            WhatsApp: {RESTAURANT_INFO.phone}
          </a>
        </div>
      </div>

      {/* Main 3-Zone Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Identity with Cardápio Logo */}
        <a
          href="#cardapio"
          onClick={(e) => {
            e.preventDefault();
            onScrollToMenu();
          }}
          className="flex items-center shrink-0 focus:outline-none"
          aria-label="Quiosk da Preta — Início"
        >
          <QuioskLogo size="sm" />
        </a>

        {/* Zone 2: Clean Inline Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-neutral-700">
          <button
            type="button"
            onClick={() => {
              onChangeMainTab('cardapio');
              onScrollToMenu();
            }}
            className={`transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'cardapio'
                ? 'text-[#8A0000] font-extrabold'
                : 'hover:text-[#8A0000]'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-[#D4A017]" />
            <span>Cardápio</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMainTab('eventos')}
            className={`transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeMainTab === 'eventos'
                ? 'text-[#8A0000] font-extrabold'
                : 'hover:text-[#8A0000]'
            }`}
          >
            <Star className="w-4 h-4 text-[#D4A017]" />
            <span>Eventos</span>
          </button>

          <button
            type="button"
            onClick={onOpenOriginalMenu}
            className="hover:text-[#8A0000] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileImage className="w-4 h-4 text-neutral-500" />
            <span>Cardápio Original</span>
          </button>

          <button
            type="button"
            onClick={onOpenTracking}
            className="hover:text-[#8A0000] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ClipboardList className="w-4 h-4 text-neutral-500" />
            <span>
              {activeOrder
                ? `Pedido ${activeOrder.id} · ${getOrderStatusLabel(activeOrder.status)}`
                : 'Acompanhar Pedido'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenAdminPanel}
            className="hover:text-[#8A0000] transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-neutral-500" />
            <span>Painel Admin</span>
          </button>
        </nav>

        {/* Zone 3: Install App + Loyalty Points + Small Instagram Logo + Mobile Triggers + Cart CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="header" />

          <a
            href={RESTAURANT_INFO.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border border-neutral-200 hover:border-[#8A0000] text-[#111111] hover:text-[#8A0000] transition-colors flex items-center justify-center"
            title="Abrir Instagram @quioskdapreta.ofc"
            aria-label="Instagram Quiosk da Preta"
          >
            <Instagram className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={onOpenLoyalty}
            className="px-2.5 sm:px-3 py-2 rounded-lg border border-neutral-300 hover:border-[#111111] bg-neutral-50 text-[#111111] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Perfil do Cliente & Programa de Fidelidade"
          >
            <Award className="w-4 h-4 text-[#D4A017]" />
            <span className="tabular-nums">{loyaltyPoints} pts</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeMainTab(activeMainTab === 'eventos' ? 'cardapio' : 'eventos')
            }
            className={`md:hidden p-2 border rounded-lg ${
              activeMainTab === 'eventos'
                ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                : 'text-neutral-700 border-neutral-200'
            }`}
            title="Eventos & Avaliações"
          >
            <Star className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenTracking}
            className="md:hidden p-2 text-neutral-700 hover:text-[#8A0000] border border-neutral-200 rounded-lg"
            title="Acompanhar Pedido"
          >
            <ClipboardList className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenAdminPanel}
            className="md:hidden p-2 text-neutral-700 hover:text-[#8A0000] border border-neutral-200 rounded-lg"
            title="Painel Administrativo"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-3.5 sm:px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-colors shadow-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#D4A017]" />
            <span className="tabular-nums">
              {cartItemCount > 0 ? (
                <>
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'} ·{' '}
                  {formatCurrency(cartTotal)}
                </>
              ) : (
                'Carrinho'
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
