import React from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Clock, 
  ChefHat, 
  Layers, 
  User, 
  BarChart3, 
  Award, 
  CheckCircle2,
  Coins
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';
import { Order } from '../types';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';
import { formatCurrency } from '../utils/helpers';

interface HeaderProps {
  cartItemCount: number;
  cartTotal: number;
  loyaltyPoints: number;
  onOpenCart: () => void;
  onOpenBuildBurger: () => void;
  onOpenExtrasShop: () => void;
  onOpenAuth: () => void;
  onOpenAdminPanel: () => void;
  onOpenFidelidade: () => void;
  onToggleKDS: () => void;
  activeOrder: Order | null;
  onOpenTracking: () => void;
  isKdsActive: boolean;
  currentUser: { name: string; phone: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  cartItemCount,
  cartTotal,
  loyaltyPoints,
  onOpenCart,
  onOpenBuildBurger,
  onOpenExtrasShop,
  onOpenAuth,
  onOpenAdminPanel,
  onOpenFidelidade,
  onToggleKDS,
  activeOrder,
  onOpenTracking,
  isKdsActive,
  currentUser,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#16070a]/95 backdrop-blur-md border-b border-[#eab308]/30 shadow-2xl">
      {/* Top emergency contact and address bar with mustard and wine styling */}
      <div className="bg-gradient-to-r from-[#6b0f1a] via-[#580c1f] to-[#36050b] text-[#facc15] px-3 sm:px-6 py-1.5 text-xs font-bold flex flex-wrap justify-between items-center gap-2 border-b border-[#eab308]/20">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-white">
            <MapPin className="w-3.5 h-3.5 text-[#eab308]" />
            <span>{RESTAURANT_INFO.address} - Rio Branco, AC</span>
          </span>
          <span className="hidden sm:inline text-[#eab308]">•</span>
          <span className="flex items-center gap-1.5 text-zinc-200">
            <Clock className="w-3.5 h-3.5 text-[#eab308]" />
            <span>Terça a Domingo: 18:00 às 23:00 (Segunda Fechado)</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/${RESTAURANT_INFO.whatsappRaw}?text=${encodeURIComponent('Olá Vai de Grill! Gostaria de fazer um pedido de sanduíche artesanal.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-white hover:text-[#eab308] font-black underline transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#eab308]" />
            <span>Delivery: {RESTAURANT_INFO.phone}</span>
          </a>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Logo with VaiDeGrillLogo */}
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Lanchonete Vai de Grill - Sanduíches Artesanais"
        >
          <VaiDeGrillLogo size="md" />
        </div>

        {/* Action Buttons & Navigation */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Active Order Pill button if order exists */}
          {activeOrder && (
            <button
              onClick={onOpenTracking}
              className="flex items-center gap-1.5 bg-[#290e15] border border-[#eab308]/60 text-[#eab308] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black hover:bg-[#3d121e] transition-colors animate-pulse"
              title="Acompanhar Pedido em Tempo Real"
            >
              <CheckCircle2 className="w-4 h-4 text-[#eab308]" />
              <span className="hidden md:inline">Pedido #{activeOrder.id.slice(-4)}:</span>
              <span className="uppercase">
                {activeOrder.status === 'em_preparo' ? 'Na Brasa' : 
                 activeOrder.status === 'saiu_para_entrega' ? 'A Caminho' : activeOrder.status}
              </span>
            </button>
          )}

          {/* Loyalty Club Button */}
          <button
            onClick={onOpenFidelidade}
            className="flex items-center gap-1.5 bg-[#240e15] hover:bg-[#381420] text-[#facc15] border border-[#eab308]/40 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-black shadow-sm transition-all hover:scale-105"
            title="Ver Seus Pontos de Fidelidade e Resgatar Prêmios"
          >
            <Award className="w-4 h-4 text-[#eab308]" />
            <span className="hidden md:inline">Clube</span>
            <span>{loyaltyPoints} pts</span>
          </button>

          {/* Monte seu Sanduíche Button */}
          <button
            onClick={onOpenBuildBurger}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black px-3 py-2 rounded-xl text-xs font-black shadow-md shadow-[#eab308]/20 transition-all hover:scale-105"
          >
            <Layers className="w-4 h-4 text-black" />
            <span>Monte seu Sanduíche</span>
          </button>

          {/* Adicionais da Brasa Tool Button */}
          <button
            onClick={onOpenExtrasShop}
            className="flex items-center gap-1.5 bg-[#6b0f1a] hover:bg-[#881337] text-white border border-[#eab308]/50 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-black shadow-sm transition-all hover:scale-105"
            title="Ferramenta: Comprar Adicionais e Porções da Brasa"
          >
            <span className="text-[#eab308] font-black">+</span>
            <span className="hidden md:inline">Comprar</span>
            <span>Adicionais</span>
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdminPanel}
            className="flex items-center gap-1.5 bg-[#2a0e16] hover:bg-[#401321] text-[#facc15] px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border border-[#eab308]/50 transition-colors"
            title="Painel Administrativo: Dashboard, Produtos Mais Vendidos e Cadastro"
          >
            <BarChart3 className="w-4 h-4 text-[#eab308]" />
            <span className="hidden lg:inline">Painel</span>
            <span>Admin</span>
          </button>

          {/* Kitchen KDS Toggle */}
          <button
            onClick={onToggleKDS}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-extrabold border transition-colors ${
              isKdsActive 
                ? 'bg-[#eab308] text-black border-[#eab308]' 
                : 'bg-zinc-900/80 text-zinc-300 border-zinc-750 hover:border-[#eab308]/50 hover:text-white'
            }`}
            title="Abrir Gerenciador de Pedidos da Cozinha (KDS)"
          >
            <ChefHat className="w-4 h-4" />
            <span className="hidden md:inline">Cozinha</span>
            <span>KDS</span>
          </button>

          {/* Auth Button */}
          <button
            onClick={onOpenAuth}
            className="hidden sm:flex items-center gap-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium border border-zinc-750 transition-colors"
            title={currentUser ? `Logado como ${currentUser.name}` : 'Entrar na Conta'}
          >
            <User className="w-4 h-4 text-[#eab308]" />
            <span className="max-w-[80px] truncate">
              {currentUser ? currentUser.name.split(' ')[0] : 'Entrar'}
            </span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#6b0f1a] hover:bg-[#7f1d1d] border border-[#eab308]/60 text-white px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all hover:scale-105 shadow-md shadow-[#6b0f1a]/40"
            aria-label="Ver Carrinho de Compras"
          >
            <ShoppingBag className="w-4 h-4 text-[#eab308]" />
            <span className="hidden sm:inline">
              {cartTotal > 0 ? formatCurrency(cartTotal) : 'Carrinho'}
            </span>
            {cartItemCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 bg-[#eab308] text-black text-[11px] font-black rounded-full flex items-center justify-center shadow">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
