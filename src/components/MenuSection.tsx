import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Plus,
  X,
  Clock,
  Info,
  Flame,
  Utensils,
  Coffee,
  Soup,
  Star,
} from 'lucide-react';
import { MenuItem, CategoryId } from '../types';
import { formatCurrency } from '../utils/helpers';

interface MenuSectionProps {
  products: MenuItem[];
  selectedCategory: CategoryId;
  onSelectCategory: (cat: CategoryId) => void;
  onSelectItemToCustomize: (item: MenuItem) => void;
  onQuickAddToCart: (item: MenuItem) => void;
}

const CATEGORIES: { id: CategoryId; label: string; icon: React.ReactNode }[] = [
  { id: 'todos', label: 'Todos', icon: <Star className="w-4 h-4" /> },
  { id: 'espetinhos', label: 'Espetinhos', icon: <Flame className="w-4 h-4" /> },
  { id: 'tira_gosto', label: 'Tira-Gosto', icon: <Utensils className="w-4 h-4" /> },
  { id: 'pratos_arabes', label: 'Pratos Árabes', icon: <Utensils className="w-4 h-4" /> },
  { id: 'rabada', label: 'Rabada', icon: <Soup className="w-4 h-4" /> },
  { id: 'bebidas', label: 'Bebidas', icon: <Coffee className="w-4 h-4" /> },
];

export const MenuSection: React.FC<MenuSectionProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onSelectItemToCustomize,
  onQuickAddToCart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const availableProducts = useMemo(
    () => products.filter((p) => p.isAvailable !== false),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return availableProducts.filter((item) => {
      const matchesCat =
        selectedCategory === 'todos' || item.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      const inName = item.name.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inNote = (item.note || '').toLowerCase().includes(q);
      const inIngredients = (item.defaultIngredients || []).some((ing) =>
        ing.toLowerCase().includes(q)
      );
      return inName || inDesc || inNote || inIngredients;
    });
  }, [availableProducts, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { todos: availableProducts.length };
    availableProducts.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [availableProducts]);

  return (
    <section id="cardapio" className="space-y-6">
      {/* Header & Real-Time Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8A0000]">
            Cardápio Completo
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight mt-0.5">
            Escolha seus pratos e personalize adicionais
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, ingrediente ou bebida..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:border-[#8A0000] focus:ring-2 focus:ring-[#8A0000]/15"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#111111]"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400 hover:text-[#111111]'
              }`}
            >
              <span className={isActive ? 'text-[#D4A017]' : 'text-neutral-500'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
              <span
                className={`text-xs tabular-nums ${
                  isActive ? 'text-[#D4A017]' : 'text-neutral-400'
                }`}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
        <span>
          Exibindo <strong className="text-[#111111] tabular-nums">{filteredProducts.length}</strong>{' '}
          {filteredProducts.length === 1 ? 'item' : 'itens'}
          {searchQuery && (
            <>
              {' '}
              para <strong className="text-[#8A0000]">"{searchQuery}"</strong>
            </>
          )}
        </span>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-10 text-center space-y-3">
          <p className="font-bold text-neutral-800">
            Nenhum item encontrado para sua busca.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              onSelectCategory('todos');
            }}
            className="text-sm font-bold text-[#8A0000] hover:underline"
          >
            Mostrar todos os itens do cardápio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden flex flex-col hover:border-neutral-400 transition-colors"
            >
              {/* Clean 4:3 Media */}
              <div
                onClick={() => onSelectItemToCustomize(item)}
                className="aspect-[4/3] w-full bg-neutral-100 relative overflow-hidden cursor-pointer group"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.note && (
                  <div className="absolute bottom-3 left-3 bg-[#111111]/90 text-[#D4A017] px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>{item.note}</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      onClick={() => onSelectItemToCustomize(item)}
                      className="font-extrabold text-base text-[#111111] leading-snug cursor-pointer hover:text-[#8A0000] transition-colors"
                    >
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-1">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3 text-[#D4A017]" />
                      {item.prepTimeMinutes} min
                    </span>
                    <span>·</span>
                    <span>Personalizável</span>
                  </div>
                </div>

                {/* Price + Actions */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-lg font-black text-[#111111] tabular-nums">
                      {formatCurrency(item.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectItemToCustomize(item)}
                      className="px-3 py-2 rounded-lg border border-neutral-300 hover:border-[#111111] text-xs font-bold text-[#111111] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4A017]" />
                      <span>Adicionais</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onQuickAddToCart(item)}
                      className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      aria-label={`Adicionar ${item.name} ao carrinho`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Pedir</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
