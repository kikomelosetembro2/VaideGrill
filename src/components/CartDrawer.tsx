import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Tag, 
  MapPin, 
  Bike, 
  Store, 
  ArrowRight,
  Check,
  AlertCircle,
  Coins
} from 'lucide-react';
import { CartItem, DeliveryMethod } from '../types';
import { 
  RESTAURANT_INFO, 
  RIO_BRANCO_NEIGHBORHOODS, 
  AVAILABLE_COUPONS 
} from '../data/menuData';
import { formatCurrency, playSound } from '../utils/helpers';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  deliveryMethod: DeliveryMethod;
  onChangeDeliveryMethod: (method: DeliveryMethod) => void;
  selectedNeighborhood: string;
  onSelectNeighborhood: (neighborhood: string) => void;
  appliedCoupon: string;
  onApplyCoupon: (code: string) => boolean;
  onRemoveCoupon: () => void;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  onProceedToCheckout: () => void;
  onOpenExtrasShop?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  deliveryMethod,
  onChangeDeliveryMethod,
  selectedNeighborhood,
  onSelectNeighborhood,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  subtotal,
  deliveryFee,
  discountAmount,
  total,
  onProceedToCheckout,
  onOpenExtrasShop,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const success = onApplyCoupon(code);
    if (!success) {
      setCouponError('Cupom inválido ou valor mínimo não atingido.');
      playSound('alert');
    } else {
      playSound('success');
      setCouponInput('');
    }
  };

  const pointsToEarn = Math.floor(total);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/85 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#16070a] border-l border-[#eab308]/30 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#eab308] text-black flex items-center justify-center font-black">
              <ShoppingBag className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Carrinho Vai de Grill</h2>
              <p className="text-xs text-zinc-400">
                {items.length === 0 ? 'Vazio' : `${items.reduce((acc, i) => acc + i.quantity, 0)} itens selecionados`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar carrinho"
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-[#6b0f1a] text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#240e15] flex items-center justify-center text-[#eab308]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Seu carrinho está vazio</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Explore nosso cardápio na brasa ou monte um sanduíche personalizado!
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#eab308] hover:bg-[#ca8a04] text-black font-black text-xs rounded-xl shadow-md transition-transform active:scale-95"
            >
              Ver Cardápio da Brasa
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Delivery Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Como deseja receber seu pedido?
              </span>
              <div className="grid grid-cols-2 gap-2 bg-[#260f15] p-1 rounded-2xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    playSound('ding');
                    onChangeDeliveryMethod('entrega');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                    deliveryMethod === 'entrega'
                      ? 'bg-[#eab308] text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Delivery em Rio Branco</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playSound('ding');
                    onChangeDeliveryMethod('retirada');
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                    deliveryMethod === 'retirada'
                      ? 'bg-[#eab308] text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Retirar na Loja</span>
                </button>
              </div>

              {/* Delivery info & Neighborhood Selector */}
              {deliveryMethod === 'entrega' ? (
                <div className="p-3 bg-[#240e15] rounded-2xl border border-[#eab308]/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#eab308]" />
                      <span>Bairro em Rio Branco:</span>
                    </span>
                    <span className="text-[#eab308] font-black">
                      {formatCurrency(deliveryFee)}
                    </span>
                  </div>

                  <select
                    value={selectedNeighborhood}
                    onChange={(e) => {
                      playSound('ding');
                      onSelectNeighborhood(e.target.value);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#eab308] font-bold"
                  >
                    {RIO_BRANCO_NEIGHBORHOODS.map((nh) => (
                      <option key={nh.name} value={nh.name}>
                        {nh.name} — {formatCurrency(nh.fee)} ({nh.time})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-[#240e15] rounded-2xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#eab308] font-bold">
                    <Store className="w-3.5 h-3.5" />
                    <span>Retirada no Balcão Grátis:</span>
                  </div>
                  <p className="text-zinc-300 font-semibold">
                    {RESTAURANT_INFO.address} - Rio Branco, AC
                  </p>
                  <p className="text-[11px] text-emerald-400 font-bold">
                    Pronto para retirada em ~20 minutos
                  </p>
                </div>
              )}
            </div>

            {/* Quick Addons Banner */}
            {onOpenExtrasShop && (
              <div className="p-3 bg-[#33111b] border border-[#eab308]/40 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">🥓</span>
                  <div className="leading-tight">
                    <span className="font-extrabold text-xs text-white block">Quer turbinar seu pedido?</span>
                    <span className="text-[10px] text-zinc-300">Potes de molho, queijos melt e carnes extras</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenExtrasShop}
                  className="px-2.5 py-1.5 bg-[#eab308] hover:bg-[#ca8a04] text-black font-black text-xs rounded-xl shrink-0 transition-transform active:scale-95 cursor-pointer"
                >
                  + Adicionais
                </button>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Itens do Pedido ({items.length})
              </span>

              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="p-3.5 bg-[#240e15] rounded-2xl border border-zinc-800 space-y-2 relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm">
                        {item.menuItem.name}
                      </h4>
                      <div className="text-xs font-black text-[#eab308] mt-0.5">
                        {formatCurrency(item.unitPrice)} cada
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playSound('alert');
                        onRemoveItem(item.cartItemId);
                      }}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      title="Excluir item"
                      aria-label="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customization Details Breakdown */}
                  <div className="text-[11px] space-y-1 bg-[#16070a] p-2.5 rounded-xl border border-zinc-850">
                    {item.customization.meatDoneness && (
                      <div className="text-zinc-300">
                        <span className="font-bold text-[#eab308]">Ponto na Grelha:</span>{' '}
                        {item.customization.meatDoneness.replace('_', ' ')}
                      </div>
                    )}

                    {item.customization.removedIngredients.length > 0 && (
                      <div className="text-red-400 line-through">
                        <span className="font-semibold">Sem:</span>{' '}
                        {item.customization.removedIngredients.join(', ')}
                      </div>
                    )}

                    {Object.entries(item.customization.addedExtras).length > 0 && (
                      <div className="text-emerald-400">
                        <span className="font-semibold">Extras:</span>{' '}
                        {Object.entries(item.customization.addedExtras)
                          .map(([extraId, qty]) => {
                            const opt = item.menuItem.availableExtras.find((e) => e.id === extraId);
                            return opt ? `${qty}x ${opt.name}` : null;
                          })
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}

                    {item.customization.specialNotes && (
                      <div className="text-zinc-400 italic">
                        &quot;{item.customization.specialNotes}&quot;
                      </div>
                    )}
                  </div>

                  {/* Quantity and Subtotal for this Item */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-white text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-sm font-black text-white">
                      {formatCurrency(item.totalPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loyalty Earn Points Preview Tag */}
            <div className="p-3 bg-gradient-to-r from-[#580c1f] to-[#36050b] rounded-2xl border border-[#eab308]/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#eab308]" />
                <span className="text-zinc-200">Pontos a acumular:</span>
              </div>
              <span className="text-[#facc15] font-black">
                +{pointsToEarn} Pontos VIP
              </span>
            </div>

            {/* Coupon Code Section */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#eab308]" />
                <span>Cupom de Desconto</span>
              </span>

              {appliedCoupon ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Cupom {appliedCoupon} aplicado!</span>
                  </div>
                  <button
                    onClick={onRemoveCoupon}
                    className="text-xs text-red-400 hover:underline font-semibold"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Ex: VAIDEGRILL10 ou GRILLVIP"
                      className="flex-1 bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-[#eab308] font-bold"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#6b0f1a] hover:bg-[#7f1d1d] text-white text-xs font-black rounded-xl transition-colors border border-[#eab308]/30"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{couponError}</span>
                    </p>
                  )}
                  <div className="flex gap-1.5 pt-0.5">
                    <span
                      onClick={() => setCouponInput('VAIDEGRILL10')}
                      className="text-[10px] bg-[#240e15] text-[#eab308] border border-[#eab308]/30 px-2 py-0.5 rounded cursor-pointer hover:bg-[#eab308]/10 font-bold"
                    >
                      VAIDEGRILL10
                    </span>
                    <span
                      onClick={() => setCouponInput('GRILLVIP')}
                      className="text-[10px] bg-[#240e15] text-[#eab308] border border-[#eab308]/30 px-2 py-0.5 rounded cursor-pointer hover:bg-[#eab308]/10 font-bold"
                    >
                      GRILLVIP
                    </span>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Footer with totals & proceed button */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#260f15] border-t border-zinc-800 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span>Subtotal dos itens:</span>
                <span className="font-bold text-white">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>
                  {deliveryMethod === 'entrega' ? `Taxa de entrega (${selectedNeighborhood}):` : 'Taxa de retirada:'}
                </span>
                <span className="font-bold text-white">
                  {deliveryFee === 0 ? 'Grátis' : formatCurrency(deliveryFee)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Desconto ({appliedCoupon}):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-black text-white">
                <span>Total a Pagar:</span>
                <span className="text-xl text-[#eab308]">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                playSound('ding');
                onProceedToCheckout();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black py-3.5 rounded-xl font-black text-sm shadow-xl shadow-[#eab308]/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Avançar para Pagamento</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
