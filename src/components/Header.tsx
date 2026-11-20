import React from 'react';
import {
  ShoppingBag,
  FileImage,
  ClipboardList,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { QuioskLogo } from './QuioskLogo';
import { Order } from '../types';
import { RESTAURANT_INFO, getOrderStatusLabel } from '../data/menuData';
import { formatCurrency } from '../utils/helpers';

interface HeaderProps {
  cartItemCount: number;
  cartTotal: number;
  activeOrder: Order | null;
  onOpenCart: () => void;
  onOpenOriginalMenu: () => void;
  onOpenTracking: () => void;
  onOpenAdminPanel: () => void;
  onScrollToMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartItemCount,
  cartTotal,
  activeOrder,
  onOpenCart,
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
            <span>{RESTAURANT_INFO.instagram}</span>
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
            onClick={onScrollToMenu}
            className="hover:text-[#8A0000] transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <UtensilsCrossed className="w-4 h-4 text-[#D4A017]" />
            <span>Cardápio</span>
          </button>

          <button
            type="button"
            onClick={onOpenOriginalMenu}
            className="hover:text-[#8A0000] transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <FileImage className="w-4 h-4 text-neutral-500" />
            <span>Cardápio Original</span>
          </button>

          <button
            type="button"
            onClick={onOpenTracking}
            className="hover:text-[#8A0000] transition-colors flex items-center gap-1.5 whitespace-nowrap"
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
            className="hover:text-[#8A0000] transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 text-neutral-500" />
            <span>Painel Admin</span>
          </button>
        </nav>

        {/* Zone 3: Mobile quick triggers + Primary Cart CTA */}
        <div className="flex items-center gap-2 shrink-0">
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
            className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2.5 text-sm transition-colors shadow-sm cursor-pointer"
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
