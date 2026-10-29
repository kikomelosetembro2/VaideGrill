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
    <header className="sticky top-0 z-40 bg-[#180407]/95 backdrop-blur-md border-b border-[#eab308]/40 shadow-2xl">
      {/* Top emergency contact and address bar with red and mustard styling */}
      <div className="bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#991b1b] text-white px-3 sm:px-6 py-1.5 text-xs font-bold flex flex-wrap justify-between items-center gap-2 border-b border-[#eab308]/30">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-white">
            <MapPin className="w-3.5 h-3.5 text-[#facc15]" />
            <span>{RESTAURANT_INFO.address} - Rio Branco, AC</span>
          </span>
          <span className="hidden sm:inline text-[#facc15]">•</span>
          <span className="flex items-center gap-1.5 text-amber-100">
            <Clock className="w-3.5 h-3.5 text-[#facc15]" />
            <span>Terça a Domingo: 18:00 às 23:00 (Segunda Fechado)</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/${RESTAURANT_INFO.whatsappRaw}?text=${encodeURIComponent('Olá Vai de Grill! Gostaria de fazer um pedido de sanduíche artesanal.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-white hover:text-[#facc15] font-black underline transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#facc15]" />
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
              className="flex items-center gap-1.5 bg-[#7f1d1d] border border-[#eab308] text-[#facc15] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black hover:bg-[#991b1b] transition-colors animate-pulse"
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
            className="flex items-center gap-1.5 bg-[#7f1d1d] hover:bg-[#991b1b] text-white border border-[#eab308]/60 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-black shadow-sm transition-all hover:scale-105"
            title="Ver Seus Pontos de Fidelidade e Resgatar Prêmios"
          >
            <Award className="w-4 h-4 text-[#eab308]" />
            <span className="hidden md:inline">Clube</span>
            <span className="text-[#facc15]">{loyaltyPoints} pts</span>
          </button>

          {/* Monte seu Sanduíche Button */}
          <button
            onClick={onOpenBuildBurger}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black px-3 py-2 rounded-xl text-xs font-black shadow-md shadow-[#eab308]/30 transition-all hover:scale-105"
          >
            <Layers className="w-4 h-4 text-black" />
            <span>Monte seu Sanduíche</span>
          </button>

          {/* Adicionais da Brasa Tool Button */}
          <button
            onClick={onOpenExtrasShop}
            className="flex items-center gap-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white border border-[#eab308] px-2.5 sm:px-3 py-2 rounded-xl text-xs font-black shadow-sm transition-all hover:scale-105"
            title="Ferramenta: Comprar Adicionais e Porções da Brasa"
          >
            <span className="text-[#eab308] font-black">+</span>
            <span className="hidden md:inline">Comprar</span>
            <span>Adicionais</span>
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdminPanel}
            className="flex items-center gap-1.5 bg-[#7f1d1d] hover:bg-[#991b1b] text-[#facc15] px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border border-[#eab308]/60 transition-colors"
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
                : 'bg-[#26070a] text-zinc-200 border-red-900/60 hover:border-[#eab308]/60 hover:text-white'
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
            className="hidden sm:flex items-center gap-1.5 bg-[#26070a] hover:bg-[#3d0c10] text-zinc-200 hover:text-white px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium border border-red-900/60 transition-colors"
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
            className="relative flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] border border-[#eab308] text-white px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all hover:scale-105 shadow-md shadow-[#dc2626]/40"
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
