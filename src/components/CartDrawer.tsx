import React from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Bike,
  Store,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react';
import { CartItem, OrderCategory } from '../types';
import {
  COMMON_EXTRAS,
  RIO_BRANCO_NEIGHBORHOODS,
  CATEGORY_IMAGES,
  resolveProductImage,
} from '../data/menuData';
import { formatCurrency } from '../utils/helpers';

interface CartDrawerProps {
  isOpen: boolean;
  isCartAnimating?: boolean;
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
  loyaltyDiscountLabel?: string;
  onRemoveLoyaltyDiscount?: () => void;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  isCartAnimating = false,
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
  loyaltyDiscountLabel,
  onRemoveLoyaltyDiscount,
  subtotal,
  deliveryFee,
  discountAmount,
  total,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md h-full flex flex-col border-l border-neutral-200 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex items-center justify-center ${
                isCartAnimating ? 'animate-cart-bounce' : ''
              }`}
            >
              <ShoppingBag className="w-5 h-5 text-[#8A0000]" />
            </span>
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
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={resolveProductImage(
                              item.menuItem.image,
                              item.menuItem.category
                            )}
                            alt={item.menuItem.name}
                            onError={(e) => {
                              if (e.currentTarget.dataset.fallbackApplied) return;
                              e.currentTarget.dataset.fallbackApplied = '1';
                              e.currentTarget.src =
                                CATEGORY_IMAGES[item.menuItem.category] ||
                                CATEGORY_IMAGES.espetinhos;
                            }}
                            className="w-11 h-11 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[#111111] truncate">
                              {item.menuItem.name}
                            </h4>
                            <p className="text-xs font-extrabold text-[#8A0000] tabular-nums">
                              {formatCurrency(item.totalPrice)}
                            </p>
                          </div>
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
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span className="flex items-center gap-2">
                    <span>{loyaltyDiscountLabel || 'Desconto Fidelidade'}</span>
                    {onRemoveLoyaltyDiscount && (
                      <button
                        type="button"
                        onClick={onRemoveLoyaltyDiscount}
                        className="text-[#8A0000] underline text-[11px] font-bold cursor-pointer"
                      >
                        Remover
                      </button>
                    )}
                  </span>
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
