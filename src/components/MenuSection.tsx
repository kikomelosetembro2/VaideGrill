import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Flame, 
  Sparkles, 
  SlidersHorizontal, 
  Layers, 
  Plus, 
  Clock, 
  ChevronRight,
  Award,
  X,
  Filter
} from 'lucide-react';
import { MenuItem, CategoryId } from '../types';
import { formatCurrency, playSound } from '../utils/helpers';

interface MenuSectionProps {
  products: MenuItem[];
  onSelectItemToCustomize: (item: MenuItem) => void;
  onQuickAddToCart: (item: MenuItem) => void;
  onOpenBuildBurger: () => void;
  selectedCategory: CategoryId;
  onSelectCategory: (category: CategoryId) => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  products,
  onSelectItemToCustomize,
  onQuickAddToCart,
  onOpenBuildBurger,
  selectedCategory,
  onSelectCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'popular' | 'vegetarian' | 'spicy'>('all');

  const categories: { id: CategoryId; label: string; icon: string }[] = [
    { id: 'todos', label: 'Todos os Lanches', icon: '🔥' },
    { id: 'combos_grill', label: 'Combos Grill', icon: '🍟' },
    { id: 'sanduiches_artesanais', label: 'Sanduíches Artesanais', icon: '🥩' },
    { id: 'especiais_da_grelha', label: 'Especiais da Grelha', icon: '🍖' },
    { id: 'classicos_da_chapa', label: 'Clássicos da Chapa', icon: '🥓' },
    { id: 'opcoes_veganas', label: 'Opções Veganas', icon: '🌱' },
    { id: 'porcoes_e_petiscos', label: 'Porções & Batatas', icon: '🧅' },
    { id: 'bebidas_e_sucos', label: 'Bebidas & Sucos', icon: '🥤' },
    { id: 'sobremesas', label: 'Sobremesas', icon: '🍨' },
  ];

  const filteredItems = useMemo(() => {
    return products.filter((item) => {
      // Don't show inactive items in public menu
      if (item.isAvailable === false) return false;

      // Category filter
      if (selectedCategory !== 'todos' && item.category !== selectedCategory) {
        return false;
      }

      // Dietary filter
      if (filterTag === 'popular' && !item.isPopular) return false;
      if (filterTag === 'vegetarian' && !item.isVegetarian) return false;
      if (filterTag === 'spicy' && !item.isSpicy) return false;

      // Search query filter (matches name, description, or ingredients)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesIngredients = item.defaultIngredients.some((ing) =>
          ing.toLowerCase().includes(query)
        );
        return matchesName || matchesDesc || matchesIngredients;
      }

      return true;
    });
  }, [products, selectedCategory, filterTag, searchQuery]);

  // Popular ingredients for real-time quick filter tags
  const popularIngredients = [
    'Picanha',
    'Bacon',
    'Cheddar',
    'Costela',
    'Alho-poró',
    'Queijo Coalho',
    'Brioche',
    'Vegano',
  ];

  // Count matches across the entire menu when searching
  const totalMenuMatches = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((item) => {
      if (item.isAvailable === false) return false;
      const matchesName = item.name.toLowerCase().includes(q);
      const matchesDesc = item.description.toLowerCase().includes(q);
      const matchesIngredients = item.defaultIngredients.some((ing) =>
        ing.toLowerCase().includes(q)
      );
      return matchesName || matchesDesc || matchesIngredients;
    }).length;
  }, [products, searchQuery]);

  return (
    <section className="space-y-6" id="cardapio">
      {/* Real-Time Search & Discovery Panel */}
      <div className="bg-gradient-to-r from-[#450a0a] via-[#240608] to-[#140305] border-2 border-[#eab308]/60 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Header with Title and Real-time Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-[#eab308]" />
              <span>Cardápio na Brasa • Busca em Tempo Real</span>
            </h2>
            <p className="text-xs text-amber-100/90 font-medium">
              Filtre sanduíches artesanais e combos por nome ou ingredientes (ex: picanha, bacon, queijo coalho, cheddar)...
            </p>
          </div>

          {/* Real-time result counter badge */}
          {searchQuery.trim() && (
            <div className="self-start sm:self-auto flex items-center gap-1.5 bg-[#eab308]/20 border border-[#eab308] px-3 py-1 rounded-full text-xs font-bold text-[#eab308]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}</span>
            </div>
          )}
        </div>

        {/* Real-time Search Input & Dietary Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#eab308]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome do lanche ou ingrediente (picanha, bacon, alho-poró, cheddar, batata)..."
              className="w-full bg-[#1c0507] border border-red-900/60 focus:border-[#eab308] rounded-2xl pl-11 pr-10 py-3.5 text-sm text-white placeholder-zinc-400 focus:outline-none transition-colors shadow-inner font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-full transition-colors cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dietary Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'popular', label: '⭐ Mais Pedidos' },
              { id: 'vegetarian', label: '🌱 Veganos' },
            ].map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => {
                  playSound('ding');
                  setFilterTag(tag.id as any);
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-colors cursor-pointer ${
                  filterTag === tag.id
                    ? 'bg-[#eab308] text-black shadow-md'
                    : 'bg-[#1f0609] text-zinc-300 hover:bg-[#36090e] hover:text-white border border-red-950'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Clickable Ingredient Suggestion Tags */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="text-amber-200 font-semibold flex items-center gap-1 shrink-0">
            <Flame className="w-3.5 h-3.5 text-[#eab308]" />
            Ingredientes populares:
          </span>
          {popularIngredients.map((ing) => {
            const isCurrent = searchQuery.toLowerCase() === ing.toLowerCase();
            return (
              <button
                key={ing}
                type="button"
                onClick={() => {
                  playSound('ding');
                  setSearchQuery(isCurrent ? '' : ing);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#eab308] text-black shadow-sm scale-105'
                    : 'bg-[#3b080d] text-amber-100 hover:bg-[#590e16] hover:text-white border border-red-900/60'
                }`}
              >
                {ing}
              </button>
            );
          })}
        </div>

        {/* Category cross-match notice */}
        {searchQuery.trim() && selectedCategory !== 'todos' && totalMenuMatches > filteredItems.length && (
          <div className="flex items-center justify-between gap-2 bg-[#7f1d1d]/80 border border-[#eab308]/60 px-3.5 py-2 rounded-xl text-xs text-white">
            <span>
              💡 Encontramos <strong>{totalMenuMatches}</strong> produtos correspondentes em todo o cardápio (incluindo outras categorias).
            </span>
            <button
              type="button"
              onClick={() => onSelectCategory('todos')}
              className="bg-[#eab308] hover:bg-[#facc15] text-black font-black px-2.5 py-1 rounded-lg text-xs shrink-0 cursor-pointer"
            >
              Ver Todos ({totalMenuMatches})
            </button>
          </div>
        )}
      </div>

      {/* Category Navigation Tabs */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 min-w-max">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  playSound('ding');
                  onSelectCategory(cat.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#eab308] to-[#ca8a04] text-black shadow-lg shadow-[#eab308]/30 scale-105'
                    : 'bg-[#1f0609] text-zinc-200 hover:text-white hover:bg-[#36090e] border border-red-950'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Callout Card: Monte seu Sanduíche do Zero na Grelha */}
      <div className="bg-gradient-to-r from-[#b91c1c] via-[#7f1d1d] to-[#1c0508] border-2 border-[#eab308] p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#eab308] flex items-center justify-center shrink-0 shadow-lg shadow-[#eab308]/40">
            <Layers className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Crie seu Sanduíche Artesanal Personalizado!
            </h3>
            <p className="text-xs text-amber-100">
              Escolha seu corte de carne na grelha, queijos derretidos, molhos secretos e toppings camada por camada.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenBuildBurger}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#eab308] hover:bg-[#facc15] text-black font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all hover:scale-105 shadow-md shadow-[#eab308]/30 shrink-0 cursor-pointer"
        >
          <span>Montar Agora</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group bg-[#180407] rounded-3xl border border-red-950 hover:border-[#eab308] transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-[#eab308]/15 hover:-translate-y-1"
          >
            <div>
              {/* Product Image Container */}
              <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#180407] via-transparent to-transparent opacity-80" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  {item.badge && (
                    <span className="bg-[#eab308] text-black text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                      {item.badge}
                    </span>
                  )}
                  {item.originalPrice && (
                    <span className="bg-[#dc2626] border border-[#eab308]/50 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      Promoção Brasa
                    </span>
                  )}
                </div>

                {/* Prep time badge */}
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-zinc-300 text-[11px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                  <Clock className="w-3 h-3 text-[#eab308]" />
                  <span>{item.prepTimeMinutes} min</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-[#eab308] transition-colors leading-tight">
                    {item.name}
                  </h3>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed font-medium">
                  {item.description}
                </p>

                {/* Key Ingredients Tag list */}
                {item.defaultIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.defaultIngredients.slice(0, 3).map((ing, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-[#3b080d] border border-red-900/50 text-amber-100 px-2 py-0.5 rounded-md font-semibold"
                      >
                        {ing}
                      </span>
                    ))}
                    {item.defaultIngredients.length > 3 && (
                      <span className="text-[10px] text-zinc-400 self-center">
                        +{item.defaultIngredients.length - 3} mais
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Price & Action Buttons */}
            <div className="p-4 sm:p-5 pt-0 border-t border-red-950 flex items-center justify-between gap-2">
              <div>
                {item.originalPrice && (
                  <div className="text-[11px] text-zinc-500 line-through">
                    {formatCurrency(item.originalPrice)}
                  </div>
                )}
                <div className="text-lg font-black text-[#eab308]">
                  {formatCurrency(item.price)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Customize Button */}
                <button
                  type="button"
                  onClick={() => onSelectItemToCustomize(item)}
                  className="bg-[#3b080d] hover:bg-[#590e16] text-white border border-[#eab308]/50 hover:border-[#eab308] px-3 py-2 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Personalizar ponto da carne, remover e adicionar extras"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#eab308]" />
                  <span>Personalizar</span>
                </button>

                {/* Quick Add button */}
                <button
                  type="button"
                  onClick={() => {
                    playSound('success');
                    onQuickAddToCart(item);
                  }}
                  className="bg-[#eab308] hover:bg-[#facc15] text-black w-9 h-9 rounded-xl flex items-center justify-center font-black transition-all hover:scale-105 shadow-md shadow-[#eab308]/20 cursor-pointer"
                  title="Adicionar direto ao carrinho"
                  aria-label={`Adicionar ${item.name}`}
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-[#1a080d] rounded-3xl border border-zinc-800 p-8">
          <div className="w-16 h-16 bg-[#260f15] rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Search className="w-8 h-8 text-[#eab308]" />
          </div>
          <h4 className="text-lg font-bold text-white">Nenhum lanche encontrado</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Não encontramos nenhum item correspondente a &quot;{searchQuery}&quot;. Tente buscar por picanha, bacon ou costela.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterTag('all');
              onSelectCategory('todos');
            }}
            className="mt-4 px-4 py-2 bg-[#eab308] text-black text-xs font-black rounded-xl"
          >
            Ver Todo o Cardápio Vai de Grill
          </button>
        </div>
      )}
    </section>
  );
};
