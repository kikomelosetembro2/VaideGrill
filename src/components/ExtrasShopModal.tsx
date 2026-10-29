import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Flame, 
  Check, 
  ShoppingBag, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { IngredientOption, CartItem, MenuItem } from '../types';
import { COMMON_EXTRAS } from '../data/menuData';
import { formatCurrency, playSound } from '../utils/helpers';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface ExtrasShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExtraToCart: (extraItem: CartItem) => void;
}

export const ExtrasShopModal: React.FC<ExtrasShopModalProps> = ({
  isOpen,
  onClose,
  onAddExtraToCart,
}) => {
  const [quantities, setQuantities] = useState<{ [extraId: string]: number }>({});
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'proteina' | 'queijo' | 'molho' | 'extra'>('todos');

  if (!isOpen) return null;

  const handleIncrement = (extraId: string) => {
    playSound('ding');
    setQuantities((prev) => ({
      ...prev,
      [extraId]: (prev[extraId] || 0) + 1,
    }));
  };

  const handleDecrement = (extraId: string) => {
    playSound('ding');
    setQuantities((prev) => ({
      ...prev,
      [extraId]: Math.max(0, (prev[extraId] || 0) - 1),
    }));
  };

  const handleAddToCart = (extra: IngredientOption) => {
    const qty = quantities[extra.id] || 1;
    playSound('success');

    // Create a virtual menu item for the standalone addon
    const virtualMenuItem: MenuItem = {
      id: `addon_${extra.id}`,
      name: `[ADICIONAL] ${extra.name}`,
      category: 'porcoes_e_petiscos',
      description: `Porção adicional artesanal Vai de Grill: ${extra.name}. Acompanhamento para seus sanduíches na brasa.`,
      price: extra.price,
      image: extra.category === 'proteina'
        ? 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80'
        : extra.category === 'molho'
        ? 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
      badge: 'Adicional Avulso',
      prepTimeMinutes: 5,
      defaultIngredients: [extra.name],
      removableIngredients: [],
      availableExtras: [],
    };

    const cartItem: CartItem = {
      cartItemId: `addon_${extra.id}_${Date.now()}`,
      menuItem: virtualMenuItem,
      quantity: qty,
      customization: {
        removedIngredients: [],
        addedExtras: {},
      },
      unitPrice: extra.price,
      totalPrice: extra.price * qty,
    };

    onAddExtraToCart(cartItem);

    // Reset quantity for this item
    setQuantities((prev) => ({ ...prev, [extra.id]: 0 }));
  };

  const filteredExtras = COMMON_EXTRAS.filter((e) => {
    if (selectedCategory === 'todos') return true;
    return e.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#1c0c11] border border-[#eab308]/40 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eab308] flex items-center justify-center text-black font-black shadow-lg">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Comprar Adicionais da Brasa
                </h2>
                <span className="bg-[#eab308] text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Turbine seu Pedido
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Escolha doses extras de carnes nobres, queijos melt fundidos, molhos caseiros e bacon:
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-[#6b0f1a] text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="bg-[#18080c] px-4 sm:px-6 py-2.5 border-b border-zinc-850 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'todos', label: 'Todos os Adicionais' },
            { id: 'proteina', label: '🥩 Carnes & Cortes' },
            { id: 'queijo', label: '🧀 Queijos Melt' },
            { id: 'molho', label: '🥫 Potes de Molho' },
            { id: 'extra', label: '🥓 Bacon & Crocâncias' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#eab308] text-black shadow-md'
                  : 'bg-[#240e15] text-zinc-300 hover:text-white border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Extras List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredExtras.map((extra) => {
              const qty = quantities[extra.id] || 1;
              return (
                <div
                  key={extra.id}
                  className="bg-[#240e15] border border-zinc-800 hover:border-[#eab308]/60 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-white text-sm">
                        {extra.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400 capitalize block mt-0.5">
                        Categoria: {extra.category}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-[#eab308]">
                        {formatCurrency(extra.price)}
                      </span>
                      {extra.calories && (
                        <span className="text-[10px] text-zinc-400 block">
                          ~{extra.calories} kcal
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    {/* Quantity modifier */}
                    <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      <button
                        onClick={() => handleDecrement(extra.id)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-black text-white text-xs">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleIncrement(extra.id)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleAddToCart(extra)}
                      className="flex items-center gap-1.5 bg-[#eab308] hover:bg-[#ca8a04] text-black px-3.5 py-2 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Adicionar ({formatCurrency(extra.price * qty)})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#260f15] border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-300">
            Dica: Você também pode adicionar adicionais dentro de qualquer lanche no botão <strong>Personalizar</strong>!
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
