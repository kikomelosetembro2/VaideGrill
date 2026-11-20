import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone,
  Clock,
  Instagram,
  Facebook,
  ShieldCheck,
  UtensilsCrossed,
  Star,
  Award,
  Accessibility,
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
} from 'lucide-react';
import {
  MenuItem,
  CartItem,
  Order,
  OrderCategory,
  CategoryId,
  EventReview,
  LoyaltyAccountState,
  LoyaltyReward,
} from './types';
import {
  RESTAURANT_INFO,
  MENU_ITEMS,
  COMMON_EXTRAS,
  RIO_BRANCO_NEIGHBORHOODS,
  getOrderStatusLabel,
  resolveProductImage,
} from './data/menuData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MenuSection } from './components/MenuSection';
import { EventsSection } from './components/EventsSection';
import { LoyaltyProgram } from './components/LoyaltyProgram';
import { OriginalMenuModal } from './components/OriginalMenuModal';
import { ProductCustomizeModal } from './components/ProductCustomizeModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import {
  PushNotificationToast,
  PushNotificationData,
} from './components/PushNotificationToast';
import { QuioskLogo } from './components/QuioskLogo';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { playSound, sendSystemNotification } from './utils/helpers';
import { triggerWhatsAppKitchenComanda } from './utils/whatsappReceipt';

export default function App() {
  // Core Store Data from Server
  const [products, setProducts] = useState<MenuItem[]>(MENU_ITEMS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<EventReview[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Admin Bearer Token held strictly in React state memory
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // UI Navigation & Modal States
  const [activeMainTab, setActiveMainTab] = useState<'cardapio' | 'eventos'>('cardapio');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('todos');
  const [isOriginalMenuOpen, setIsOriginalMenuOpen] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('quiosk_accessibility_mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle(
        'accessibility-mode',
        accessibilityMode
      );
    }
    try {
      localStorage.setItem(
        'quiosk_accessibility_mode',
        String(accessibilityMode)
      );
    } catch {
      // ignore storage restrictions
    }
  }, [accessibilityMode]);

  // User Profile & Loyalty Account State
  const [userProfile, setUserProfile] = useState<{ name: string; phone: string }>({
    name: 'Carlos Eduardo',
    phone: '(68) 99988-3321',
  });
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccountState>({
    phone: '(68) 99988-3321',
    totalSpent: 154,
    ordersCount: 2,
    earnedPoints: 154,
    redeemedPoints: 0,
    balance: 154,
    history: [],
  });

  // Shopping Cart States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderCategory, setOrderCategory] = useState<OrderCategory>('delivery');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    RIO_BRANCO_NEIGHBORHOODS[0].name
  );
  const [activeLoyaltyReward, setActiveLoyaltyReward] =
    useState<LoyaltyReward | null>(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const cartAnimTimerRef = useRef<number | null>(null);
  const cartAnimRafRef = useRef<number | null>(null);

  const triggerCartAnimation = useCallback(() => {
    setIsCartAnimating(false);
    if (cartAnimTimerRef.current !== null) {
      window.clearTimeout(cartAnimTimerRef.current);
      cartAnimTimerRef.current = null;
    }
    if (cartAnimRafRef.current !== null) {
      cancelAnimationFrame(cartAnimRafRef.current);
      cartAnimRafRef.current = null;
    }
    cartAnimRafRef.current = requestAnimationFrame(() => {
      setIsCartAnimating(true);
      cartAnimTimerRef.current = window.setTimeout(() => {
        setIsCartAnimating(false);
        cartAnimTimerRef.current = null;
      }, 700);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (cartAnimTimerRef.current !== null) {
        window.clearTimeout(cartAnimTimerRef.current);
      }
      if (cartAnimRafRef.current !== null) {
        cancelAnimationFrame(cartAnimRafRef.current);
      }
    };
  }, []);

  // Notifications state & ref to detect newly ready orders during polling
  const [notifications, setNotifications] = useState<PushNotificationData[]>([]);
  const knownStatusesRef = useRef<Record<string, string>>({});

  type BrowserNotificationState = 'default' | 'granted' | 'denied' | 'unsupported';
  const [notificationPermission, setNotificationPermission] =
    useState<BrowserNotificationState>(() => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'unsupported';
      }
      return Notification.permission;
    });

  const [notificationsOptIn, setNotificationsOptIn] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const saved = localStorage.getItem('quiosk_notifications_enabled');
      if (saved === 'false') return false;
      if (saved === 'true') return Notification.permission === 'granted';
      return Notification.permission === 'granted';
    } catch {
      return Notification.permission === 'granted';
    }
  });

  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(
    null
  );

  const isSystemAlertsActive =
    notificationPermission === 'granted' && notificationsOptIn;

  const emitNotification = useCallback(
    (
      title: string,
      message: string,
      status: Order['status'],
      orderId: string,
      soundType: 'ding' | 'success' | 'alert' = 'ding'
    ) => {
      const notif: PushNotificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        message,
        status,
        orderId,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setNotifications((prev) => [notif, ...prev.slice(0, 3)]);
      playSound(soundType);

      if (
        'Notification' in window &&
        Notification.permission === 'granted' &&
        notificationsOptIn
      ) {
        void sendSystemNotification(title, message, orderId);
      }
    },
    [notificationsOptIn]
  );

  const handleAcceptNotifications = useCallback(async () => {
    setNotificationFeedback(null);
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      setNotificationFeedback(
        'Este navegador não oferece suporte a notificações do sistema.'
      );
      return;
    }

    try {
      let perm = Notification.permission;
      if (perm !== 'granted') {
        perm = await Notification.requestPermission();
      }
      setNotificationPermission(perm);

      if (perm === 'granted') {
        setNotificationsOptIn(true);
        try {
          localStorage.setItem('quiosk_notifications_enabled', 'true');
        } catch {
          // ignore
        }
        playSound('success');
        const sent = await sendSystemNotification(
          `${RESTAURANT_INFO.name} · Notificações Ativadas`,
          'Você receberá alertas em tempo real do seu pedido mesmo fora do aplicativo.',
          'quiosk-welcome-notif'
        );
        setNotificationFeedback(
          sent
            ? 'Notificações ativadas! Você receberá alertas mesmo fora do app.'
            : 'Permissão concedida! Os alertas de pedido serão exibidos automaticamente.'
        );
      } else if (perm === 'denied') {
        setNotificationsOptIn(false);
        try {
          localStorage.setItem('quiosk_notifications_enabled', 'false');
        } catch {
          // ignore
        }
        setNotificationFeedback(
          'Permissão bloqueada no navegador. Libere "Notificações" nas configurações do site (ícone de cadeado).'
        );
      } else {
        setNotificationFeedback(
          'Solicitação cancelada. Clique novamente em "Aceitar Notificações" quando quiser ativar.'
        );
      }
    } catch {
      setNotificationFeedback(
        'Não foi possível solicitar permissão de notificações neste dispositivo.'
      );
    }
  }, []);

  const handleDisableNotifications = useCallback(() => {
    setNotificationsOptIn(false);
    try {
      localStorage.setItem('quiosk_notifications_enabled', 'false');
    } catch {
      // ignore
    }
    setNotificationFeedback('Alertas externos pausados. Você pode reativar a qualquer momento.');
  }, []);

  const handleTestSystemNotification = useCallback(async () => {
    if (notificationPermission !== 'granted' || !notificationsOptIn) {
      await handleAcceptNotifications();
      return;
    }
    playSound('ding');
    const ok = await sendSystemNotification(
      `${RESTAURANT_INFO.name} · Alerta de Teste`,
      'Tudo certo! Seus alertas de preparo e entrega estão funcionando fora do app.',
      `quiosk-test-${Date.now()}`
    );
    setNotificationFeedback(
      ok
        ? 'Notificação de teste enviada para o sistema!'
        : 'Não foi possível exibir a notificação de teste.'
    );
  }, [notificationPermission, notificationsOptIn, handleAcceptNotifications]);

  // Fetch products once on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(
            data.products.map((p: MenuItem) => ({
              ...p,
              image: resolveProductImage(p.image, p.category),
              availableExtras:
                p.availableExtras && p.availableExtras.length > 0
                  ? p.availableExtras
                  : COMMON_EXTRAS,
            }))
          );
        }
      })
      .catch(() => {
        // Fallback to static MENU_ITEMS if server not reachable yet
      });

    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.events)) {
          setEvents(
            data.events.map((ev: EventReview) => ({
              ...ev,
              photoUrl: ev.photoUrl
                ? resolveProductImage(ev.photoUrl)
                : undefined,
            }))
          );
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Fetch & poll orders to detect live status transitions + customer ready alerts
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        try {
          const rawLocal = localStorage.getItem('quiosk_local_orders');
          const localOrders: Order[] = rawLocal ? JSON.parse(rawLocal) : [];
          if (Array.isArray(localOrders) && localOrders.length > 0) {
            setOrders((prev) => (prev.length > 0 ? prev : localOrders));
            setActiveOrderId((curr) => curr || localOrders[0]?.id || null);
          }
        } catch {
          // ignore
        }
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data.orders)) return;

      const incoming: Order[] = data.orders;
      setOrders(incoming);
      setActiveOrderId((curr) => curr || incoming[0]?.id || null);

      // Detect status changes compared to known state
      const prevMap = knownStatusesRef.current;
      const hasInitialized = Object.keys(prevMap).length > 0;

      if (hasInitialized) {
        incoming.forEach((ord) => {
          const prevStatus = prevMap[ord.id];
          const prevReady = prevMap[`${ord.id}_ready`];
          const currReady = ord.readyNotifiedAt || '';

          if (
            (prevStatus && prevStatus !== ord.status) ||
            (currReady && currReady !== prevReady)
          ) {
            const label = getOrderStatusLabel(ord.status);
            const isReady =
              Boolean(ord.readyNotifiedAt) ||
              ord.status === 'pedido_mesa' ||
              ord.status === 'pedido_delivery' ||
              ord.status === 'pedido_entrega';

            emitNotification(
              isReady
                ? `Pedido ${ord.id} Pronto!`
                : `Comanda ${ord.id}: ${label}`,
              `${ord.customer.name}, o status do seu pedido mudou para "${label}".`,
              ord.status,
              ord.id,
              isReady ? 'success' : 'ding'
            );
          }
        });
      }

      const nextMap: Record<string, string> = {};
      incoming.forEach((ord) => {
        nextMap[ord.id] = ord.status;
        nextMap[`${ord.id}_ready`] = ord.readyNotifiedAt || '';
      });
      knownStatusesRef.current = nextMap;
    } catch {
      // ignore transient network errors
    }
  }, [emitNotification]);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 5000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchOrders]);

  // Cart Financial Calculations
  const cartSubtotal = cartItems.reduce((acc, i) => acc + i.totalPrice, 0);
  const neighborhoodObj = RIO_BRANCO_NEIGHBORHOODS.find(
    (n) => n.name === selectedNeighborhood
  );
  const deliveryFee =
    orderCategory === 'delivery' ? neighborhoodObj?.fee || 6.0 : 0;

  let discountAmount = 0;
  if (activeLoyaltyReward && cartSubtotal >= activeLoyaltyReward.minOrder) {
    discountAmount = activeLoyaltyReward.discountAmount;
  }

  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);
  const cartItemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Cart Actions
  const handleAddToCart = (cartItem: CartItem) => {
    playSound('success');
    setCartItems((prev) => [...prev, cartItem]);
    triggerCartAnimation();
    setIsCartOpen(true);
  };

  const handleQuickAddToCart = (item: MenuItem) => {
    playSound('success');
    const quick: CartItem = {
      cartItemId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      menuItem: {
        ...item,
        availableExtras:
          item.availableExtras && item.availableExtras.length > 0
            ? item.availableExtras
            : COMMON_EXTRAS,
      },
      quantity: 1,
      customization: {
        removedIngredients: [],
        addedExtras: {},
        ...(item.supportsDoneness ? { meatDoneness: 'ao_ponto' } : {}),
      },
      unitPrice: item.price,
      totalPrice: item.price,
    };
    setCartItems((prev) => [...prev, quick]);
    triggerCartAnimation();
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
      return;
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId
          ? { ...i, quantity: newQty, totalPrice: i.unitPrice * newQty }
          : i
      )
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  // Sync loyalty points based on customer total spend
  const fetchLoyalty = useCallback(async (phone: string) => {
    try {
      const res = await fetch(
        `/api/loyalty?phone=${encodeURIComponent(phone)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.balance === 'number') {
        setLoyaltyAccount(data as LoyaltyAccountState);
      }
    } catch {
      // ignore transient errors
    }
  }, []);

  useEffect(() => {
    fetchLoyalty(userProfile.phone);
  }, [userProfile.phone, orders.length, fetchLoyalty]);

  // Order Created Callback: Auto-trigger kitchen WhatsApp comanda & show receipt
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    knownStatusesRef.current[newOrder.id] = newOrder.status;
    setActiveOrderId(newOrder.id);
    setSelectedReceiptOrder(newOrder);
    setCartItems([]);
    setActiveLoyaltyReward(null);
    setIsReceiptModalOpen(true);

    if (newOrder.customer?.phone) {
      setUserProfile({
        name: newOrder.customer.name,
        phone: newOrder.customer.phone,
      });
    }

    // Send Kitchen Comanda via WhatsApp automatically
    triggerWhatsAppKitchenComanda(newOrder);

    emitNotification(
      `Comanda ${newOrder.id} Aceita!`,
      `Seu pedido foi numerado como ${newOrder.id} e encaminhado à cozinha do Quiosk da Preta.`,
      newOrder.status,
      newOrder.id,
      'success'
    );
  };

  const handleUpdateOrderStatusLocal = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    knownStatusesRef.current[updated.id] = updated.status;
    knownStatusesRef.current[`${updated.id}_ready`] =
      updated.readyNotifiedAt || '';
  };

  const handleNotifyCustomerReady = (order: Order) => {
    emitNotification(
      `Pedido ${order.id} PRONTO!`,
      `${order.customer.name}, seu pedido está pronto! Notificação enviada para ${order.customer.phone}.`,
      order.status,
      order.id,
      'success'
    );
  };

  const activeOrder =
    orders.find((o) => o.id === activeOrderId) || orders[0] || null;

  const scrollToMenu = () => {
    const el = document.getElementById('cardapio');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col">
      {/* Live Push & Sound Notifications & Offline Indicator */}
      <OfflineIndicator />
      <PushNotificationToast
        notifications={notifications}
        onDismiss={(id) =>
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
        onOpenOrderTracking={(ordId) => {
          setActiveOrderId(ordId);
          setIsTrackingOpen(true);
        }}
        canPromptBrowserPush={notificationPermission === 'default'}
        onAcceptNotifications={handleAcceptNotifications}
      />

      {/* Sticky 3-Zone Header with Quiosk da Preta Logo */}
      <Header
        cartItemCount={cartItemCount}
        cartTotal={cartTotal}
        isCartAnimating={isCartAnimating}
        loyaltyPoints={loyaltyAccount.balance}
        accessibilityMode={accessibilityMode}
        onToggleAccessibility={() => setAccessibilityMode((prev) => !prev)}
        activeOrder={activeOrder}
        activeMainTab={activeMainTab}
        onChangeMainTab={(tab) => {
          setActiveMainTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenLoyalty={() => setIsLoyaltyOpen(true)}
        onOpenOriginalMenu={() => setIsOriginalMenuOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenAdminPanel={() => setIsAdminOpen(true)}
        onScrollToMenu={() => {
          setActiveMainTab('cardapio');
          setTimeout(scrollToMenu, 40);
        }}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-8">
        {/* Visible Tab Bar: Cardápio Oficial vs Eventos & Avaliações */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveMainTab('cardapio')}
            className={`px-4 py-2.5 rounded-lg text-sm font-extrabold flex items-center gap-2 border transition-colors cursor-pointer ${
              activeMainTab === 'cardapio'
                ? 'bg-[#8A0000] text-white border-[#8A0000]'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
            }`}
          >
            <UtensilsCrossed
              className={`w-4 h-4 ${
                activeMainTab === 'cardapio' ? 'text-[#D4A017]' : 'text-neutral-500'
              }`}
            />
            <span>Cardápio & Pedidos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('eventos')}
            className={`px-4 py-2.5 rounded-lg text-sm font-extrabold flex items-center gap-2 border transition-colors cursor-pointer ${
              activeMainTab === 'eventos'
                ? 'bg-[#8A0000] text-white border-[#8A0000]'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
            }`}
          >
            <Star
              className={`w-4 h-4 ${
                activeMainTab === 'eventos' ? 'text-[#D4A017]' : 'text-neutral-500'
              }`}
            />
            <span>Eventos & Avaliações ({events.length})</span>
          </button>
        </div>

        {activeMainTab === 'cardapio' ? (
          <div className="space-y-10">
            <HeroSection
              onExploreMenu={scrollToMenu}
              onOpenOriginalMenu={() => setIsOriginalMenuOpen(true)}
              onOpenTracking={() => setIsTrackingOpen(true)}
            />

            <MenuSection
              products={products}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectItemToCustomize={(item) => setItemToCustomize(item)}
              onQuickAddToCart={handleQuickAddToCart}
            />
          </div>
        ) : (
          <EventsSection
            events={events}
            adminToken={adminToken}
            onEventCreated={(evt) => {
              playSound('success');
              setEvents((prev) => [evt, ...prev]);
            }}
            onEventDeleted={(id) =>
              setEvents((prev) => prev.filter((e) => e.id !== id))
            }
          />
        )}
      </main>

      {/* Clean Light Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50 mt-12 py-10 px-4 sm:px-6 text-xs text-neutral-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <QuioskLogo size="sm" showTagline />
            <p className="text-neutral-600 leading-relaxed max-w-sm">
              Cardápio digital oficial do {RESTAURANT_INFO.name}. Espetinhos na brasa,
              tira-gosto na chapa, pratos árabes, rabada no tucupí e bebidas geladas.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold uppercase tracking-wider text-[#111111]">
              Horário & Atendimento
            </h4>
            <p className="flex items-center gap-2 font-semibold text-neutral-700">
              <Clock className="w-4 h-4 text-[#D4A017]" />
              <span>{RESTAURANT_INFO.openingHours}</span>
            </p>
            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappRaw}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-[#8A0000] hover:underline tabular-nums"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp: {RESTAURANT_INFO.phone}</span>
            </a>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold uppercase tracking-wider text-[#111111]">
              Redes & Gestão
            </h4>
            <a
              href={RESTAURANT_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-bold text-[#111111] hover:text-[#8A0000] transition-colors"
            >
              <Instagram className="w-4 h-4 text-[#8A0000]" />
              <span>{RESTAURANT_INFO.instagram}</span>
            </a>
            <p className="flex items-center gap-2 font-medium">
              <Facebook className="w-4 h-4 text-[#111111]" />
              <span>Facebook: {RESTAURANT_INFO.facebook}</span>
            </p>
            <div className="pt-1 flex flex-col items-start gap-1.5">
              <button
                type="button"
                onClick={() => setIsLoyaltyOpen(true)}
                className="inline-flex items-center gap-1.5 font-bold text-[#111111] hover:text-[#8A0000] cursor-pointer"
              >
                <Award className="w-4 h-4 text-[#D4A017]" />
                <span>Programa de Fidelidade ({loyaltyAccount.balance} pts)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                className="inline-flex items-center gap-1.5 font-bold text-[#111111] hover:text-[#8A0000] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
                <span>Acessar Painel Administrativo</span>
              </button>
              <PWAInstallButton variant="footer" />
              <button
                type="button"
                onClick={() => setAccessibilityMode((prev) => !prev)}
                aria-pressed={accessibilityMode}
                className="inline-flex items-center gap-1.5 font-bold text-[#111111] hover:text-[#8A0000] cursor-pointer"
              >
                <Accessibility className="w-4 h-4 text-[#8A0000]" />
                <span>
                  Modo de Acessibilidade:{' '}
                  {accessibilityMode ? 'Ativado' : 'Desativado'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer System Notifications Opt-in Bar */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isSystemAlertsActive
                  ? 'bg-[#111111] border-[#111111] text-[#D4A017]'
                  : 'bg-white border-neutral-300 text-[#8A0000]'
              }`}
            >
              {isSystemAlertsActive ? (
                <BellRing className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="font-extrabold text-sm text-[#111111]">
                  Notificações do Pedido em Tempo Real
                </h5>
                {isSystemAlertsActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Ativadas</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600">
                Receba alertas do sistema na tela do celular ou computador quando seu pedido entrar em preparo ou ficar pronto, mesmo fora do aplicativo.
              </p>
              {notificationFeedback && (
                <p
                  className={`text-xs font-bold pt-1 ${
                    notificationPermission === 'denied' ||
                    notificationPermission === 'unsupported'
                      ? 'text-[#8A0000]'
                      : 'text-emerald-700'
                  }`}
                >
                  {notificationFeedback}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isSystemAlertsActive ? (
              <>
                <button
                  type="button"
                  onClick={handleTestSystemNotification}
                  className="px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white hover:border-[#111111] text-[#111111] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BellRing className="w-4 h-4 text-[#D4A017]" />
                  <span>Testar Alerta</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisableNotifications}
                  className="px-3.5 py-2.5 rounded-lg border border-neutral-300 bg-white hover:border-[#8A0000] text-neutral-700 hover:text-[#8A0000] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <BellOff className="w-4 h-4" />
                  <span>Pausar Alertas</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAcceptNotifications}
                disabled={notificationPermission === 'unsupported'}
                className="bg-[#8A0000] hover:bg-[#6E0000] disabled:opacity-50 text-white font-extrabold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <BellRing className="w-4 h-4 text-[#D4A017]" />
                <span>Aceitar Notificações</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <OriginalMenuModal
        isOpen={isOriginalMenuOpen}
        onClose={() => setIsOriginalMenuOpen(false)}
      />

      {itemToCustomize && (
        <ProductCustomizeModal
          item={itemToCustomize}
          onClose={() => setItemToCustomize(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      <CartDrawer
        isOpen={isCartOpen}
        isCartAnimating={isCartAnimating}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        orderCategory={orderCategory}
        onChangeOrderCategory={setOrderCategory}
        tableNumber={tableNumber}
        onChangeTableNumber={setTableNumber}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNeighborhood={setSelectedNeighborhood}
        loyaltyDiscountLabel={
          activeLoyaltyReward ? `Fidelidade (${activeLoyaltyReward.title})` : undefined
        }
        onRemoveLoyaltyDiscount={() => setActiveLoyaltyReward(null)}
        subtotal={cartSubtotal}
        deliveryFee={deliveryFee}
        discountAmount={discountAmount}
        total={cartTotal}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        orderCategory={orderCategory}
        onChangeOrderCategory={setOrderCategory}
        tableNumber={tableNumber}
        onChangeTableNumber={setTableNumber}
        selectedNeighborhood={selectedNeighborhood}
        deliveryFee={deliveryFee}
        subtotal={cartSubtotal}
        discountAmount={discountAmount}
        couponCode={activeLoyaltyReward ? 'Fidelidade' : undefined}
        total={cartTotal}
        onOrderCreated={handleOrderCreated}
      />

      <OrderReceiptModal
        order={selectedReceiptOrder || activeOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onOpenTracking={() => {
          setIsReceiptModalOpen(false);
          setIsTrackingOpen(true);
        }}
      />

      {isTrackingOpen && activeOrder && (
        <OrderTrackingModal
          order={activeOrder}
          orders={orders}
          onSelectOrder={(id) => setActiveOrderId(id)}
          onClose={() => setIsTrackingOpen(false)}
          onOpenReceiptModal={() => {
            setSelectedReceiptOrder(activeOrder);
            setIsReceiptModalOpen(true);
          }}
        />
      )}

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminToken={adminToken}
        onSetAdminToken={setAdminToken}
        orders={orders}
        onRefreshOrders={fetchOrders}
        onUpdateOrderStatusLocal={handleUpdateOrderStatusLocal}
        onNotifyCustomerReady={handleNotifyCustomerReady}
        onOpenReceiptModal={(ord) => {
          setSelectedReceiptOrder(ord);
          setIsReceiptModalOpen(true);
        }}
        products={products}
        onProductsChanged={setProducts}
      />

      <LoyaltyProgram
        isOpen={isLoyaltyOpen}
        onClose={() => setIsLoyaltyOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={(prof) => setUserProfile(prof)}
        loyaltyAccount={loyaltyAccount}
        onRedeemSuccess={(updatedAccount, reward) => {
          playSound('success');
          setLoyaltyAccount(updatedAccount);
          setActiveLoyaltyReward(reward);
        }}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}
