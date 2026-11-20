import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  LogOut,
  ChefHat,
  Users,
  BarChart3,
  Package,
  Search,
  Download,
  BellRing,
  MessageCircle,
  Printer,
  Plus,
  Edit3,
  Trash2,
  Upload,
  CheckCircle2,
  Bike,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import {
  MenuItem,
  Order,
  OrderStatus,
  OrderCategory,
  CategoryId,
  CustomerSpendingReport,
} from '../types';
import {
  ORDER_STATUS_LIST,
  ORDER_CATEGORY_LABELS,
  COMMON_EXTRAS,
  CATEGORY_IMAGES,
  getOrderStatusLabel,
} from '../data/menuData';
import { formatCurrency } from '../utils/helpers';
import {
  triggerWhatsAppKitchenComanda,
  triggerCustomerReadyWhatsApp,
} from '../utils/whatsappReceipt';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminToken: string | null;
  onSetAdminToken: (token: string | null) => void;
  orders: Order[];
  onRefreshOrders: () => Promise<void>;
  onUpdateOrderStatusLocal: (updated: Order) => void;
  onNotifyCustomerReady: (order: Order) => void;
  onOpenReceiptModal: (order: Order) => void;
  products: MenuItem[];
  onProductsChanged: (nextProducts: MenuItem[]) => void;
}

type AdminTab = 'comandas' | 'clientes' | 'dashboard' | 'produtos';

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  adminToken,
  onSetAdminToken,
  orders,
  onRefreshOrders,
  onUpdateOrderStatusLocal,
  onNotifyCustomerReady,
  onOpenReceiptModal,
  products,
  onProductsChanged,
}) => {
  // Auth states
  const [authConfigured, setAuthConfigured] = useState<boolean | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard tabs
  const [activeTab, setActiveTab] = useState<AdminTab>('comandas');

  // Comandas filters
  const [categoryFilter, setCategoryFilter] = useState<'todas' | OrderCategory>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Reports state
  const [customerReports, setCustomerReports] = useState<CustomerSpendingReport[]>([]);
  const [reportSummary, setReportSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    uniqueCustomers: 0,
    averageTicket: 0,
    categoryCounts: { delivery: 0, retirada: 0, mesa: 0 },
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSort, setCustomerSort] = useState<'spent' | 'orders' | 'name'>('spent');

  // Product CRUD states
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] =
    useState<Exclude<CategoryId, 'todos'>>('espetinhos');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formImage, setFormImage] = useState(CATEGORY_IMAGES.espetinhos);
  const [formSupportsDoneness, setFormSupportsDoneness] = useState(false);
  const [crudMessage, setCrudMessage] = useState<string | null>(null);

  // Check admin configuration status when opening
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/admin/auth-status')
      .then((r) => r.json())
      .then((d) => setAuthConfigured(!d.needsBootstrap))
      .catch(() => setAuthConfigured(true));
  }, [isOpen]);

  // Load customer spending report when logged in
  const loadReports = async (token: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onSetAdminToken(null);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const reports: CustomerSpendingReport[] = data.customerReport || [];
      setCustomerReports(reports);
      const totalRev = Number(data.totalRevenue) || 0;
      const validCnt = Number(data.validOrdersCount) || 0;
      setReportSummary({
        totalRevenue: totalRev,
        totalOrders: Number(data.totalOrders) || 0,
        uniqueCustomers: reports.length,
        averageTicket: validCnt > 0 ? totalRev / validCnt : 0,
        categoryCounts: data.byCategory || { delivery: 0, retirada: 0, mesa: 0 },
      });
    } catch {
      // ignore transient errors
    }
  };

  useEffect(() => {
    if (isOpen && adminToken) {
      loadReports(adminToken);
    }
  }, [isOpen, adminToken, orders.length]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (categoryFilter !== 'todas' && o.orderCategory !== categoryFilter) {
        return false;
      }
      if (statusFilter !== 'todos' && o.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [orders, categoryFilter, statusFilter]);

  const filteredCustomerReports = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    const list = customerReports.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.topItem.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (customerSort === 'orders') return b.totalOrders - a.totalOrders;
      if (customerSort === 'name') return a.name.localeCompare(b.name);
      return b.totalSpent - a.totalSpent;
    });
  }, [customerReports, customerSearch, customerSort]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 10);
  }, [products]);

  const maxSales = useMemo(
    () => Math.max(1, ...topProducts.map((p) => p.salesCount || 0)),
    [topProducts]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, productSearch]);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authConfigured === false) {
      if (password.length < 6) {
        setAuthError('A senha de administrador deve ter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('As senhas informadas não coincidem.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      const endpoint =
        authConfigured === false ? '/api/admin/bootstrap' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Falha na autenticação.');
        return;
      }
      setAuthConfigured(true);
      setPassword('');
      setConfirmPassword('');
      onSetAdminToken(data.token);
      await onRefreshOrders();
      await loadReports(data.token);
    } catch {
      setAuthError('Erro de conexão com o servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (adminToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch {
        // ignore
      }
    }
    onSetAdminToken(null);
  };

  const handleStatusChange = async (
    order: Order,
    status: OrderStatus,
    markReadyNotified = false
  ) => {
    if (!adminToken) return;
    setUpdatingOrderId(order.id);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ status, markReadyNotified }),
        }
      );
      if (res.status === 401) {
        onSetAdminToken(null);
        return;
      }
      const data = await res.json();
      if (res.ok && data.order) {
        onUpdateOrderStatusLocal(data.order as Order);
        if (markReadyNotified) {
          onNotifyCustomerReady(data.order as Order);
          triggerCustomerReadyWhatsApp(data.order as Order);
        }
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleExportCustomerCsv = () => {
    const header = [
      'Cliente',
      'Telefone',
      'Qtd Pedidos',
      'Delivery',
      'Retirada',
      'Mesa Presencial',
      'Item Favorito',
      'Ticket Medio (R$)',
      'Total Gasto (R$)',
      'Ultima Comanda',
    ];
    const escapeCsv = (val: string | number) => {
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };
    const rows = filteredCustomerReports.map((c) => [
      c.name,
      c.phone,
      c.totalOrders,
      c.deliveryCount,
      c.retiradaCount,
      c.mesaCount,
      c.topItem,
      c.averageTicket.toFixed(2).replace('.', ','),
      c.totalSpent.toFixed(2).replace('.', ','),
      `${c.lastOrderId} (${c.lastOrderAt})`,
    ]);

    const csv =
      '\uFEFF' +
      [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiosk-da-preta-gastos-clientes.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openCreateProductForm = () => {
    setEditingProduct(null);
    setIsCreatingProduct(true);
    setFormName('');
    setFormCategory('espetinhos');
    setFormPrice('');
    setFormDescription('');
    setFormNote('');
    setFormImage(CATEGORY_IMAGES.espetinhos);
    setFormSupportsDoneness(false);
    setCrudMessage(null);
  };

  const openEditProductForm = (p: MenuItem) => {
    setIsCreatingProduct(false);
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(String(p.price));
    setFormDescription(p.description);
    setFormNote(p.note || '');
    setFormImage(p.image || CATEGORY_IMAGES[p.category]);
    setFormSupportsDoneness(Boolean(p.supportsDoneness));
    setCrudMessage(null);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setCrudMessage('Imagem muito grande. Escolha um arquivo JPG/PNG abaixo de 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    const priceNum = Number(formPrice.replace(',', '.'));
    if (!formName.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setCrudMessage('Informe nome válido e preço numérico.');
      return;
    }

    const payload = {
      name: formName.trim(),
      category: formCategory,
      price: priceNum,
      description: formDescription.trim() || 'Preparado na hora no Quiosk da Preta.',
      note: formNote.trim() || undefined,
      image: formImage || CATEGORY_IMAGES[formCategory],
      supportsDoneness: formSupportsDoneness,
      prepTimeMinutes: formCategory === 'bebidas' ? 3 : 20,
      defaultIngredients: [formName.trim()],
      removableIngredients: [],
      isAvailable: true,
    };

    try {
      if (editingProduct) {
        const res = await fetch(
          `/api/products/${encodeURIComponent(editingProduct.id)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        if (res.ok && data.product) {
          onProductsChanged(
            products.map((p) =>
              p.id === editingProduct.id
                ? { ...data.product, availableExtras: COMMON_EXTRAS }
                : p
            )
          );
          setEditingProduct(null);
          setCrudMessage('Produto atualizado no cardápio.');
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.product) {
          onProductsChanged([
            { ...data.product, availableExtras: COMMON_EXTRAS },
            ...products,
          ]);
          setIsCreatingProduct(false);
          setCrudMessage('Novo produto adicionado ao cardápio.');
        }
      }
    } catch {
      setCrudMessage('Erro ao salvar produto.');
    }
  };

  const handleToggleProductAvailability = async (p: MenuItem) => {
    if (!adminToken) return;
    const nextAvail = p.isAvailable === false;
    const res = await fetch(`/api/products/${encodeURIComponent(p.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isAvailable: nextAvail }),
    });
    const data = await res.json();
    if (res.ok && data.product) {
      onProductsChanged(
        products.map((item) =>
          item.id === p.id ? { ...item, isAvailable: nextAvail } : item
        )
      );
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      onProductsChanged(products.filter((p) => p.id !== productId));
      setCrudMessage('Produto removido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-6xl w-full h-[94vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Admin Bar */}
        <div className="px-5 py-4 border-b border-neutral-200 bg-[#111111] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#8A0000] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#D4A017]" />
            </div>
            <div>
              <h2 className="font-black text-base">
                Painel Administrativo · Quiosk da Preta
              </h2>
              <p className="text-[11px] text-neutral-300">
                Comandas da Cozinha · Relatório de Gastos por Cliente · Cardápio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminToken && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-bold text-neutral-200 hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Sair</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
              aria-label="Fechar painel admin"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* If NOT authenticated: Login / Initial Setup Screen */}
        {!adminToken ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50">
            <form
              onSubmit={handleAuthSubmit}
              className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-50 border border-[#8A0000]/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#8A0000]" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#111111]">
                    {authConfigured === false
                      ? 'Configurar Acesso Administrativo'
                      : 'Login do Painel Administrativo'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {authConfigured === false
                      ? 'Primeiro acesso: defina o usuário e senha do gerente.'
                      : 'Entre com suas credenciais de administrador para gerenciar comandas e relatórios.'}
                  </p>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-lg bg-red-50 border border-[#8A0000] text-xs font-bold text-[#8A0000]">
                  {authError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Usuário
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#8A0000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Senha {authConfigured === false ? '(mínimo 6 caracteres)' : ''}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#8A0000]"
                  />
                </div>

                {authConfigured === false && (
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Confirmar Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#8A0000]"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#8A0000] hover:bg-[#6E0000] disabled:opacity-60 text-white font-extrabold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                {authLoading
                  ? 'Verificando...'
                  : authConfigured === false
                  ? 'Salvar Senha e Entrar'
                  : 'Entrar no Painel'}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Content */
          <>
            {/* Navigation Tabs */}
            <div className="px-5 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center gap-2 overflow-x-auto">
              {[
                {
                  id: 'comandas' as AdminTab,
                  label: `Comandas & Cozinha (${orders.length})`,
                  icon: ChefHat,
                },
                {
                  id: 'clientes' as AdminTab,
                  label: `Relatório de Gastos por Cliente (${customerReports.length})`,
                  icon: Users,
                },
                {
                  id: 'dashboard' as AdminTab,
                  label: 'Dashboard & Mais Vendidos',
                  icon: BarChart3,
                },
                {
                  id: 'produtos' as AdminTab,
                  label: `Cardápio & Produtos (${products.length})`,
                  icon: Package,
                },
              ].map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 border shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#8A0000] text-white border-[#8A0000]'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${active ? 'text-[#D4A017]' : 'text-neutral-500'}`}
                    />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Body */}
            <div className="flex-1 overflow-y-auto p-5 bg-white">
              {/* TAB 1: COMANDAS & COZINHA (7 STATUSES + READY NOTIFY + WHATSAPP) */}
              {activeTab === 'comandas' && (
                <div className="space-y-5">
                  {/* Filters */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase text-neutral-500 mr-1">
                        Categoria:
                      </span>
                      {[
                        { id: 'todas', label: 'Todas' },
                        { id: 'delivery', label: 'Delivery' },
                        { id: 'retirada', label: 'Retirada' },
                        { id: 'mesa', label: 'Mesa Presencial' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setCategoryFilter(c.id as 'todas' | OrderCategory)
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                            categoryFilter === c.id
                              ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                              : 'bg-white text-neutral-700 border-neutral-300'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase text-neutral-500">
                        Status:
                      </span>
                      <select
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(e.target.value as 'todos' | OrderStatus)
                        }
                        className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-bold text-[#111111] bg-white"
                      >
                        <option value="todos">Todos os 7 Status</option>
                        {ORDER_STATUS_LIST.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Orders Grid */}
                  {filteredOrders.length === 0 ? (
                    <div className="p-10 text-center bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600">
                      Nenhuma comanda encontrada para os filtros selecionados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredOrders.map((ord) => {
                        const statusObj =
                          ORDER_STATUS_LIST.find((s) => s.id === ord.status) ||
                          ORDER_STATUS_LIST[0];
                        const catObj = ORDER_CATEGORY_LABELS[ord.orderCategory];
                        const isBusy = updatingOrderId === ord.id;

                        return (
                          <div
                            key={ord.id}
                            className="border border-neutral-200 rounded-xl p-4 bg-white space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              {/* Order Header */}
                              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-neutral-100">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-lg text-[#8A0000] tabular-nums">
                                      {ord.id}
                                    </span>
                                    <span className="text-xs font-bold text-[#111111]">
                                      · {catObj.label}
                                      {ord.orderCategory === 'mesa' && ord.tableNumber
                                        ? ` (${ord.tableNumber})`
                                        : ''}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-neutral-600">
                                    {ord.customer.name} ·{' '}
                                    <span className="tabular-nums">{ord.customer.phone}</span>{' '}
                                    · {ord.createdAt}
                                  </p>
                                </div>

                                <span
                                  className={`px-2.5 py-1 rounded text-[11px] font-extrabold border shrink-0 ${statusObj.badgeStyle}`}
                                >
                                  {statusObj.label}
                                </span>
                              </div>

                              {/* Items & Extras */}
                              <div className="space-y-1.5 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs">
                                {ord.items.map((it) => {
                                  const extras = Object.entries(
                                    it.customization.addedExtras || {}
                                  ).filter(([, q]) => q > 0);

                                  return (
                                    <div key={it.cartItemId} className="space-y-0.5">
                                      <div className="flex justify-between font-bold text-[#111111]">
                                        <span>
                                          {it.quantity}x {it.menuItem.name}
                                        </span>
                                        <span className="tabular-nums">
                                          {formatCurrency(it.totalPrice)}
                                        </span>
                                      </div>
                                      {it.customization.meatDoneness && (
                                        <p className="pl-3 text-[11px] text-neutral-600">
                                          Ponto: {it.customization.meatDoneness.replace('_', ' ')}
                                        </p>
                                      )}
                                      {it.customization.removedIngredients.length > 0 && (
                                        <p className="pl-3 text-[11px] text-[#8A0000]">
                                          Remover: {it.customization.removedIngredients.join(', ')}
                                        </p>
                                      )}
                                      {extras.map(([extId, q]) => {
                                        const found =
                                          it.menuItem.availableExtras?.find(
                                            (e) => e.id === extId
                                          ) || COMMON_EXTRAS.find((e) => e.id === extId);
                                        if (!found) return null;
                                        return (
                                          <p key={extId} className="pl-3 text-[11px] font-semibold text-[#111111]">
                                            + {q}x {found.name}
                                          </p>
                                        );
                                      })}
                                      {it.customization.specialNotes && (
                                        <p className="pl-3 text-[11px] italic text-neutral-600">
                                          Obs: "{it.customization.specialNotes}"
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}

                                <div className="pt-1.5 mt-1.5 border-t border-neutral-200 flex justify-between font-black text-[#111111]">
                                  <span>Total ({ord.paymentMethod.toUpperCase()})</span>
                                  <span className="tabular-nums text-[#8A0000]">
                                    {formatCurrency(ord.total)}
                                  </span>
                                </div>
                              </div>

                              {/* Status Selector (All 7 exact statuses) */}
                              <div>
                                <label className="block text-[11px] font-extrabold uppercase text-neutral-500 mb-1">
                                  Atualizar Status na Comanda
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  {ORDER_STATUS_LIST.map((st) => {
                                    const active = ord.status === st.id;
                                    return (
                                      <button
                                        key={st.id}
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleStatusChange(ord, st.id)}
                                        className={`px-2 py-1.5 rounded text-[11px] font-bold border transition-colors cursor-pointer truncate ${
                                          active
                                            ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                                            : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                                        }`}
                                        title={st.label}
                                      >
                                        {st.shortLabel}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  const readyStatus: OrderStatus =
                                    ord.orderCategory === 'mesa'
                                      ? 'pedido_mesa'
                                      : ord.orderCategory === 'delivery'
                                      ? 'pedido_delivery'
                                      : 'pedido_finalizado';
                                  handleStatusChange(ord, readyStatus, true);
                                }}
                                className="flex-1 bg-[#D4A017] hover:bg-[#B8860B] text-[#111111] font-extrabold px-3 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <BellRing className="w-3.5 h-3.5" />
                                <span>Notificar Cliente Pronto</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => triggerWhatsAppKitchenComanda(ord)}
                                className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                                title="Enviar Comanda para Cozinha via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-[#D4A017]" />
                                <span>Cozinha WhatsApp</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenReceiptModal(ord)}
                                className="border border-neutral-300 hover:border-[#111111] text-[#111111] font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                                title="Ver / Imprimir Comanda"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Comanda</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RELATÓRIO DE GASTOS POR CLIENTE */}
              {activeTab === 'clientes' && (
                <div className="space-y-5">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                      <p className="text-xs font-bold text-neutral-500">
                        Receita Total (Válidos)
                      </p>
                      <p className="text-2xl font-black text-[#8A0000] mt-1 tabular-nums">
                        {formatCurrency(reportSummary.totalRevenue)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                      <p className="text-xs font-bold text-neutral-500">
                        Clientes Únicos
                      </p>
                      <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                        {reportSummary.uniqueCustomers}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                      <p className="text-xs font-bold text-neutral-500">
                        Ticket Médio por Pedido
                      </p>
                      <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                        {formatCurrency(reportSummary.averageTicket)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                      <p className="text-xs font-bold text-neutral-500">
                        Pedidos Processados
                      </p>
                      <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                        {reportSummary.totalOrders}
                      </p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Filtrar cliente por nome, telefone ou produto..."
                        className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-xs text-[#111111]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={customerSort}
                        onChange={(e) =>
                          setCustomerSort(
                            e.target.value as 'spent' | 'orders' | 'name'
                          )
                        }
                        className="px-3 py-2 border border-neutral-300 rounded-lg text-xs font-bold text-[#111111]"
                      >
                        <option value="spent">Ordenar: Maior Gasto</option>
                        <option value="orders">Ordenar: Mais Pedidos</option>
                        <option value="name">Ordenar: Nome (A-Z)</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleExportCustomerCsv}
                        className="bg-[#111111] hover:bg-neutral-800 text-[#D4A017] font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-neutral-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 uppercase text-[11px]">
                          <th className="py-3 px-4 font-extrabold">Cliente</th>
                          <th className="py-3 px-4 font-extrabold">Telefone</th>
                          <th className="py-3 px-4 font-extrabold text-center">
                            Pedidos
                          </th>
                          <th className="py-3 px-4 font-extrabold">
                            Delivery / Retirada / Mesa
                          </th>
                          <th className="py-3 px-4 font-extrabold">Mais Pedido</th>
                          <th className="py-3 px-4 font-extrabold text-right">
                            Ticket Médio
                          </th>
                          <th className="py-3 px-4 font-extrabold text-right">
                            Total Gasto
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {filteredCustomerReports.map((c) => (
                          <tr key={c.customerKey} className="hover:bg-neutral-50">
                            <td className="py-3 px-4 font-bold text-[#111111]">
                              {c.name}
                            </td>
                            <td className="py-3 px-4 text-neutral-600 tabular-nums">
                              {c.phone}
                            </td>
                            <td className="py-3 px-4 text-center font-black tabular-nums">
                              {c.totalOrders}
                            </td>
                            <td className="py-3 px-4 text-neutral-700 tabular-nums">
                              {c.deliveryCount} Del · {c.retiradaCount} Ret ·{' '}
                              {c.mesaCount} Mesa
                            </td>
                            <td className="py-3 px-4 font-medium text-neutral-800">
                              {c.topItem}
                            </td>
                            <td className="py-3 px-4 text-right text-neutral-700 tabular-nums">
                              {formatCurrency(c.averageTicket)}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-[#8A0000] tabular-nums">
                              {formatCurrency(c.totalSpent)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: DASHBOARD & MAIS VENDIDOS */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-neutral-200 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <Bike className="w-5 h-5 text-[#8A0000]" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold">
                          Pedidos Delivery
                        </p>
                        <p className="text-xl font-black text-[#111111] tabular-nums">
                          {reportSummary.categoryCounts.delivery}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Store className="w-5 h-5 text-[#D4A017]" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold">
                          Pedidos Retirada
                        </p>
                        <p className="text-xl font-black text-[#111111] tabular-nums">
                          {reportSummary.categoryCounts.retirada}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-[#111111]" />
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold">
                          Mesa Presencial
                        </p>
                        <p className="text-xl font-black text-[#111111] tabular-nums">
                          {reportSummary.categoryCounts.mesa}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Best Sellers Ranking */}
                  <div className="border border-neutral-200 rounded-xl p-5 space-y-4">
                    <h3 className="font-black text-base text-[#111111]">
                      Top 10 Produtos Mais Vendidos
                    </h3>
                    <div className="space-y-3">
                      {topProducts.map((item, idx) => {
                        const count = item.salesCount || 0;
                        const pct = Math.round((count / maxSales) * 100);
                        return (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#111111]">
                                #{idx + 1} · {item.name}
                              </span>
                              <span className="text-neutral-600 font-bold tabular-nums">
                                {count} un. · {formatCurrency(count * item.price)}
                              </span>
                            </div>
                            <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#8A0000] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PRODUTOS CRUD */}
              {activeTab === 'produtos' && (
                <div className="space-y-5">
                  {crudMessage && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-[#D4A017] text-xs font-bold text-[#111111] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#8A0000]" />
                      <span>{crudMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Buscar item no cardápio..."
                        className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-xs text-[#111111]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={openCreateProductForm}
                      className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#D4A017]" />
                      <span>Novo Produto</span>
                    </button>
                  </div>

                  {/* Create / Edit Form */}
                  {(isCreatingProduct || editingProduct) && (
                    <form
                      onSubmit={handleSaveProduct}
                      className="p-5 rounded-xl bg-neutral-50 border border-neutral-300 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm text-[#111111]">
                          {editingProduct
                            ? `Editar: ${editingProduct.name}`
                            : 'Cadastrar Novo Item no Cardápio'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingProduct(false);
                            setEditingProduct(null);
                          }}
                          className="text-xs font-bold text-neutral-500 hover:text-[#111111]"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Nome do Produto *
                          </label>
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Categoria
                          </label>
                          <select
                            value={formCategory}
                            onChange={(e) => {
                              const nextCat = e.target.value as Exclude<
                                CategoryId,
                                'todos'
                              >;
                              setFormCategory(nextCat);
                              if (!editingProduct) {
                                setFormImage(CATEGORY_IMAGES[nextCat]);
                              }
                            }}
                            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                          >
                            <option value="espetinhos">Espetinhos</option>
                            <option value="tira_gosto">Tira-Gosto</option>
                            <option value="pratos_arabes">Pratos Árabes</option>
                            <option value="rabada">Rabada</option>
                            <option value="bebidas">Bebidas</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Preço (R$) *
                          </label>
                          <input
                            type="text"
                            required
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            placeholder="28,00"
                            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Descrição / Acompanhamentos
                          </label>
                          <input
                            type="text"
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1">
                            Observação de Destaque (ex: SEM CAMARÃO)
                          </label>
                          <input
                            type="text"
                            value={formNote}
                            onChange={(e) => setFormNote(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={formImage}
                            alt="Preview"
                            className="w-12 h-12 rounded-lg object-cover border border-neutral-300"
                          />
                          <label className="px-3 py-2 border border-neutral-300 bg-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-[#111111]">
                            <Upload className="w-3.5 h-3.5 text-[#8A0000]" />
                            <span>Enviar Foto (JPG/PNG)</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formSupportsDoneness}
                            onChange={(e) =>
                              setFormSupportsDoneness(e.target.checked)
                            }
                          />
                          <span>Permitir escolher Ponto da Carne</span>
                        </label>

                        <button
                          type="submit"
                          className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-5 py-2.5 rounded-lg text-xs cursor-pointer"
                        >
                          {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Product List */}
                  <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                          />
                          <div>
                            <p className="font-extrabold text-[#111111]">
                              {p.name}{' '}
                              {p.isAvailable === false && (
                                <span className="text-[#8A0000]">(Pausado)</span>
                              )}
                            </p>
                            <p className="text-neutral-500">
                              {p.description} ·{' '}
                              <strong className="text-[#111111] tabular-nums">
                                {formatCurrency(p.price)}
                              </strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleProductAvailability(p)}
                            className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer ${
                              p.isAvailable === false
                                ? 'bg-red-50 text-[#8A0000] border-[#8A0000]'
                                : 'bg-white text-emerald-700 border-emerald-600'
                            }`}
                          >
                            {p.isAvailable === false ? 'Reativar' : 'Ativo'}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditProductForm(p)}
                            className="p-2 border border-neutral-300 rounded-lg hover:border-[#111111] cursor-pointer"
                            title="Editar produto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 border border-neutral-300 rounded-lg text-[#8A0000] hover:bg-red-50 cursor-pointer"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
