import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Bike,
  Store,
  UtensilsCrossed,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { CartItem, OrderCategory } from '../types';
import {
  COMMON_EXTRAS,
  RIO_BRANCO_NEIGHBORHOODS,
  AVAILABLE_COUPONS,
} from '../data/menuData';
import { formatCurrency } from '../utils/helpers';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  orderCategory: OrderCategory;
  onChangeOrderCategory: (cat: OrderCategory) => void;
  tableNumber: string;
  onChangeTableNumber: (val: string) => void;
  selectedNeighborhood: string;
  onSelectNeighborhood: (name: string) => void;
  appliedCoupon: string;
  onApplyCoupon: (code: string) => boolean;
  onRemoveCoupon: () => void;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  orderCategory,
  onChangeOrderCategory,
  tableNumber,
  onChangeTableNumber,
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
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const ok = onApplyCoupon(code);
    if (ok) {
      setCouponFeedback(`Cupom ${code} aplicado.`);
      setCouponInput('');
    } else {
      const exists = AVAILABLE_COUPONS[code];
      if (exists) {
        setCouponFeedback(
          `Pedido mínimo de ${formatCurrency(exists.minOrder)} para o cupom ${code}.`
        );
      } else {
        setCouponFeedback('Cupom inválido. Tente PRETA10 ou QUIOSK5.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md h-full flex flex-col border-l border-neutral-200 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#8A0000]" />
            <h2 className="font-black text-base text-[#111111]">
              Seu Carrinho ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-[#111111] hover:bg-neutral-100"
            aria-label="Fechar carrinho"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {items.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="font-bold text-[#111111]">Seu carrinho está vazio</p>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Adicione espetinhos, tira-gosto, pratos árabes, rabada no tucupí ou
                bebidas do cardápio Quiosk da Preta.
              </p>
            </div>
          ) : (
            <>
              {/* Category Selector: Delivery / Retirada / Mesa Presencial */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                  Categoria do Pedido
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'delivery' as OrderCategory, label: 'Delivery', icon: Bike },
                    { id: 'retirada' as OrderCategory, label: 'Retirada', icon: Store },
                    { id: 'mesa' as OrderCategory, label: 'Mesa Presencial', icon: UtensilsCrossed },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const active = orderCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onChangeOrderCategory(cat.id)}
                        className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {orderCategory === 'delivery' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Região de Entrega (Rio Branco - AC)
                    </label>
                    <select
                      value={selectedNeighborhood}
                      onChange={(e) => onSelectNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-[#111111] bg-white focus:outline-none focus:border-[#8A0000]"
                    >
                      {RIO_BRANCO_NEIGHBORHOODS.map((n) => (
                        <option key={n.name} value={n.name}>
                          {n.name} — Taxa {formatCurrency(n.fee)} ({n.time})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {orderCategory === 'mesa' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Número da Mesa
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => onChangeTableNumber(e.target.value)}
                      placeholder="Ex: Mesa 04"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-[#111111] bg-white focus:outline-none focus:border-[#8A0000]"
                    />
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                  Itens Selecionados
                </label>
                {items.map((item) => {
                  const extrasList = Object.entries(
                    item.customization.addedExtras || {}
                  ).filter(([, qty]) => qty > 0);
                  const donenessLabels: Record<string, string> = {
                    mal_passado: 'Mal Passado',
                    ao_ponto: 'Ao Ponto',
                    bem_passado: 'Bem Passado',
                  };

                  return (
                    <div
                      key={item.cartItemId}
                      className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-[#111111]">
                            {item.menuItem.name}
                          </h4>
                          <p className="text-xs font-extrabold text-[#8A0000] tabular-nums">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="text-neutral-400 hover:text-[#8A0000] p-1"
                          aria-label={`Remover ${item.menuItem.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Customization Details */}
                      <div className="text-[11px] text-neutral-600 space-y-0.5">
                        {item.customization.meatDoneness && (
                          <p>
                            <strong className="text-[#111111]">Ponto:</strong>{' '}
                            {donenessLabels[item.customization.meatDoneness]}
                          </p>
                        )}
                        {item.customization.removedIngredients.length > 0 && (
                          <p className="text-[#8A0000]">
                            <strong>Remover:</strong>{' '}
                            {item.customization.removedIngredients.join(', ')}
                          </p>
                        )}
                        {extrasList.length > 0 && (
                          <div>
                            <strong className="text-[#111111]">Adicionais:</strong>
                            <ul className="pl-2 mt-0.5 space-y-0.5">
                              {extrasList.map(([extId, qty]) => {
                                const ext =
                                  item.menuItem.availableExtras?.find(
                                    (e) => e.id === extId
                                  ) || COMMON_EXTRAS.find((e) => e.id === extId);
                                if (!ext) return null;
                                return (
                                  <li key={extId} className="tabular-nums">
                                    + {qty}x {ext.name} ({formatCurrency(ext.price * qty)})
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                        {item.customization.specialNotes && (
                          <p className="italic">
                            Obs: "{item.customization.specialNotes}"
                          </p>
                        )}
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.cartItemId, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded-md border border-neutral-300 bg-white flex items-center justify-center text-[#111111] hover:bg-neutral-100 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-black text-xs text-[#111111] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.cartItemId, item.quantity + 1)
                          }
                          className="w-7 h-7 rounded-md bg-[#111111] text-[#D4A017] flex items-center justify-center hover:bg-neutral-800 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>Cupom de Desconto (PRETA10 / QUIOSK5)</span>
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-[#D4A017] rounded-lg text-xs">
                    <span className="font-bold text-[#111111]">
                      Cupom ativo: {appliedCoupon} (-{formatCurrency(discountAmount)})
                    </span>
                    <button
                      type="button"
                      onClick={onRemoveCoupon}
                      className="text-[#8A0000] font-bold hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCouponSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Digite o código"
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-xs uppercase text-[#111111] focus:outline-none focus:border-[#8A0000]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-[#D4A017] font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </form>
                )}
                {couponFeedback && (
                  <p className="text-[11px] text-neutral-600">{couponFeedback}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Totals */}
        {items.length > 0 && (
          <div className="p-5 border-t border-neutral-200 bg-neutral-50 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {orderCategory === 'delivery' && (
                <div className="flex justify-between text-neutral-600">
                  <span>Taxa de Entrega ({selectedNeighborhood.split('/')[0].trim()})</span>
                  <span className="tabular-nums font-semibold">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Desconto ({appliedCoupon})</span>
                  <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-[#111111] pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span className="tabular-nums text-[#8A0000]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full bg-[#8A0000] hover:bg-[#6E0000] text-white font-extrabold py-3.5 px-5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Finalizar Pedido & Enviar Comanda</span>
              <ArrowRight className="w-4 h-4 text-[#D4A017]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
