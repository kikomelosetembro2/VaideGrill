import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, Clock, Instagram, Facebook, ShieldCheck } from 'lucide-react';
import {
  MenuItem,
  CartItem,
  Order,
  OrderCategory,
  CategoryId,
} from './types';
import {
  RESTAURANT_INFO,
  MENU_ITEMS,
  COMMON_EXTRAS,
  RIO_BRANCO_NEIGHBORHOODS,
  AVAILABLE_COUPONS,
  getOrderStatusLabel,
} from './data/menuData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MenuSection } from './components/MenuSection';
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
import { playSound } from './utils/helpers';
import { triggerWhatsAppKitchenComanda } from './utils/whatsappReceipt';

export default function App() {
  // Core Store Data from Server
  const [products, setProducts] = useState<MenuItem[]>(MENU_ITEMS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Admin Bearer Token held strictly in React state memory
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // UI Navigation & Modal States
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('todos');
  const [isOriginalMenuOpen, setIsOriginalMenuOpen] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Shopping Cart States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderCategory, setOrderCategory] = useState<OrderCategory>('delivery');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(
    RIO_BRANCO_NEIGHBORHOODS[0].name
  );
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Notifications state & ref to detect newly ready orders during polling
  const [notifications, setNotifications] = useState<PushNotificationData[]>([]);
  const knownStatusesRef = useRef<Record<string, string>>({});

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

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, { body: message });
        } catch {
          // ignore
        }
      }
    },
    []
  );

  // Fetch products once on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(
            data.products.map((p: MenuItem) => ({
              ...p,
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
  }, []);

  // Fetch & poll orders to detect live status transitions + customer ready alerts
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
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
    return () => clearInterval(timer);
  }, [fetchOrders]);

  // Cart Financial Calculations
  const cartSubtotal = cartItems.reduce((acc, i) => acc + i.totalPrice, 0);
  const neighborhoodObj = RIO_BRANCO_NEIGHBORHOODS.find(
    (n) => n.name === selectedNeighborhood
  );
  const deliveryFee =
    orderCategory === 'delivery' ? neighborhoodObj?.fee || 6.0 : 0;

  let discountAmount = 0;
  if (appliedCoupon && AVAILABLE_COUPONS[appliedCoupon]) {
    const info = AVAILABLE_COUPONS[appliedCoupon];
    if (cartSubtotal >= info.minOrder) {
      discountAmount = info.discountPercent
        ? (cartSubtotal * info.discountPercent) / 100
        : info.discountFixed || 0;
    }
  }

  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);
  const cartItemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Cart Actions
  const handleAddToCart = (cartItem: CartItem) => {
    playSound('success');
    setCartItems((prev) => [...prev, cartItem]);
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

  const handleApplyCoupon = (code: string): boolean => {
    const coupon = AVAILABLE_COUPONS[code];
    if (!coupon || cartSubtotal < coupon.minOrder) return false;
    setAppliedCoupon(code);
    return true;
  };

  // Order Created Callback: Auto-trigger kitchen WhatsApp comanda & show receipt
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    knownStatusesRef.current[newOrder.id] = newOrder.status;
    setActiveOrderId(newOrder.id);
    setSelectedReceiptOrder(newOrder);
    setCartItems([]);
    setAppliedCoupon('');
    setIsReceiptModalOpen(true);

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
      {/* Live Push & Sound Notifications */}
      <PushNotificationToast
        notifications={notifications}
        onDismiss={(id) =>
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
        onOpenOrderTracking={(ordId) => {
          setActiveOrderId(ordId);
          setIsTrackingOpen(true);
        }}
      />

      {/* Sticky 3-Zone Header with Quiosk da Preta Logo */}
      <Header
        cartItemCount={cartItemCount}
        cartTotal={cartTotal}
        activeOrder={activeOrder}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOriginalMenu={() => setIsOriginalMenuOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenAdminPanel={() => setIsAdminOpen(true)}
        onScrollToMenu={scrollToMenu}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-10">
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
            <p className="flex items-center gap-2 font-medium">
              <Instagram className="w-4 h-4 text-[#8A0000]" />
              <span>{RESTAURANT_INFO.instagram}</span>
            </p>
            <p className="flex items-center gap-2 font-medium">
              <Facebook className="w-4 h-4 text-[#111111]" />
              <span>Facebook: {RESTAURANT_INFO.facebook}</span>
            </p>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="mt-1 inline-flex items-center gap-1.5 font-bold text-[#111111] hover:text-[#8A0000] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
              <span>Acessar Painel Administrativo</span>
            </button>
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
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={() => setAppliedCoupon('')}
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
        couponCode={appliedCoupon || undefined}
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
    </div>
  );
}
