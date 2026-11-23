import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  ChefHat,
  Users,
  BarChart3,
  Package,
  Search,
  Download,
  Bell,
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
  TrendingUp,
  Building2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  MenuItem,
  Order,
  OrderStatus,
  OrderCategory,
  CategoryId,
  CustomerSpendingReport,
  MonthlySalesAnalytics,
  ConvenioCompany,
  ConveniosConfig,
  MarmitexPickup,
  VisitorStats,
} from '../types';
import {
  ORDER_STATUS_LIST,
  ORDER_CATEGORY_LABELS,
  COMMON_EXTRAS,
  CATEGORY_IMAGES,
  getOrderStatusLabel,
  resolveProductImage,
} from '../data/menuData';
import { formatCurrency } from '../utils/helpers';
import {
  DEFAULT_MARMITEX_UNIT_PRICE,
  computeDueAlerts,
  formatDateBR,
  resolveEffectivePaymentStatus,
} from '../utils/conveniosHelpers';
import {
  ConveniosMarmitexTab,
  ConvenioSubTab,
} from './ConveniosMarmitexTab';
import {
  triggerWhatsAppKitchenComanda,
  triggerCustomerReadyWhatsApp,
} from '../utils/whatsappReceipt';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminToken?: string | null;
  onSetAdminToken?: (token: string | null) => void;
  orders: Order[];
  onRefreshOrders: () => Promise<void>;
  onUpdateOrderStatusLocal: (updated: Order) => void;
  onNotifyCustomerReady: (order: Order) => void;
  onOpenReceiptModal: (order: Order) => void;
  products: MenuItem[];
  onProductsChanged: (nextProducts: MenuItem[]) => void;
  visitorStats?: VisitorStats | null;
}

type AdminTab =
  | 'comandas'
  | 'convenios'
  | 'clientes'
  | 'mensal'
  | 'dashboard'
  | 'produtos';

const CHART_PRODUCT_COLORS = [
  '#8A0000', // Crimson brand red
  '#D4A017', // Mustard gold
  '#111111', // Charcoal black
  '#16A34A', // Fresh green
  '#1D4ED8', // Royal blue
];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  onRefreshOrders,
  onUpdateOrderStatusLocal,
  onNotifyCustomerReady,
  onOpenReceiptModal,
  products,
  onProductsChanged,
  visitorStats: externalVisitorStats = null,
}) => {
  // Dashboard tabs
  const [activeTab, setActiveTab] = useState<AdminTab>('comandas');
  const [internalVisitorStats, setInternalVisitorStats] = useState<VisitorStats | null>(null);
  const visitorStats = internalVisitorStats || externalVisitorStats;

  // Convênios Corporativos (Marmitex) states
  const [conveniosConfig, setConveniosConfig] = useState<ConveniosConfig>({
    unitPrice: DEFAULT_MARMITEX_UNIT_PRICE,
  });
  const [convenioCompanies, setConvenioCompanies] = useState<ConvenioCompany[]>([]);
  const [marmitexPickups, setMarmitexPickups] = useState<MarmitexPickup[]>([]);
  const [convenioSubTab, setConvenioSubTab] = useState<ConvenioSubTab>('dashboard');
  const [showBellDropdown, setShowBellDropdown] = useState(false);

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

  // Monthly Comparative Sales (Recharts) states
  const [monthlySales, setMonthlySales] = useState<MonthlySalesAnalytics | null>(null);
  const [monthlyChartView, setMonthlyChartView] = useState<'6m' | 'prev_curr'>('6m');
  const [monthlyMetric, setMonthlyMetric] = useState<'units' | 'revenue'>('units');

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

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reports');
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
      if (data.monthlySales) {
        setMonthlySales(data.monthlySales as MonthlySalesAnalytics);
      }
      if (data.visitorStats) {
        setInternalVisitorStats(data.visitorStats as VisitorStats);
      }
    } catch {
      // ignore transient errors
    }
  }, []);

  const loadConvenios = useCallback(async () => {
    try {
      const res = await fetch('/api/convenios');
      if (!res.ok) return;
      const data = await res.json();
      if (data.config) setConveniosConfig(data.config as ConveniosConfig);
      if (Array.isArray(data.companies)) {
        setConvenioCompanies(data.companies as ConvenioCompany[]);
      }
      if (Array.isArray(data.pickups)) {
        setMarmitexPickups(data.pickups as MarmitexPickup[]);
      }
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void onRefreshOrders();
    void loadReports();
    void loadConvenios();
  }, [isOpen, orders.length, loadReports, loadConvenios, onRefreshOrders]);

  const dueAlerts = useMemo(
    () => computeDueAlerts(convenioCompanies, marmitexPickups),
    [convenioCompanies, marmitexPickups]
  );

  // Bell triggers prominently for 2 days before, today, or overdue (and lists up to 3 days)
  const urgentBellAlerts = useMemo(
    () => dueAlerts.filter((a) => a.daysRemaining <= 2),
    [dueAlerts]
  );

  const conveniosKpis = useMemo(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let monthQty = 0;
    let monthRev = 0;
    let totalReceivable = 0;
    let overdueAmount = 0;
    let overdueCount = 0;

    for (const p of marmitexPickups) {
      const eff = resolveEffectivePaymentStatus(p);
      if (p.pickupDateTime.startsWith(monthPrefix)) {
        monthQty += p.quantity;
        monthRev += p.totalAmount;
      }
      if (eff !== 'pago') {
        totalReceivable += p.totalAmount;
        if (eff === 'vencido') {
          overdueAmount += p.totalAmount;
          overdueCount += 1;
        }
      }
    }

    return {
      monthQty,
      monthRev: Number(monthRev.toFixed(2)),
      totalReceivable: Number(totalReceivable.toFixed(2)),
      overdueAmount: Number(overdueAmount.toFixed(2)),
      overdueCount,
      activeCompanies: convenioCompanies.filter((c) => c.status !== 'inativo').length,
    };
  }, [marmitexPickups, convenioCompanies]);

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

  const handleStatusChange = async (
    order: Order,
    status: OrderStatus,
    markReadyNotified = false
  ) => {
    setUpdatingOrderId(order.id);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, markReadyNotified }),
        }
      );
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

  const handleExportOrdersCsv = () => {
    const header = [
      'Comanda ID',
      'Numero',
      'Data / Hora',
      'Cliente',
      'Telefone / WhatsApp',
      'Categoria',
      'Mesa / Endereco',
      'Itens do Pedido',
      'Qtd Total Itens',
      'Subtotal (R$)',
      'Taxa Entrega (R$)',
      'Desconto (R$)',
      'Total (R$)',
      'Forma de Pagamento',
      'Status Pagamento',
      'Status do Pedido',
      'Observacoes',
    ];

    const escapeCsv = (val: string | number) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredOrders.map((ord) => {
      const catLabel = ORDER_CATEGORY_LABELS[ord.orderCategory]?.label || ord.orderCategory;
      const locationStr =
        ord.orderCategory === 'mesa'
          ? `Mesa ${ord.tableNumber || '-'}`
          : ord.orderCategory === 'delivery' && ord.customer.address
          ? `${ord.customer.address.street}, ${ord.customer.address.number} - ${ord.customer.address.neighborhood}`
          : 'Retirada no balcão';
      const itemsSummary = ord.items
        .map((it) => `${it.quantity}x ${it.menuItem.name}`)
        .join(' | ');
      const totalItemsQty = ord.items.reduce((acc, it) => acc + it.quantity, 0);

      return [
        ord.id,
        ord.orderNumber,
        ord.createdIso
          ? new Date(ord.createdIso).toLocaleString('pt-BR')
          : ord.createdAt,
        ord.customer.name,
        ord.customer.phone,
        catLabel,
        locationStr,
        itemsSummary,
        totalItemsQty,
        ord.subtotal.toFixed(2).replace('.', ','),
        ord.deliveryFee.toFixed(2).replace('.', ','),
        ord.discount.toFixed(2).replace('.', ','),
        ord.total.toFixed(2).replace('.', ','),
        ord.paymentMethod.toUpperCase(),
        ord.paymentStatus === 'aprovado' ? 'Aprovado' : 'Pendente',
        getOrderStatusLabel(ord.status),
        ord.notes || '',
      ];
    });

    const csv =
      '\uFEFF' +
      [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiosk-da-preta-pedidos.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    const nextAvail = p.isAvailable === false;
    const res = await fetch(`/api/products/${encodeURIComponent(p.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
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
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
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

          <div className="flex items-center gap-2 relative">
            {/* Sininho de Notificações e Alertas de Fatura (Convênios) */}
            <button
              type="button"
              onClick={() => setShowBellDropdown((prev) => !prev)}
              className={`relative px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                urgentBellAlerts.length > 0
                  ? 'border-[#8A0000] bg-[#8A0000] text-white'
                  : 'border-neutral-700 text-neutral-200 hover:bg-neutral-800'
              }`}
              title="Alertas de Vencimento de Faturas (Convênios)"
            >
              {urgentBellAlerts.length > 0 ? (
                <BellRing className="w-4 h-4 text-[#D4A017]" />
              ) : (
                <Bell className="w-4 h-4 text-[#D4A017]" />
              )}
              <span className="hidden sm:inline">Alertas</span>
              {dueAlerts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-[#D4A017] text-[#111111] text-[10px] font-black tabular-nums">
                  {dueAlerts.length}
                </span>
              )}
            </button>

            {showBellDropdown && (
              <div className="absolute right-10 top-11 z-50 w-80 sm:w-96 bg-white text-[#111111] border border-neutral-300 rounded-xl shadow-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#111111]">
                    Alertas de Faturas · Convênios ({dueAlerts.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBellDropdown(false)}
                    className="text-neutral-400 hover:text-[#111111] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {dueAlerts.length === 0 ? (
                  <p className="text-xs text-neutral-600 py-2">
                    Nenhuma fatura em atraso, vencendo hoje ou nos próximos dias.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {dueAlerts.map((al) => (
                      <div
                        key={`${al.companyId}_${al.dueDate}`}
                        className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          al.alertLevel === 'vencido'
                            ? 'bg-red-50 border-[#8A0000]'
                            : al.alertLevel === 'hoje'
                            ? 'bg-amber-50 border-[#D4A017]'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-[#111111] truncate">
                            {al.companyName}
                          </span>
                          <span
                            className={`text-[10px] font-black shrink-0 ${
                              al.alertLevel === 'vencido'
                                ? 'text-[#8A0000]'
                                : 'text-[#111111]'
                            }`}
                          >
                            {al.alertLevel === 'vencido'
                              ? `Atraso ${Math.abs(al.daysRemaining)}d`
                              : al.alertLevel === 'hoje'
                              ? 'Vence Hoje'
                              : `Faltam ${al.daysRemaining}d`}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 tabular-nums">
                          Venc: {formatDateBR(al.dueDate)} ·{' '}
                          <strong className="text-[#8A0000]">
                            {formatCurrency(al.pendingAmount)}
                          </strong>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowBellDropdown(false);
                    setActiveTab('convenios');
                    setConvenioSubTab('dashboard');
                  }}
                  className="w-full py-2 rounded-lg bg-[#111111] text-[#D4A017] font-bold text-xs cursor-pointer"
                >
                  Abrir Painel de Convênios & Cobranças
                </button>
              </div>
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

        {/* Direct Authenticated Content (Sem barreira de login) */}
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
                id: 'convenios' as AdminTab,
                label: `Convênios (Marmitex)${dueAlerts.length > 0 ? ` · ${dueAlerts.length} alerta(s)` : ''}`,
                icon: Building2,
              },
              {
                id: 'clientes' as AdminTab,
                label: `Relatório de Gastos por Cliente (${customerReports.length})`,
                icon: Users,
              },
              {
                id: 'mensal' as AdminTab,
                label: 'Vendas Mensais (Gráfico)',
                icon: TrendingUp,
              },
              {
                id: 'dashboard' as AdminTab,
                label: 'Dashboard & Vendas a Prazo',
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
            {/* TAB 1: COMANDAS & COZINHA (7 STATUSES + READY NOTIFY + WHATSAPP + EXPORT CSV) */}
            {activeTab === 'comandas' && (
              <div className="space-y-5">
                {/* Filters & Export CSV */}
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

                  <div className="flex flex-wrap items-center gap-2">
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

                    <button
                      type="button"
                      onClick={handleExportOrdersCsv}
                      disabled={filteredOrders.length === 0}
                      className="bg-[#111111] hover:bg-neutral-800 disabled:opacity-50 text-[#D4A017] font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                      title="Exportar lista de pedidos filtrados em CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Pedidos (CSV)</span>
                    </button>
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

              {/* TAB: CONVÊNIOS CORPORATIVOS (MARMITEX) */}
              {activeTab === 'convenios' && (
                <ConveniosMarmitexTab
                  config={conveniosConfig}
                  companies={convenioCompanies}
                  pickups={marmitexPickups}
                  dueAlerts={dueAlerts}
                  subTab={convenioSubTab}
                  onChangeSubTab={setConvenioSubTab}
                  onReloadConvenios={loadConvenios}
                />
              )}

              {/* TAB 3: DASHBOARD & VENDAS A PRAZO (CONVÊNIOS) + MAIS VENDIDOS */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Vendas a Prazo · Convênio de Empresas (Integrado ao Dashboard Administrativo) */}
                  <div className="border border-neutral-200 rounded-xl p-5 bg-neutral-50 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#111111] text-[#D4A017] flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-[#111111]">
                            Vendas a Prazo · Convênios Corporativos (Marmitex)
                          </h3>
                          <p className="text-xs text-neutral-600">
                            Resumo financeiro consolidado dos contratos de marmitex na parte administrativa.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('convenios');
                          setConvenioSubTab('dashboard');
                        }}
                        className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer"
                      >
                        Gerenciar Convênios &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="p-3.5 rounded-xl bg-white border border-neutral-200">
                        <p className="text-[11px] font-bold uppercase text-neutral-500">
                          Marmitex no Mês
                        </p>
                        <p className="text-xl font-black text-[#111111] mt-1 tabular-nums">
                          {conveniosKpis.monthQty} un.
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {conveniosKpis.activeCompanies} empresa(s) ativa(s)
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-neutral-200">
                        <p className="text-[11px] font-bold uppercase text-neutral-500">
                          Faturamento Convênios (Mês)
                        </p>
                        <p className="text-xl font-black text-[#111111] mt-1 tabular-nums">
                          {formatCurrency(conveniosKpis.monthRev)}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 tabular-nums">
                          Unitário: {formatCurrency(conveniosConfig.unitPrice)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-50 border border-[#D4A017]">
                        <p className="text-[11px] font-bold uppercase text-neutral-700">
                          Total a Receber (A Prazo)
                        </p>
                        <p className="text-xl font-black text-[#111111] mt-1 tabular-nums">
                          {formatCurrency(conveniosKpis.totalReceivable)}
                        </p>
                        <p className="text-[11px] text-neutral-700 mt-0.5">
                          Faturas em aberto
                        </p>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border ${
                          conveniosKpis.overdueAmount > 0
                            ? 'bg-red-50 border-[#8A0000]'
                            : 'bg-white border-neutral-200'
                        }`}
                      >
                        <p className="text-[11px] font-bold uppercase text-[#8A0000]">
                          Faturas Vencidas / Atraso
                        </p>
                        <p className="text-xl font-black text-[#8A0000] mt-1 tabular-nums">
                          {formatCurrency(conveniosKpis.overdueAmount)}
                        </p>
                        <p className="text-[11px] font-bold text-[#8A0000] mt-0.5 tabular-nums">
                          {conveniosKpis.overdueCount} registro(s) vencido(s)
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#111111] text-white">
                        <p className="text-[11px] font-bold uppercase text-[#D4A017]">
                          Receita Consolidada Total
                        </p>
                        <p className="text-xl font-black text-white mt-1 tabular-nums">
                          {formatCurrency(
                            reportSummary.totalRevenue + conveniosKpis.monthRev
                          )}
                        </p>
                        <p className="text-[11px] text-neutral-300 mt-0.5">
                          Pedidos + Convênios
                        </p>
                      </div>
                    </div>

                    {dueAlerts.length > 0 && (
                      <div className="p-3 rounded-lg bg-white border border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-[#8A0000] flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            {dueAlerts.length} empresa(s) com vencimento próximo, hoje ou em atraso ({dueAlerts.map((a) => a.companyName).join(', ')}).
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('convenios');
                            setConvenioSubTab('dashboard');
                          }}
                          className="font-extrabold text-[#111111] underline cursor-pointer"
                        >
                          Ver Alertas e Cobranças
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Contador de Visitantes do Aplicativo */}
                  <div className="border border-neutral-200 rounded-xl p-5 bg-white space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#8A0000] text-[#D4A017] flex items-center justify-center">
                          <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-black text-base text-[#111111]">
                            Contador de Visitantes do Aplicativo
                          </h3>
                          <p className="text-xs text-neutral-600">
                            Monitoramento de acessos totais, visitantes únicos e tráfego dos últimos 7 dias.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                        <p className="text-[11px] font-bold uppercase text-neutral-500">
                          Total de Visitas
                        </p>
                        <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                          {visitorStats?.totalVisits ?? 0}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Acessos registrados no app
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                        <p className="text-[11px] font-bold uppercase text-neutral-500">
                          Visitantes Únicos
                        </p>
                        <p className="text-2xl font-black text-[#8A0000] mt-1 tabular-nums">
                          {visitorStats?.uniqueVisitors ?? 0}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Dispositivos distintos
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-50 border border-[#D4A017]">
                        <p className="text-[11px] font-bold uppercase text-neutral-700">
                          Acessos Hoje
                        </p>
                        <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                          {visitorStats?.todayVisits ?? 0}
                        </p>
                        <p className="text-[11px] text-neutral-700 mt-0.5">
                          Visitas na data atual
                        </p>
                      </div>
                    </div>

                    {visitorStats?.last7Days && visitorStats.last7Days.length > 0 && (
                      <div className="grid grid-cols-7 gap-2 pt-1">
                        {visitorStats.last7Days.map((day) => (
                          <div
                            key={day.date}
                            className="p-2 rounded-lg border border-neutral-200 bg-neutral-50 text-center"
                          >
                            <p className="text-[10px] font-bold text-neutral-500 tabular-nums">
                              {day.label}
                            </p>
                            <p className="text-sm font-black text-[#111111] tabular-nums mt-0.5">
                              {day.visits}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Category Counts */}
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

              {/* TAB: VENDAS MENSAIS COMPARATIVAS (RECHARTS) */}
              {activeTab === 'mensal' && (
                <div className="space-y-6">
                  {/* Top Bar & Interactive Chart Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
                    <div>
                      <h3 className="font-black text-base text-[#111111]">
                        Comparativo Mensal de Vendas · Produtos Mais Populares
                      </h3>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Acompanhe a evolução mensal e compare os campeões de saída do
                        Quiosk da Preta.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Toggle */}
                      <div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setMonthlyChartView('6m')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            monthlyChartView === '6m'
                              ? 'bg-[#8A0000] text-white'
                              : 'text-neutral-700 hover:text-[#111111]'
                          }`}
                        >
                          Últimos 6 Meses (Top 5)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonthlyChartView('prev_curr')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            monthlyChartView === 'prev_curr'
                              ? 'bg-[#8A0000] text-white'
                              : 'text-neutral-700 hover:text-[#111111]'
                          }`}
                        >
                          Mês Atual vs Anterior (Top 8)
                        </button>
                      </div>

                      {/* Metric Toggle */}
                      <div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setMonthlyMetric('units')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            monthlyMetric === 'units'
                              ? 'bg-[#111111] text-[#D4A017]'
                              : 'text-neutral-700 hover:text-[#111111]'
                          }`}
                        >
                          Unidades
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonthlyMetric('revenue')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                            monthlyMetric === 'revenue'
                              ? 'bg-[#111111] text-[#D4A017]'
                              : 'text-neutral-700 hover:text-[#111111]'
                          }`}
                        >
                          Faturamento (R$)
                        </button>
                      </div>
                    </div>
                  </div>

                  {!monthlySales || monthlySales.topProducts.length === 0 ? (
                    <div className="p-10 text-center bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600">
                      Carregando dados comparativos de vendas mensais...
                    </div>
                  ) : (
                    <>
                      {/* KPI Summary Cards */}
                      {(() => {
                        const leader = monthlySales.topProducts[0];
                        const totalCurrQty = monthlySales.topProducts.reduce(
                          (acc, p) => acc + p.currentMonthQty,
                          0
                        );
                        const totalPrevQty = monthlySales.topProducts.reduce(
                          (acc, p) => acc + p.previousMonthQty,
                          0
                        );
                        const totalCurrRev = monthlySales.topProducts.reduce(
                          (acc, p) => acc + p.currentMonthRevenue,
                          0
                        );
                        const aggGrowth =
                          totalPrevQty > 0
                            ? Math.round(
                                ((totalCurrQty - totalPrevQty) / totalPrevQty) * 100
                              )
                            : 0;
                        const currLabel =
                          monthlySales.months[monthlySales.months.length - 1]
                            ?.monthLabel || 'Mês Atual';
                        const prevLabel =
                          monthlySales.months[monthlySales.months.length - 2]
                            ?.monthLabel || 'Mês Anterior';

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                                Produto Líder · {currLabel}
                              </p>
                              <p className="text-base font-black text-[#8A0000] mt-1 truncate">
                                {leader.name}
                              </p>
                              <p className="text-xs text-neutral-700 font-semibold mt-0.5 tabular-nums">
                                {leader.currentMonthQty} un. ·{' '}
                                {formatCurrency(leader.currentMonthRevenue)}
                              </p>
                            </div>

                            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                                Top 8 em {currLabel}
                              </p>
                              <p className="text-2xl font-black text-[#111111] mt-1 tabular-nums">
                                {totalCurrQty} un.
                              </p>
                              <p className="text-xs text-neutral-700 font-semibold mt-0.5 tabular-nums">
                                {formatCurrency(totalCurrRev)} faturados
                              </p>
                            </div>

                            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">
                                Comparativo vs. {prevLabel}
                              </p>
                              <p
                                className={`text-2xl font-black mt-1 tabular-nums ${
                                  aggGrowth >= 0
                                    ? 'text-emerald-700'
                                    : 'text-[#8A0000]'
                                }`}
                              >
                                {aggGrowth >= 0 ? `+${aggGrowth}%` : `${aggGrowth}%`}
                              </p>
                              <p className="text-xs text-neutral-700 font-semibold mt-0.5 tabular-nums">
                                Mês anterior: {totalPrevQty} un.
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Recharts BarChart Container */}
                      <div className="border border-neutral-200 rounded-xl p-4 sm:p-5 bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                            {monthlyChartView === '6m'
                              ? `Evolução Comparativa Mensal · Top 5 Produtos (${
                                  monthlyMetric === 'units'
                                    ? 'Unidades Vendidas'
                                    : 'Receita em R$'
                                })`
                              : `Comparativo Direto: Mês Anterior vs. Mês Atual (${
                                  monthlyMetric === 'units'
                                    ? 'Unidades Vendidas'
                                    : 'Receita em R$'
                                })`}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-semibold">
                            Passe o cursor sobre as barras para ver os valores exatos
                          </span>
                        </div>

                        <div className="w-full h-[360px]">
                          <ResponsiveContainer width="100%" height="100%">
                            {monthlyChartView === '6m' ? (
                              <BarChart
                                data={
                                  monthlyMetric === 'units'
                                    ? monthlySales.monthlyByProductUnits
                                    : monthlySales.monthlyByProductRevenue
                                }
                                margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#E5E7EB"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="monthLabel"
                                  tick={{ fontSize: 12, fontWeight: 700, fill: '#111111' }}
                                  axisLine={{ stroke: '#D4D4D8' }}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fontWeight: 600, fill: '#52525B' }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v: number) =>
                                    monthlyMetric === 'revenue'
                                      ? `R$${Math.round(v)}`
                                      : String(v)
                                  }
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: '#D4D4D8',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                  }}
                                  formatter={(value) =>
                                    monthlyMetric === 'revenue'
                                      ? formatCurrency(Number(value ?? 0))
                                      : `${value ?? 0} un.`
                                  }
                                />
                                <Legend
                                  wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }}
                                />
                                {monthlySales.topProducts.slice(0, 5).map((prod, idx) => (
                                  <Bar
                                    key={prod.id}
                                    dataKey={prod.shortName}
                                    name={prod.shortName}
                                    fill={CHART_PRODUCT_COLORS[idx % CHART_PRODUCT_COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={26}
                                  />
                                ))}
                              </BarChart>
                            ) : (
                              <BarChart
                                data={monthlySales.topProducts.map((p) => ({
                                  name: p.shortName,
                                  anterior:
                                    monthlyMetric === 'units'
                                      ? p.previousMonthQty
                                      : p.previousMonthRevenue,
                                  atual:
                                    monthlyMetric === 'units'
                                      ? p.currentMonthQty
                                      : p.currentMonthRevenue,
                                }))}
                                margin={{ top: 12, right: 16, left: 4, bottom: 38 }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#E5E7EB"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="name"
                                  interval={0}
                                  angle={-18}
                                  textAnchor="end"
                                  height={56}
                                  tick={{ fontSize: 11, fontWeight: 700, fill: '#111111' }}
                                  axisLine={{ stroke: '#D4D4D8' }}
                                  tickLine={false}
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fontWeight: 600, fill: '#52525B' }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v: number) =>
                                    monthlyMetric === 'revenue'
                                      ? `R$${Math.round(v)}`
                                      : String(v)
                                  }
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#FFFFFF',
                                    borderColor: '#D4D4D8',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                  }}
                                  formatter={(value) =>
                                    monthlyMetric === 'revenue'
                                      ? formatCurrency(Number(value ?? 0))
                                      : `${value ?? 0} un.`
                                  }
                                />
                                <Legend
                                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }}
                                />
                                <Bar
                                  dataKey="anterior"
                                  name={
                                    monthlySales.months[monthlySales.months.length - 2]
                                      ?.monthLabel || 'Mês Anterior'
                                  }
                                  fill="#111111"
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={28}
                                />
                                <Bar
                                  dataKey="atual"
                                  name={
                                    monthlySales.months[monthlySales.months.length - 1]
                                      ?.monthLabel || 'Mês Atual'
                                  }
                                  fill="#8A0000"
                                  radius={[4, 4, 0, 0]}
                                  maxBarSize={28}
                                />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Detailed Comparative Product Table */}
                      <div className="border border-neutral-200 rounded-xl overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 uppercase text-[11px]">
                              <th className="py-3 px-4 font-extrabold">Produto Popular</th>
                              <th className="py-3 px-4 font-extrabold text-right">
                                {monthlySales.months[monthlySales.months.length - 2]
                                  ?.monthLabel || 'Mês Anterior'}
                              </th>
                              <th className="py-3 px-4 font-extrabold text-right">
                                {monthlySales.months[monthlySales.months.length - 1]
                                  ?.monthLabel || 'Mês Atual'}
                              </th>
                              <th className="py-3 px-4 font-extrabold text-right">
                                Variação
                              </th>
                              <th className="py-3 px-4 font-extrabold text-right">
                                Faturamento Atual
                              </th>
                              <th className="py-3 px-4 font-extrabold text-right">
                                Acumulado 6M
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {monthlySales.topProducts.map((p, idx) => (
                              <tr key={p.id} className="hover:bg-neutral-50">
                                <td className="py-3 px-4 font-bold text-[#111111] flex items-center gap-2">
                                  <span
                                    className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                                    style={{
                                      backgroundColor:
                                        idx < 5
                                          ? CHART_PRODUCT_COLORS[idx]
                                          : '#9CA3AF',
                                    }}
                                  />
                                  <span>{p.name}</span>
                                </td>
                                <td className="py-3 px-4 text-right text-neutral-600 tabular-nums">
                                  {p.previousMonthQty} un.
                                </td>
                                <td className="py-3 px-4 text-right font-black text-[#111111] tabular-nums">
                                  {p.currentMonthQty} un.
                                </td>
                                <td className="py-3 px-4 text-right font-extrabold tabular-nums">
                                  <span
                                    className={
                                      p.growthPercent >= 0
                                        ? 'text-emerald-700'
                                        : 'text-[#8A0000]'
                                    }
                                  >
                                    {p.growthPercent >= 0
                                      ? `+${p.growthPercent}%`
                                      : `${p.growthPercent}%`}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-[#8A0000] tabular-nums">
                                  {formatCurrency(p.currentMonthRevenue)}
                                </td>
                                <td className="py-3 px-4 text-right text-neutral-700 font-semibold tabular-nums">
                                  {p.totalQty} un. · {formatCurrency(p.totalRevenue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
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
                            src={resolveProductImage(p.image, p.category)}
                            alt={p.name}
                            onError={(e) => {
                              if (e.currentTarget.dataset.fallbackApplied) return;
                              e.currentTarget.dataset.fallbackApplied = '1';
                              e.currentTarget.src = CATEGORY_IMAGES[p.category];
                            }}
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
      </div>
    </div>
  );
};
