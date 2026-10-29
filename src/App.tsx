import React, { useState, useEffect } from 'react';
import { 
  MenuItem, 
  CartItem, 
  Order, 
  OrderStatus, 
  DeliveryMethod, 
  CategoryId,
  LoyaltyReward,
  CustomerInfo
} from './types';
import { 
  RESTAURANT_INFO, 
  MENU_ITEMS, 
  RIO_BRANCO_NEIGHBORHOODS, 
  AVAILABLE_COUPONS 
} from './data/menuData';
import { Header } from './components/Header';
import { BannerCarousel } from './components/BannerCarousel';
import { MenuSection } from './components/MenuSection';
import { ProductCustomizeModal } from './components/ProductCustomizeModal';
import { BuildYourOwnBurger } from './components/BuildYourOwnBurger';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { KitchenDisplaySystem } from './components/KitchenDisplaySystem';
import { AuthModal } from './components/AuthModal';
import { AdminPanel } from './components/AdminPanel';
import { FidelidadeModal } from './components/FidelidadeModal';
import { ExtrasShopModal } from './components/ExtrasShopModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { PushNotificationToast, PushNotificationData } from './components/PushNotificationToast';
import { BrandHeroHighlight } from './components/BrandHeroHighlight';
import { VaiDeGrillLogo } from './components/VaiDeGrillLogo';
import { formatCurrency, playSound } from './utils/helpers';
import { triggerWhatsAppOrder } from './utils/whatsappReceipt';
import { 
  Flame, 
  Layers, 
  ChefHat, 
  Clock, 
  MapPin, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  Bike, 
  Award,
  BarChart3
} from 'lucide-react';

export default function App() {
  // Navigation / Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<MenuItem | null>(null);
  const [isBuildBurgerOpen, setIsBuildBurgerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isKdsOpen, setIsKdsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFidelidadeOpen, setIsFidelidadeOpen] = useState(false);
  const [isExtrasShopOpen, setIsExtrasShopOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // User & Loyalty Points State
  const [currentUser, setCurrentUser] = useState<CustomerInfo | null>({
    name: 'Carlos Oliveira',
    phone: '(68) 99224-9224',
    loyaltyPoints: 185,
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(185);

  // Products state (editable via Admin Panel!)
  const [products, setProducts] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('vaidegrill_products');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return MENU_ITEMS;
  });

  // Persist products when edited
  useEffect(() => {
    try {
      localStorage.setItem('vaidegrill_products', JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  // Category and Menu Filter
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('todos');

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('entrega');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(
    RIO_BRANCO_NEIGHBORHOODS[0].name
  );
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');

  // Orders State (synchronized between customer & kitchen)
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'GRILL-1176',
      customer: {
        name: 'Marcos Vinícius',
        phone: '(68) 99227-1102',
        address: {
          street: 'Rua A',
          number: '1176',
          neighborhood: 'João Eduardo',
          city: 'Rio Branco',
          state: 'Acre',
          complement: 'Casa 2',
        },
      },
      items: [
        {
          cartItemId: 'seed_1',
          menuItem: MENU_ITEMS[0], // Combo Campeão
          quantity: 1,
          customization: {
            removedIngredients: ['Cebola Crispy Dourada'],
            addedExtras: { extra_blend_grelha: 1 },
            meatDoneness: 'ao_ponto',
            specialNotes: 'Favor enviar maionese de alho-poró bem gelada',
          },
          unitPrice: 58.90,
          totalPrice: 58.90,
        },
      ],
      deliveryMethod: 'entrega',
      deliveryFee: 3.00,
      subtotal: 58.90,
      discount: 0,
      total: 61.90,
      paymentMethod: 'pix',
      paymentStatus: 'aprovado',
      status: 'em_preparo',
      createdAt: '19:42',
      estimatedDeliveryTime: '20 - 30 min',
    },
    {
      id: 'GRILL-1175',
      customer: {
        name: 'Fernanda Albuquerque',
        phone: '(68) 99227-4491',
      },
      items: [
        {
          cartItemId: 'seed_2',
          menuItem: MENU_ITEMS[2], // Vai de Picanha
          quantity: 2,
          customization: {
            removedIngredients: [],
            addedExtras: { extra_bacon_artesanal: 1 },
            meatDoneness: 'ao_ponto',
          },
          unitPrice: 43.40,
          totalPrice: 86.80,
        },
      ],
      deliveryMethod: 'retirada',
      deliveryFee: 0,
      subtotal: 86.80,
      discount: 8.68,
      couponCode: 'VAIDEGRILL10',
      total: 78.12,
      paymentMethod: 'cartao_credito',
      paymentStatus: 'aprovado',
      status: 'recebido',
      createdAt: '19:50',
      estimatedDeliveryTime: '15 - 20 min',
    },
  ]);

  // Active customer tracking order
  const [activeOrderId, setActiveOrderId] = useState<string | null>('GRILL-1176');

  // Push notifications state
  const [notifications, setNotifications] = useState<PushNotificationData[]>([]);

  // Calculate cart financials
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  const selectedNeighborhoodObj = RIO_BRANCO_NEIGHBORHOODS.find(
    (n) => n.name === selectedNeighborhood
  );
  const deliveryFee = deliveryMethod === 'entrega' ? (selectedNeighborhoodObj?.fee || 4.0) : 0;

  // Coupon calculations
  let discountAmount = 0;
  if (appliedCoupon && AVAILABLE_COUPONS[appliedCoupon]) {
    const couponInfo = AVAILABLE_COUPONS[appliedCoupon];
    if (cartSubtotal >= couponInfo.minOrder) {
      if (couponInfo.discountPercent) {
        discountAmount = (cartSubtotal * couponInfo.discountPercent) / 100;
      } else if (couponInfo.discountFixed) {
        discountAmount = couponInfo.discountFixed;
      }
    }
  }

  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Cart operations
  const handleAddToCart = (newItem: CartItem) => {
    playSound('success');
    setCartItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const handleQuickAddToCart = (item: MenuItem) => {
    playSound('success');
    const quickCartItem: CartItem = {
      cartItemId: `${item.id}_${Date.now()}`,
      menuItem: item,
      quantity: 1,
      customization: {
        removedIngredients: [],
        addedExtras: {},
        meatDoneness: 'ao_ponto',
      },
      unitPrice: item.price,
      totalPrice: item.price,
    };
    setCartItems((prev) => [...prev, quickCartItem]);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    playSound('ding');
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    } else {
      setCartItems((prev) =>
        prev.map((i) =>
          i.cartItemId === cartItemId
            ? { ...i, quantity: newQty, totalPrice: i.unitPrice * newQty }
            : i
        )
      );
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleApplyCoupon = (code: string): boolean => {
    const coupon = AVAILABLE_COUPONS[code];
    if (!coupon) return false;
    if (cartSubtotal < coupon.minOrder) return false;
    setAppliedCoupon(code);
    return true;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
  };

  // Push notification dispatcher
  const emitPushNotification = (
    title: string,
    message: string,
    status: OrderStatus,
    orderId: string
  ) => {
    const newNotif: PushNotificationData = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      status,
      orderId,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
    playSound('ding');

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.svg',
        });
      } catch {
        // ignore
      }
    }
  };

  // Handle Order Created
  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrderId(newOrder.id);
    setSelectedReceiptOrder(newOrder);
    setCartItems([]);
    setAppliedCoupon('');
    setIsTrackingOpen(true);
    setIsReceiptModalOpen(true);

    // Gatilho: Dispara automaticamente o link wa.me para o WhatsApp da Lanchonete Vai de Grill
    triggerWhatsAppOrder(newOrder);

    // Increase Loyalty Points
    const earned = Math.floor(newOrder.total);
    setLoyaltyPoints((prev) => prev + earned);

    // Update salesCount of items in products list
    setProducts((prev) =>
      prev.map((p) => {
        const orderItem = newOrder.items.find((it) => it.menuItem.id === p.id);
        if (orderItem) {
          return { ...p, salesCount: (p.salesCount || 0) + orderItem.quantity };
        }
        return p;
      })
    );

    emitPushNotification(
      'Pedido Recebido!',
      `Seu pedido #${newOrder.id} foi recebido pela Lanchonete Vai de Grill e encaminhado para a brasa.`,
      'recebido',
      newOrder.id
    );
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    let title = 'Atualização do Pedido';
    let message = `O status do seu pedido #${orderId} foi atualizado para ${nextStatus}.`;

    if (nextStatus === 'em_preparo') {
      title = '🔥 Na Grelha & Em Preparo!';
      message = `O churrasqueiro da Lanchonete Vai de Grill está assando seu sanduíche na brasa!`;
    } else if (nextStatus === 'pronto') {
      title = '📦 Sanduíche Pronto!';
      message = `Seu pedido #${orderId} está embalado e quentinho aguardando saída do motoboy!`;
    } else if (nextStatus === 'saiu_para_entrega') {
      title = '🛵 Motoboy em Rota!';
      message = `O entregador da Vai de Grill acabou de sair da Rua A, 1176 com seu pedido!`;
    } else if (nextStatus === 'entregue') {
      title = '🎉 Pedido Entregue!';
      message = `Bom apetite! Agradecemos a preferência na Lanchonete Vai de Grill no João Eduardo.`;
    }

    emitPushNotification(title, message, nextStatus, orderId);
  };

  // Admin CRUD handlers
  const handleAddProduct = (newProduct: MenuItem) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleUpdateProduct = (updatedProduct: MenuItem) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Loyalty reward redemption
  const handleRedeemLoyaltyReward = (reward: LoyaltyReward) => {
    if (loyaltyPoints < reward.pointsCost) return;

    setLoyaltyPoints((prev) => prev - reward.pointsCost);

    if (reward.type === 'discount_fixed' && reward.discountValue) {
      // apply as special coupon
      setAppliedCoupon('GRILLVIP');
      playSound('success');
      alert(`🎉 Recompensa resgatada! Desconto de ${formatCurrency(reward.discountValue)} aplicado no carrinho.`);
      setIsCartOpen(true);
    } else {
      // Add free item to cart
      const freeItem: CartItem = {
        cartItemId: `reward_${Date.now()}`,
        menuItem: {
          id: reward.id,
          name: `🎁 [BRINDE VIP] ${reward.title}`,
          category: 'porcoes_e_petiscos',
          description: reward.description,
          price: 0,
          image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
          badge: 'Brinde Fidelidade',
          prepTimeMinutes: 10,
          defaultIngredients: [reward.title],
          removableIngredients: [],
          availableExtras: [],
        },
        quantity: 1,
        customization: {
          removedIngredients: [],
          addedExtras: {},
        },
        unitPrice: 0,
        totalPrice: 0,
        isLoyaltyReward: true,
      };
      setCartItems((prev) => [...prev, freeItem]);
      setIsCartOpen(true);
    }
  };

  const activeOrder = orders.find((o) => o.id === activeOrderId) || orders[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#180407] via-[#120305] to-[#0a0102] text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#eab308] selection:text-black">
      {/* Floating Push Notification Toasts */}
      <PushNotificationToast
        notifications={notifications}
        onDismiss={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onOpenOrderTracking={(ordId) => {
          setActiveOrderId(ordId);
          setIsTrackingOpen(true);
        }}
      />

      {/* Main Header */}
      <Header
        cartItemCount={cartItemCount}
        cartTotal={cartTotal}
        loyaltyPoints={loyaltyPoints}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenBuildBurger={() => setIsBuildBurgerOpen(true)}
        onOpenExtrasShop={() => setIsExtrasShopOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdminPanel={() => setIsAdminOpen(true)}
        onOpenFidelidade={() => setIsFidelidadeOpen(true)}
        onToggleKDS={() => setIsKdsOpen(true)}
        activeOrder={activeOrder}
        onOpenTracking={() => setIsTrackingOpen(true)}
        isKdsActive={isKdsOpen}
        currentUser={currentUser}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-8">
        {/* Destaque Centralizado: Nome Lanchonete Vai de Grill com Logo do Lado Esquerdo */}
        <BrandHeroHighlight
          onOpenBuildBurger={() => setIsBuildBurgerOpen(true)}
          onOpenExtrasShop={() => setIsExtrasShopOpen(true)}
        />

        {/* Banner Carousel with Combos, Custom Burger, and Loyalty Points */}
        <BannerCarousel
          onOpenBuildBurger={() => setIsBuildBurgerOpen(true)}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onApplyCouponCode={(code) => {
            setAppliedCoupon(code);
            setIsCartOpen(true);
          }}
          onOpenFidelidade={() => setIsFidelidadeOpen(true)}
        />

        {/* Dynamic Menu & Search Section */}
        <MenuSection
          products={products}
          onSelectItemToCustomize={(item) => {
            setItemToCustomize(item);
            setIsCustomizeModalOpen(true);
          }}
          onQuickAddToCart={handleQuickAddToCart}
          onOpenBuildBurger={() => setIsBuildBurgerOpen(true)}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      </main>

      {/* Footer with Vai de Grill Info */}
      <footer className="bg-[#140305] border-t border-red-950/80 mt-12 py-10 px-4 sm:px-6 text-zinc-300 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & description */}
          <div className="space-y-3 md:col-span-2">
            <VaiDeGrillLogo size="md" />
            <p className="text-zinc-300 max-w-md leading-relaxed text-xs">
              O verdadeiro sabor do sanduíche artesanal na brasa de Rio Branco, Acre. Pães selados com manteiga, carnes nobres grelhadas com crosta suculenta e molhos caseiros da casa.
            </p>
            <div className="pt-1 flex items-center gap-2 text-zinc-200">
              <MapPin className="w-4 h-4 text-[#eab308]" />
              <span>{RESTAURANT_INFO.address} - Rio Branco, AC</span>
            </div>
          </div>

          {/* Opening Hours & Contact */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-[#eab308] text-xs uppercase tracking-wider">
              Horário & Delivery
            </h4>
            <div className="text-zinc-300 space-y-1 font-medium">
              <p>Terça a Domingo: 18:00 às 23:00</p>
              <p className="text-zinc-500">Segunda-feira: Fechado para descanso</p>
            </div>
            <div className="pt-2">
              <a
                href={`https://wa.me/${RESTAURANT_INFO.whatsappRaw}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#eab308] font-black underline flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-[#eab308]" />
                <span>{RESTAURANT_INFO.phone}</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-[#eab308] text-xs uppercase tracking-wider">
              Atalhos Rápidos
            </h4>
            <ul className="space-y-2 text-zinc-300 font-semibold">
              <li>
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="hover:text-[#eab308] flex items-center gap-1.5 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#eab308]" />
                  <span>Painel Administrativo & Relatório</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsFidelidadeOpen(true)}
                  className="hover:text-[#eab308] flex items-center gap-1.5 transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-[#eab308]" />
                  <span>Clube de Fidelidade ({loyaltyPoints} pts)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsKdsOpen(true)}
                  className="hover:text-[#eab308] flex items-center gap-1.5 transition-colors"
                >
                  <ChefHat className="w-3.5 h-3.5 text-[#eab308]" />
                  <span>Painel da Cozinha KDS</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsBuildBurgerOpen(true)}
                  className="hover:text-[#eab308] flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-[#eab308]" />
                  <span>Monte seu Sanduíche do Zero</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-zinc-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-400 text-[11px]">
          <div>
            © {new Date().getFullYear()} {RESTAURANT_INFO.name}. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
            <span>Bairro João Eduardo • Rio Branco - Acre</span>
            <span>•</span>
            <span>Chave Pix: {RESTAURANT_INFO.phone}</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Critical Product Customization Screen */}
      {isCustomizeModalOpen && itemToCustomize && (
        <ProductCustomizeModal
          item={itemToCustomize}
          onClose={() => {
            setIsCustomizeModalOpen(false);
            setItemToCustomize(null);
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 2. Step-by-Step Custom Burger Builder */}
      {isBuildBurgerOpen && (
        <BuildYourOwnBurger
          onClose={() => setIsBuildBurgerOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 3. Cart Drawer with Delivery Selection & Loyalty Points */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        deliveryMethod={deliveryMethod}
        onChangeDeliveryMethod={setDeliveryMethod}
        selectedNeighborhood={selectedNeighborhood}
        onSelectNeighborhood={setSelectedNeighborhood}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        subtotal={cartSubtotal}
        deliveryFee={deliveryFee}
        discountAmount={discountAmount}
        total={cartTotal}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onOpenExtrasShop={() => {
          setIsCartOpen(false);
          setIsExtrasShopOpen(true);
        }}
      />

      {/* 4. Checkout Modal with Pix QR Code, Credit Card & Addresses */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        deliveryMethod={deliveryMethod}
        selectedNeighborhood={selectedNeighborhood}
        deliveryFee={deliveryFee}
        subtotal={cartSubtotal}
        discountAmount={discountAmount}
        couponCode={appliedCoupon || undefined}
        total={cartTotal}
        currentUser={currentUser}
        onOrderCreated={handleOrderCreated}
      />

      {/* 5. Real-Time Order Tracking Modal with Map from João Eduardo */}
      {isTrackingOpen && activeOrder && (
        <OrderTrackingModal
          order={activeOrder}
          onClose={() => setIsTrackingOpen(false)}
          onUpdateStatus={handleUpdateOrderStatus}
          onOpenReceiptModal={() => {
            setSelectedReceiptOrder(activeOrder);
            setIsReceiptModalOpen(true);
          }}
        />
      )}

      {/* 6. Kitchen Display System (KDS & Order Manager) */}
      {isKdsOpen && (
        <KitchenDisplaySystem
          orders={orders}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onClose={() => setIsKdsOpen(false)}
        />
      )}

      {/* 7. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(usr) => {
          setCurrentUser((prev) => ({
            ...prev,
            name: usr.name,
            phone: usr.phone,
          }));
        }}
      />

      {/* 8. Admin Panel (Dashboard Mais Vendidos + CRUD com Upload JPG) */}
      {isAdminOpen && (
        <AdminPanel
          products={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* 9. Loyalty Club Modal (Pontuação & Resgate de Recompensas) */}
      {isFidelidadeOpen && (
        <FidelidadeModal
          isOpen={isFidelidadeOpen}
          onClose={() => setIsFidelidadeOpen(false)}
          currentUser={currentUser}
          currentPoints={loyaltyPoints}
          onRedeemReward={handleRedeemLoyaltyReward}
        />
      )}

      {/* 10. Dedicated Extras & Add-ons Shop Modal */}
      <ExtrasShopModal
        isOpen={isExtrasShopOpen}
        onClose={() => setIsExtrasShopOpen(false)}
        onAddExtraToCart={handleAddToCart}
      />

      {/* 11. Kitchen Voucher & WhatsApp Order Receipt Modal */}
      <OrderReceiptModal
        order={selectedReceiptOrder || activeOrder}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onOpenTracking={() => {
          setIsReceiptModalOpen(false);
          setIsTrackingOpen(true);
        }}
      />
    </div>
  );
}
