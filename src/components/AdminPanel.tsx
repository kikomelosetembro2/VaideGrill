import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  X, 
  Search, 
  Image as ImageIcon,
  Flame,
  Award,
  Layers,
  Clock,
  Tag,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { MenuItem, CategoryId } from '../types';
import { RESTAURANT_INFO, COMMON_EXTRAS } from '../data/menuData';
import { formatCurrency, playSound } from '../utils/helpers';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface AdminPanelProps {
  products: MenuItem[];
  onAddProduct: (newProduct: MenuItem) => void;
  onUpdateProduct: (updatedProduct: MenuItem) => void;
  onDeleteProduct: (productId: string) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'produtos'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'todos' | CategoryId>('todos');

  // Modal for Add / Edit product
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryId>('sanduiches_artesanais');
  const [formPrice, setFormPrice] = useState('34.90');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80');
  const [formBadge, setFormBadge] = useState('Especial da Casa');
  const [formPrepTime, setFormPrepTime] = useState('20');
  const [formDefaultIngredients, setFormDefaultIngredients] = useState('Pão Brioche, Blend Bovino na Brasa 180g, Queijo Cheddar, Bacon em Tiras, Maionese Especial');
  const [formRemovableIngredients, setFormRemovableIngredients] = useState('Bacon em Tiras, Maionese Especial');

  // Handle local file upload (.jpg / .png / .webp)
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormImage(reader.result);
          playSound('success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Form for Adding New Product
  const handleOpenAddForm = () => {
    playSound('ding');
    setEditingProduct(null);
    setFormName('');
    setFormCategory('sanduiches_artesanais');
    setFormPrice('34.90');
    setFormOriginalPrice('');
    setFormDescription('');
    setFormImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80');
    setFormBadge('Novo no Cardápio');
    setFormPrepTime('20');
    setFormDefaultIngredients('Pão Artesanal na Brasa, Blend Bovino 180g, Queijo Melt, Bacon Crocante, Molho Vai de Grill');
    setFormRemovableIngredients('Bacon Crocante, Molho Vai de Grill');
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Product
  const handleOpenEditForm = (item: MenuItem) => {
    playSound('ding');
    setEditingProduct(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toFixed(2));
    setFormOriginalPrice(item.originalPrice ? item.originalPrice.toFixed(2) : '');
    setFormDescription(item.description);
    setFormImage(item.image);
    setFormBadge(item.badge || '');
    setFormPrepTime(item.prepTimeMinutes.toString());
    setFormDefaultIngredients(item.defaultIngredients.join(', '));
    setFormRemovableIngredients(item.removableIngredients.join(', '));
    setIsFormOpen(true);
  };

  // Submit Product Form
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    playSound('success');

    const defaultIngredientsArray = formDefaultIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    const removableIngredientsArray = formRemovableIngredients
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    if (editingProduct) {
      // Update
      const updated: MenuItem = {
        ...editingProduct,
        name: formName.trim(),
        category: formCategory,
        price: parseFloat(formPrice) || 30.0,
        originalPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : undefined,
        description: formDescription.trim(),
        image: formImage,
        badge: formBadge.trim() || undefined,
        prepTimeMinutes: parseInt(formPrepTime) || 20,
        defaultIngredients: defaultIngredientsArray,
        removableIngredients: removableIngredientsArray,
      };
      onUpdateProduct(updated);
    } else {
      // Add
      const newProd: MenuItem = {
        id: `vai_grill_${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        price: parseFloat(formPrice) || 30.0,
        originalPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : undefined,
        description: formDescription.trim(),
        image: formImage,
        badge: formBadge.trim() || undefined,
        prepTimeMinutes: parseInt(formPrepTime) || 20,
        defaultIngredients: defaultIngredientsArray,
        removableIngredients: removableIngredientsArray,
        availableExtras: COMMON_EXTRAS,
        salesCount: Math.floor(Math.random() * 40) + 10,
        isAvailable: true,
      };
      onAddProduct(newProd);
    }

    setIsFormOpen(false);
  };

  // Toggle availability
  const handleToggleAvailability = (item: MenuItem) => {
    playSound('ding');
    onUpdateProduct({
      ...item,
      isAvailable: item.isAvailable === false ? true : false,
    });
  };

  // Metrics and Sales Dashboard calculations
  const dashboardStats = useMemo(() => {
    const totalProducts = products.length;
    const totalSalesUnits = products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
    const totalRevenue = products.reduce((acc, p) => acc + (p.salesCount || 0) * p.price, 0);
    const avgTicket = totalSalesUnits > 0 ? totalRevenue / totalSalesUnits : 0;

    // Sort products by salesCount descending
    const topSellingProducts = [...products].sort(
      (a, b) => (b.salesCount || 0) - (a.salesCount || 0)
    );

    // Sales by category
    const salesByCategory: Record<string, { count: number; revenue: number }> = {};
    products.forEach((p) => {
      const cat = p.category;
      if (!salesByCategory[cat]) {
        salesByCategory[cat] = { count: 0, revenue: 0 };
      }
      const units = p.salesCount || 0;
      salesByCategory[cat].count += units;
      salesByCategory[cat].revenue += units * p.price;
    });

    return {
      totalProducts,
      totalSalesUnits,
      totalRevenue,
      avgTicket,
      topSellingProducts,
      salesByCategory,
    };
  }, [products]);

  // Filtered products list for product manager table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryFilter !== 'todos' && p.category !== selectedCategoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCategoryFilter, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-[#12080a] text-white flex flex-col overflow-hidden">
      {/* Admin Header */}
      <header className="bg-[#1f0b12] border-b border-[#eab308]/30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <VaiDeGrillLogo size="sm" />
          <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#eab308] text-black font-black text-xs px-2.5 py-0.5 rounded uppercase tracking-wider">
                Painel Administrativo
              </span>
              <span className="text-xs text-zinc-300 font-semibold hidden md:inline">
                Gestão de Produtos, Imagens & Relatório de Vendas
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              {RESTAURANT_INFO.address} - Rio Branco, AC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-1.5 bg-[#eab308] hover:bg-[#ca8a04] text-black px-3.5 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Incluir Produto</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-[#6b0f1a] text-zinc-300 hover:text-white border border-zinc-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Fechar Painel</span>
          </button>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="bg-[#180a0e] border-b border-zinc-850 px-4 sm:px-6 py-2.5 flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            playSound('ding');
            setActiveTab('dashboard');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#6b0f1a] text-white border border-[#eab308]/60 shadow-lg'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#eab308]" />
          <span>Dashboard & Produtos Mais Vendidos</span>
        </button>

        <button
          onClick={() => {
            playSound('ding');
            setActiveTab('produtos');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'produtos'
              ? 'bg-[#6b0f1a] text-white border border-[#eab308]/60 shadow-lg'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 text-[#eab308]" />
          <span>Gerenciar Cardápio ({products.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: DASHBOARD & RELATÓRIO PRODUTO MAIS VENDIDO */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[#1c0c11] border border-[#eab308]/30 p-4 sm:p-5 rounded-2xl space-y-1 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#eab308]" />
                  <span>Faturamento Estimado</span>
                </span>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {formatCurrency(dashboardStats.totalRevenue)}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18.4% nas vendas de sanduíches artesanais</span>
                </div>
              </div>

              <div className="bg-[#1c0c11] border border-[#eab308]/30 p-4 sm:p-5 rounded-2xl space-y-1 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#eab308]" />
                  <span>Itens Vendidos na Brasa</span>
                </span>
                <div className="text-xl sm:text-2xl font-black text-[#eab308]">
                  {dashboardStats.totalSalesUnits} lanches
                </div>
                <div className="text-[10px] text-zinc-400">
                  Grelhados na brasa no João Eduardo
                </div>
              </div>

              <div className="bg-[#1c0c11] border border-[#eab308]/30 p-4 sm:p-5 rounded-2xl space-y-1 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#eab308]" />
                  <span>Ticket Médio por Pedido</span>
                </span>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {formatCurrency(dashboardStats.avgTicket)}
                </div>
                <div className="text-[10px] text-zinc-400">
                  Alto consumo de combos e adicionais
                </div>
              </div>

              <div className="bg-[#1c0c11] border border-[#eab308]/30 p-4 sm:p-5 rounded-2xl space-y-1 shadow-lg">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#eab308]" />
                  <span>Produtos Ativos</span>
                </span>
                <div className="text-xl sm:text-2xl font-black text-white">
                  {dashboardStats.totalProducts} produtos
                </div>
                <div className="text-[10px] text-[#facc15] font-semibold">
                  100% disponíveis no cardápio
                </div>
              </div>
            </div>

            {/* Most Sold Products Ranking Table */}
            <div className="bg-[#1c0c11] border border-[#eab308]/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#eab308]" />
                    <span>Relatório Oficial: Produtos Mais Vendidos (Ranking)</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Classificação por volume de vendas e faturamento gerado na grelha:
                  </p>
                </div>
                <span className="text-xs bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/40 font-bold px-3 py-1 rounded-full self-start sm:self-auto">
                  Atualizado em Tempo Real
                </span>
              </div>

              {/* Table / List */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-[#291118] text-[#eab308] uppercase text-[10px] font-black border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-3">Posição</th>
                      <th className="py-3 px-3">Produto</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3 text-right">Preço Unit.</th>
                      <th className="py-3 px-3 text-right">Qtd. Vendida</th>
                      <th className="py-3 px-3 text-right">Faturamento</th>
                      <th className="py-3 px-3">Desempenho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {dashboardStats.topSellingProducts.map((prod, index) => {
                      const maxUnits = dashboardStats.topSellingProducts[0]?.salesCount || 1;
                      const percentage = Math.round(((prod.salesCount || 0) / maxUnits) * 100);
                      const totalRevenueItem = (prod.salesCount || 0) * prod.price;

                      return (
                        <tr key={prod.id} className="hover:bg-[#240e15] transition-colors">
                          <td className="py-3 px-3 font-black text-sm">
                            {index === 0 ? (
                              <span className="flex items-center gap-1 text-[#eab308]">
                                🥇 1º
                              </span>
                            ) : index === 1 ? (
                              <span className="flex items-center gap-1 text-zinc-200">
                                🥈 2º
                              </span>
                            ) : index === 2 ? (
                              <span className="flex items-center gap-1 text-amber-600">
                                🥉 3º
                              </span>
                            ) : (
                              <span className="text-zinc-500 font-bold ml-1">{index + 1}º</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-700"
                              />
                              <div>
                                <span className="font-bold text-white block text-xs sm:text-sm">
                                  {prod.name}
                                </span>
                                {prod.badge && (
                                  <span className="text-[9px] bg-[#eab308]/20 text-[#eab308] px-1.5 py-0.2 rounded font-bold">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-zinc-400 capitalize">
                            {prod.category.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-white">
                            {formatCurrency(prod.price)}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-[#eab308] text-sm">
                            {prod.salesCount || 0} unid.
                          </td>
                          <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm">
                            {formatCurrency(totalRevenueItem)}
                          </td>
                          <td className="py-3 px-3 min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                                <div
                                  className="bg-gradient-to-r from-[#eab308] to-[#ca8a04] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-400 font-bold">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GERENCIAMENTO DE PRODUTOS (CRUD COM UPLOAD JPG) */}
        {activeTab === 'produtos' && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Search and Category Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1c0c11] p-4 rounded-2xl border border-zinc-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produto por nome ou ingrediente..."
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#eab308]"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-750 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#eab308]"
                >
                  <option value="todos">Todas as Categorias</option>
                  <option value="combos_grill">Combos Grill</option>
                  <option value="sanduiches_artesanais">Sanduíches Artesanais</option>
                  <option value="especiais_da_grelha">Especiais da Grelha</option>
                  <option value="classicos_da_chapa">Clássicos da Chapa</option>
                  <option value="opcoes_veganas">Opções Veganas</option>
                  <option value="porcoes_e_petiscos">Porções e Petiscos</option>
                  <option value="bebidas_e_sucos">Bebidas e Sucos</option>
                  <option value="sobremesas">Sobremesas</option>
                </select>

                <button
                  onClick={handleOpenAddForm}
                  className="flex items-center gap-1.5 bg-[#eab308] hover:bg-[#ca8a04] text-black px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Novo Produto</span>
                </button>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className={`bg-[#1c0c11] rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                    item.isAvailable === false
                      ? 'border-zinc-800 opacity-60'
                      : 'border-zinc-800 hover:border-[#eab308]/60'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="relative h-36 w-full rounded-xl overflow-hidden bg-zinc-900">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.badge && (
                          <span className="bg-[#eab308] text-black font-black text-[9px] px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {item.isAvailable === false && (
                          <span className="bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 rounded-full">
                            Pausado
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-zinc-300 font-bold">
                        {item.salesCount || 0} vendidos
                      </div>
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-black text-white text-sm">{item.name}</h4>
                        <span className="text-sm font-black text-[#eab308]">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider block mt-0.5">
                        Categoria: {item.category.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-zinc-850 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                        item.isAvailable !== false
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.isAvailable !== false ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ativo</span>
                        </>
                      ) : (
                        <span>Pausado</span>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditForm(item)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-[#eab308] hover:text-black text-zinc-300 transition-colors"
                        title="Editar Produto"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Deseja remover "${item.name}" do cardápio?`)) {
                            playSound('alert');
                            onDeleteProduct(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-400 transition-colors"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: INCLUIR / EDITAR PRODUTO COM UPLOAD JPG DO HOST LOCAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#1c0c11] border border-[#eab308]/40 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#eab308]" />
                <h3 className="font-black text-base sm:text-lg text-white">
                  {editingProduct ? 'Editar Produto do Cardápio' : 'Incluir Novo Produto na Grelha'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Nome do Sanduíche / Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Vai de Picanha Especial Grill"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold focus:border-[#eab308] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Categoria no Cardápio *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-semibold focus:border-[#eab308] focus:outline-none"
                  >
                    <option value="combos_grill">Combos Grill</option>
                    <option value="sanduiches_artesanais">Sanduíches Artesanais</option>
                    <option value="especiais_da_grelha">Especiais da Grelha</option>
                    <option value="classicos_da_chapa">Clássicos da Chapa</option>
                    <option value="opcoes_veganas">Opções Veganas</option>
                    <option value="porcoes_e_petiscos">Porções e Petiscos</option>
                    <option value="bebidas_e_sucos">Bebidas e Sucos</option>
                    <option value="sobremesas">Sobremesas</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="35.90"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold focus:border-[#eab308] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Preço Original (De)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(e.target.value)}
                      placeholder="Ex: 45.00"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:border-[#eab308] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Descrição do Prato / Ingredientes Nobres
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descreva a carne, queijo, defumação na brasa e pão..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white focus:border-[#eab308] focus:outline-none resize-none"
                  />
                </div>

                {/* UPLOAD DE IMAGEM .JPG DO HOST LOCAL */}
                <div className="sm:col-span-2 space-y-2 bg-[#260f15] p-3.5 rounded-2xl border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload de Imagem (.jpg / .png do seu Computador)</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">Host Local</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Image Preview */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-black border border-zinc-700 shrink-0 shadow">
                      {formImage ? (
                        <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      {/* Local File Input */}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleLocalImageUpload}
                        className="block w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#eab308] file:text-black hover:file:bg-[#ca8a04] file:cursor-pointer"
                      />

                      {/* Fallback URL input */}
                      <input
                        type="url"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="Ou cole a URL direta da imagem (https://...)"
                        className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#eab308]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Badge de Destaque
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="Ex: Mais Vendido, Brasa Raiz, Promoção"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:border-[#eab308] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Tempo Médio de Preparo (minutos)
                  </label>
                  <input
                    type="number"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    placeholder="20"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:border-[#eab308] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Ingredientes Padrão da Receita (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formDefaultIngredients}
                    onChange={(e) => setFormDefaultIngredients(e.target.value)}
                    placeholder="Ex: Pão Brioche, Blend 180g na Brasa, Cheddar Melt, Bacon..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:border-[#eab308] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Ingredientes que o Cliente Pode Remover (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formRemovableIngredients}
                    onChange={(e) => setFormRemovableIngredients(e.target.value)}
                    placeholder="Ex: Bacon Crocante, Molho Barbecue, Cebola Crispy..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:border-[#eab308] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#eab308] to-[#ca8a04] text-black font-black shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>{editingProduct ? 'Salvar Alterações' : 'Cadastrar no Cardápio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
