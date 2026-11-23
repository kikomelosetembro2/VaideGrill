import React, { useState } from 'react';
import { X, Plus, Minus, Flame, Check, MessageSquare } from 'lucide-react';
import { MenuItem, CartItem, CustomizationSelection } from '../types';
import { COMMON_EXTRAS, CATEGORY_IMAGES, resolveProductImage } from '../data/menuData';
import { formatCurrency } from '../utils/helpers';

interface ProductCustomizeModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const ProductCustomizeModal: React.FC<ProductCustomizeModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const extrasCatalog =
    item.availableExtras && item.availableExtras.length > 0
      ? item.availableExtras
      : COMMON_EXTRAS;

  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedExtras, setAddedExtras] = useState<{ [id: string]: number }>({});
  const [meatDoneness, setMeatDoneness] = useState<
    'mal_passado' | 'ao_ponto' | 'bem_passado'
  >('ao_ponto');
  const [specialNotes, setSpecialNotes] = useState('');

  const toggleRemoveIngredient = (ing: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const updateExtraQty = (extraId: string, delta: number) => {
    setAddedExtras((prev) => {
      const current = prev[extraId] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[extraId];
        return copy;
      }
      return { ...prev, [extraId]: next };
    });
  };

  const extrasUnitTotal = Object.entries(addedExtras).reduce(
    (sum, [extraId, qty]) => {
      const found = extrasCatalog.find((e) => e.id === extraId);
      return sum + (found ? found.price * qty : 0);
    },
    0
  );

  const unitPrice = item.price + extrasUnitTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const customization: CustomizationSelection = {
      removedIngredients,
      addedExtras,
      ...(item.supportsDoneness ? { meatDoneness } : {}),
      ...(specialNotes.trim() ? { specialNotes: specialNotes.trim() } : {}),
    };

    const cartItem: CartItem = {
      cartItemId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      menuItem: {
        ...item,
        availableExtras: extrasCatalog,
      },
      quantity,
      customization,
      unitPrice,
      totalPrice,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header with image thumbnail */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-neutral-200">
          <div className="flex items-center gap-3.5">
            <img
              src={resolveProductImage(item.image, item.category)}
              alt={item.name}
              onError={(e) => {
                if (e.currentTarget.dataset.fallbackApplied) return;
                e.currentTarget.dataset.fallbackApplied = '1';
                e.currentTarget.src = CATEGORY_IMAGES[item.category];
              }}
              className="w-16 h-16 rounded-xl object-cover border border-neutral-200 shrink-0"
            />
            <div>
              <h3 className="font-black text-lg text-[#111111] leading-tight">
                {item.name}
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">{item.description}</p>
              <p className="text-sm font-black text-[#8A0000] mt-1 tabular-nums">
                Base: {formatCurrency(item.price)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-[#111111] hover:bg-neutral-100"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Doneness selector when supported */}
          {item.supportsDoneness && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#8A0000]" />
                <span>Ponto da Carne</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mal_passado', label: 'Mal Passado' },
                  { id: 'ao_ponto', label: 'Ao Ponto' },
                  { id: 'bem_passado', label: 'Bem Passado' },
                ].map((opt) => {
                  const selected = meatDoneness === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setMeatDoneness(
                          opt.id as 'mal_passado' | 'ao_ponto' | 'bem_passado'
                        )
                      }
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Removable Accompaniments */}
          {item.removableIngredients && item.removableIngredients.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                Acompanhamentos (desmarque o que deseja retirar)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {item.removableIngredients.map((ing) => {
                  const isRemoved = removedIngredients.includes(ing);
                  return (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => toggleRemoveIngredient(ing)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        isRemoved
                          ? 'bg-red-50 border-[#8A0000] text-[#8A0000] line-through'
                          : 'bg-white border-neutral-200 text-[#111111] hover:border-neutral-400'
                      }`}
                    >
                      <span>{ing}</span>
                      {!isRemoved ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-[#8A0000]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adicionais / Extras */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                Adicionais & Porções Extras
              </label>
              {extrasUnitTotal > 0 && (
                <span className="text-xs font-bold text-[#8A0000] tabular-nums">
                  +{formatCurrency(extrasUnitTotal)} / un.
                </span>
              )}
            </div>

            <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
              {extrasCatalog.map((extra) => {
                const qty = addedExtras[extra.id] || 0;
                return (
                  <div
                    key={extra.id}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-xs ${
                      qty > 0 ? 'bg-amber-50/70' : 'bg-white'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-[#111111]">{extra.name}</p>
                      <p className="text-neutral-600 tabular-nums">
                        +{formatCurrency(extra.price)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateExtraQty(extra.id, -1)}
                        disabled={qty === 0}
                        className="w-7 h-7 rounded-md border border-neutral-300 flex items-center justify-center text-[#111111] disabled:opacity-30 hover:bg-neutral-100 cursor-pointer"
                        aria-label={`Remover ${extra.name}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center font-black text-[#111111] tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateExtraQty(extra.id, 1)}
                        className="w-7 h-7 rounded-md bg-[#111111] text-[#D4A017] flex items-center justify-center hover:bg-neutral-800 cursor-pointer"
                        aria-label={`Adicionar ${extra.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kitchen Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Observações para a Cozinha</span>
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Sem cebola, macaxeira bem cozida, mandar talheres..."
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:border-[#8A0000]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 border border-neutral-300 rounded-lg bg-white px-2 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1.5 text-[#111111] hover:text-[#8A0000] cursor-pointer"
              aria-label="Diminuir quantidade"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-7 text-center font-black text-sm text-[#111111] tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1.5 text-[#111111] hover:text-[#8A0000] cursor-pointer"
              aria-label="Aumentar quantidade"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-[#8A0000] hover:bg-[#6E0000] text-white font-extrabold py-3 px-5 rounded-lg text-sm flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Adicionar ao Carrinho</span>
            <span className="tabular-nums text-[#D4A017]">
              {formatCurrency(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
