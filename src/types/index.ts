export type CategoryId =
  | 'todos'
  | 'espetinhos'
  | 'tira_gosto'
  | 'pratos_arabes'
  | 'rabada'
  | 'bebidas';

export interface IngredientOption {
  id: string;
  name: string;
  price: number;
  category: 'acompanhamento' | 'proteina' | 'bebida_extra' | 'embalagem';
}

export interface MenuItem {
  id: string;
  name: string;
  category: Exclude<CategoryId, 'todos'>;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  note?: string;
  supportsDoneness?: boolean;
  prepTimeMinutes: number;
  defaultIngredients: string[];
  removableIngredients: string[];
  availableExtras: IngredientOption[];
  salesCount?: number;
  isAvailable?: boolean;
}

export interface CustomizationSelection {
  removedIngredients: string[];
  addedExtras: { [extraId: string]: number };
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
}

export type OrderStatus =
  | 'pedido_aceito'
  | 'pedido_andamento'
  | 'pedido_mesa'
  | 'pedido_delivery'
  | 'pedido_entrega'
  | 'pedido_finalizado'
  | 'pedido_devolvido';

export type OrderCategory = 'delivery' | 'retirada' | 'mesa';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro';

export interface CustomerInfo {
  name: string;
  phone: string;
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
  id: string; // Ex: "#0001"
  orderNumber: number; // Sequential integer: 1, 2, 3...
  customer: CustomerInfo;
  items: CartItem[];
  orderCategory: OrderCategory;
  tableNumber?: string;
  deliveryFee: number;
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pendente' | 'aprovado';
  changeFor?: number;
  status: OrderStatus;
  createdAt: string;
  createdIso?: string;
  estimatedTime: string;
  notes?: string;
  readyNotifiedAt?: string;
}

export interface CustomerSpendingReport {
  customerKey: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  deliveryCount: number;
  retiradaCount: number;
  mesaCount: number;
  lastOrderAt: string;
  lastOrderId: string;
  topItem: string;
}

export interface EventReview {
  id: string;
  customerName: string;
  customerMode: 'mesa_presencial' | 'delivery_retirada';
  tableNumber?: string;
  orderId?: string;
  verifiedTableOrder?: boolean;
  rating: number;
  eventTitle?: string;
  comment: string;
  photoUrl?: string;
  createdAt: string;
  createdIso: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountAmount: number;
  minOrder: number;
  couponCode: string;
}

export interface LoyaltyRedemption {
  id: string;
  rewardId: string;
  title: string;
  couponCode: string;
  discountAmount: number;
  pointsSpent: number;
  redeemedAt: string;
}

export interface LoyaltyAccountState {
  phone: string;
  totalSpent: number;
  ordersCount: number;
  earnedPoints: number;
  redeemedPoints: number;
  balance: number;
  history: LoyaltyRedemption[];
}

export interface MonthlyPopularProductSummary {
  id: string;
  name: string;
  shortName: string;
  category: string;
  price: number;
  currentMonthQty: number;
  previousMonthQty: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  growthPercent: number;
  totalQty: number;
  totalRevenue: number;
}

export interface MonthlyComparativePoint {
  monthKey: string;
  monthLabel: string;
  [productOrKey: string]: string | number;
}

export interface MonthlySalesAnalytics {
  months: { monthKey: string; monthLabel: string }[];
  topProducts: MonthlyPopularProductSummary[];
  monthlyByProductUnits: MonthlyComparativePoint[];
  monthlyByProductRevenue: MonthlyComparativePoint[];
}

export type ConvenioCompanyStatus = 'ativo' | 'inativo' | 'fatura_atraso';
export type ConvenioBillingCycle = 'mensal' | 'quinzenal';
export type MarmitexPaymentStatus = 'pendente' | 'pago' | 'vencido';

export interface ConvenioCompany {
  id: string;
  companyName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  contractStartDate: string; // YYYY-MM-DD
  billingCycle: ConvenioBillingCycle;
  dueDay: number; // e.g. 5, 10, 15, 20...
  authorizedPersonName: string;
  authorizedPersonCpf: string;
  status: ConvenioCompanyStatus;
  createdAt: string;
}

export interface MarmitexPickup {
  id: string;
  companyId: string;
  companyName: string;
  companyCnpj: string;
  pickedUpByName: string;
  pickedUpByCpf: string;
  pickupDateTime: string; // YYYY-MM-DDTHH:mm
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  dueDate: string; // YYYY-MM-DD
  paymentStatus: MarmitexPaymentStatus;
  paidAt?: string;
  receiptNote?: string;
  createdIso: string;
}

export interface ConvenioDueAlert {
  companyId: string;
  companyName: string;
  companyCnpj: string;
  phone: string;
  email: string;
  dueDate: string;
  daysRemaining: number;
  alertLevel: 'vencido' | 'hoje' | 'em_2_dias' | 'em_3_dias';
  pendingQty: number;
  pendingAmount: number;
  pickupIds: string[];
}

export interface ConveniosConfig {
  unitPrice: number;
}

export interface VisitorDailyPoint {
  date: string;
  label: string;
  visits: number;
}

export interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  lastVisitIso?: string;
  last7Days: VisitorDailyPoint[];
}

