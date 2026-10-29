import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, Flame, Sparkles, ChefHat } from 'lucide-react';
import { MenuItem, CustomizationSelection, CartItem } from '../types';
import { formatCurrency, playSound } from '../utils/helpers';

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
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedExtras, setAddedExtras] = useState<{ [extraId: string]: number }>({});
  const [meatDoneness, setMeatDoneness] = useState<'mal_passado' | 'ao_ponto' | 'bem_passado'>('ao_ponto');
  const [specialNotes, setSpecialNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Toggle ingredient removal
  const toggleRemoveIngredient = (ingredient: string) => {
    playSound('ding');
    setRemovedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  // Add extra
  const incrementExtra = (extraId: string) => {
    playSound('ding');
    setAddedExtras((prev) => ({
      ...prev,
      [extraId]: (prev[extraId] || 0) + 1,
    }));
  };

  // Decrement extra
  const decrementExtra = (extraId: string) => {
    playSound('ding');
    setAddedExtras((prev) => {
      const current = prev[extraId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[extraId];
        return next;
      }
      return {
        ...prev,
        [extraId]: current - 1,
      };
    });
  };

  // Calculate live unit price
  const unitPrice = useMemo(() => {
    let price = item.price;
    Object.entries(addedExtras).forEach(([extraId, qty]) => {
      const extraOption = item.availableExtras.find((e) => e.id === extraId);
      if (extraOption && qty > 0) {
        price += extraOption.price * qty;
      }
    });
    return price;
  }, [item, addedExtras]);

  const totalPrice = unitPrice * quantity;

  // Handle finalize and add to cart
  const handleConfirmAddToCart = () => {
    playSound('success');
    const customization: CustomizationSelection = {
      removedIngredients,
      addedExtras,
      meatDoneness: item.category === 'sanduiches_artesanais' || item.category === 'combos_grill' || item.category === 'especiais_da_grelha' || item.category === 'classicos_da_chapa' ? meatDoneness : undefined,
      specialNotes: specialNotes.trim() || undefined,
    };

    const cartItem: CartItem = {
      cartItemId: `${item.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      menuItem: item,
      quantity,
      customization,
      unitPrice,
      totalPrice,
    };

    onAddToCart(cartItem);
    onClose();
  };

  const hasDonenessOption = item.category === 'sanduiches_artesanais' || item.category === 'combos_grill' || item.category === 'especiais_da_grelha' || item.category === 'classicos_da_chapa';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1c0c11] border border-[#eab308]/40 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header with Hero Image */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-zinc-950 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c0c11] via-[#1c0c11]/50 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Fechar personalização"
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-[#eab308] hover:text-black text-white flex items-center justify-center transition-colors border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Base Price on top of gradient */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            {item.badge && (
              <span className="inline-block bg-[#eab308] text-black text-xs font-black px-2.5 py-0.5 rounded-full mb-1">
                {item.badge}
              </span>
            )}
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {item.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>
        </div>

        {/* Scrollable Customization Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Section: Live Price indicator banner */}
          <div className="flex items-center justify-between p-3.5 bg-[#290f16] rounded-2xl border border-[#eab308]/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#eab308]" />
              <span className="text-zinc-200 font-bold">Preço Unitário Atualizado:</span>
            </div>
            <div className="text-xl font-black text-[#eab308] transition-all duration-300">
              {formatCurrency(unitPrice)}
            </div>
          </div>

          {/* Section 1: Removable Base Ingredients */}
          {item.removableIngredients.length > 0 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[#eab308]" />
                  <span>Ingredientes da Receita Vai de Grill</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Toque no ingrediente caso deseje <strong className="text-[#facc15]">REMOVER</strong> do seu sanduíche:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.removableIngredients.map((ingredient) => {
                  const isRemoved = removedIngredients.includes(ingredient);
                  return (
                    <button
                      key={ingredient}
                      type="button"
                      onClick={() => toggleRemoveIngredient(ingredient)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isRemoved
                          ? 'bg-red-950/60 border-red-500/70 text-red-300 line-through'
                          : 'bg-[#240e15] border-zinc-800 hover:border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold">
                        {isRemoved ? `Sem ${ingredient}` : ingredient}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-black uppercase ${
                          isRemoved
                            ? 'bg-red-600 text-white'
                            : 'bg-[#18080c] text-zinc-400'
                        }`}
                      >
                        {isRemoved ? 'Removido' : 'Incluído'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Meat Doneness (Ponto da Carne na Brasa) */}
          {hasDonenessOption && (
            <div className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#eab308]" />
                <span>Ponto da Carne na Grelha</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mal_passado', label: 'Mal Passado', desc: 'Centro bem rosado' },
                  { id: 'ao_ponto', label: 'Ao Ponto ⭐', desc: 'Suculento (Recomendado)' },
                  { id: 'bem_passado', label: 'Bem Passado', desc: 'Crostinha bem tostadinha' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      playSound('ding');
                      setMeatDoneness(option.id as any);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      meatDoneness === option.id
                        ? 'bg-[#6b0f1a] border-[#eab308] text-white font-black shadow-md'
                        : 'bg-[#240e15] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{option.label}</div>
                    <div className="text-[10px] text-zinc-300 mt-0.5">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Available Extras (Adicionais) */}
          {item.availableExtras.length > 0 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#eab308]" />
                  <span>Turbine seu Sanduíche (Adicionais na Brasa)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Adicione doses extras de queijo melt, picanha selada, bacon e molhos artesanais:
                </p>
              </div>

              <div className="space-y-2">
                {item.availableExtras.map((extra) => {
                  const currentQty = addedExtras[extra.id] || 0;
                  return (
                    <div
                      key={extra.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        currentQty > 0
                          ? 'bg-[#3b121c] border-[#eab308]/60'
                          : 'bg-[#240e15] border-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm">
                          {extra.name}
                        </div>
                        <div className="text-xs text-[#eab308] font-black">
                          +{formatCurrency(extra.price)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentQty > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => decrementExtra(extra.id)}
                              className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-5 text-center font-black text-[#eab308] text-sm">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => incrementExtra(extra.id)}
                              className="w-7 h-7 rounded-lg bg-[#eab308] hover:bg-[#ca8a04] text-black flex items-center justify-center font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => incrementExtra(extra.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#18080c] hover:bg-[#eab308] hover:text-black text-xs font-bold text-zinc-300 transition-colors flex items-center gap-1 border border-zinc-750"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Special Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Alguma observação especial para a grelha?
            </label>
            <textarea
              rows={2}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Ex: Cortar ao meio, mandar maionese de alho-poró separada, caprichar no guardanapo..."
              className="w-full bg-zinc-900 border border-zinc-750 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#eab308] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Modal Sticky Footer with Quantity and Live Total */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs text-zinc-400 font-bold">Quantidade:</span>
            <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white flex items-center justify-center font-bold"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-7 text-center font-black text-white text-base">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleConfirmAddToCart}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black px-6 py-3.5 rounded-xl font-black text-sm sm:text-base shadow-xl shadow-[#eab308]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Adicionar ao Pedido</span>
            <span>•</span>
            <span className="text-lg">{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
