export type CategoryId = 
  | 'todos'
  | 'combos_grill'
  | 'sanduiches_artesanais'
  | 'especiais_da_grelha'
  | 'classicos_da_chapa'
  | 'opcoes_veganas'
  | 'porcoes_e_petiscos'
  | 'bebidas_e_sucos'
  | 'sobremesas';

export interface IngredientOption {
  id: string;
  name: string;
  price: number;
  category: 'proteina' | 'queijo' | 'molho' | 'salada' | 'extra';
  calories?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  isPopular?: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  prepTimeMinutes: number;
  defaultIngredients: string[];
  removableIngredients: string[];
  availableExtras: IngredientOption[];
  salesCount?: number; // for most sold report
  isAvailable?: boolean;
}

export interface CustomizationSelection {
  removedIngredients: string[];
  addedExtras: { [extraId: string]: number }; // quantity
  meatDoneness?: 'mal_passado' | 'ao_ponto' | 'bem_passado';
  specialNotes?: string;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  customization: CustomizationSelection;
  unitPrice: number;
  totalPrice: number;
  isCustomBurger?: boolean;
  isLoyaltyReward?: boolean;
  customBurgerLayers?: {
    bread: string;
    protein: string;
    cheeses: string[];
    sauces: string[];
    toppings: string[];
  };
}

export type OrderStatus = 
  | 'recebido'
  | 'em_preparo'
  | 'pronto'
  | 'saiu_para_entrega'
  | 'entregue'
  | 'cancelado';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'carteira_digital' | 'dinheiro';

export type DeliveryMethod = 'entrega' | 'retirada';

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints?: number;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
    referencePoint?: string;
  };
}

export interface Order {
  id: string;
  customer: CustomerInfo;
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pendente' | 'aprovado';
  changeFor?: number;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime: string;
  notes?: string;
  deliveryCoords?: { lat: number; lng: number };
}

export interface BuildBurgerStepConfig {
  breads: { id: string; name: string; price: number; description: string; color: string }[];
  proteins: { id: string; name: string; price: number; description: string; color: string }[];
  cheeses: { id: string; name: string; price: number; description: string; color: string }[];
  sauces: { id: string; name: string; price: number; description: string; color: string }[];
  toppings: { id: string; name: string; price: number; description: string; color: string }[];
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: 'free_item' | 'discount_fixed' | 'free_shipping';
  discountValue?: number;
  menuItemId?: string;
  badge?: string;
}
