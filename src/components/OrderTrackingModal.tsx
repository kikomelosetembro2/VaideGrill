import React from 'react';
import {
  X,
  CheckCircle2,
  ChefHat,
  UtensilsCrossed,
  PackageCheck,
  Bike,
  Flag,
  RotateCcw,
  ReceiptText,
  BellRing,
  MessageCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import {
  ORDER_STATUS_LIST,
  ORDER_CATEGORY_LABELS,
  COMMON_EXTRAS,
  RESTAURANT_INFO,
} from '../data/menuData';
import { formatCurrency } from '../utils/helpers';
import { triggerWhatsAppKitchenComanda } from '../utils/whatsappReceipt';

interface OrderTrackingModalProps {
  order: Order | null;
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
  onClose: () => void;
  onOpenReceiptModal: () => void;
}

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pedido_aceito: <CheckCircle2 className="w-4 h-4" />,
  pedido_andamento: <ChefHat className="w-4 h-4" />,
  pedido_mesa: <UtensilsCrossed className="w-4 h-4" />,
  pedido_delivery: <PackageCheck className="w-4 h-4" />,
  pedido_entrega: <Bike className="w-4 h-4" />,
  pedido_finalizado: <Flag className="w-4 h-4" />,
  pedido_devolvido: <RotateCcw className="w-4 h-4" />,
};

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  orders,
  onSelectOrder,
  onClose,
  onOpenReceiptModal,
}) => {
  if (!order) return null;

  const currentStatusObj =
    ORDER_STATUS_LIST.find((s) => s.id === order.status) || ORDER_STATUS_LIST[0];
  const categoryInfo = ORDER_CATEGORY_LABELS[order.orderCategory];
  const isReadyOrFinished =
    order.status === 'pedido_mesa' ||
    order.status === 'pedido_delivery' ||
    order.status === 'pedido_entrega' ||
    order.status === 'pedido_finalizado' ||
    Boolean(order.readyNotifiedAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg text-[#111111]">
                Acompanhar Comanda {order.id}
              </h2>
              <span className="text-xs font-bold text-[#8A0000] tabular-nums">
                · {categoryInfo.label}
                {order.orderCategory === 'mesa' && order.tableNumber
                  ? ` (${order.tableNumber})`
                  : ''}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              {order.customer.name} · Registrado às {order.createdAt}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-[#111111]"
            aria-label="Fechar rastreamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Switch between recent orders if multiple */}
          {orders.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold uppercase text-neutral-500 shrink-0">
                Comandas recentes:
              </span>
              {orders.slice(0, 6).map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => onSelectOrder(ord.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 tabular-nums cursor-pointer ${
                    ord.id === order.id
                      ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                  }`}
                >
                  {ord.id}
                </button>
              ))}
            </div>
          )}

          {/* Ready Notification Alert Banner */}
          {isReadyOrFinished && order.status !== 'pedido_devolvido' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-[#D4A017] flex items-start gap-3">
              <BellRing className="w-5 h-5 text-[#8A0000] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-black text-[#111111] text-sm">
                  Seu pedido {order.id} está pronto / em atendimento!
                </p>
                <p className="text-neutral-700">
                  {order.orderCategory === 'delivery'
                    ? 'Pedido separado para delivery ou já em rota de entrega.'
                    : order.orderCategory === 'mesa'
                    ? `Pedido pronto para servir na Mesa ${order.tableNumber || 'indicada'}.`
                    : 'Pedido pronto para retirada no balcão do Quiosk da Preta.'}
                </p>
              </div>
            </div>
          )}

          {/* Current Comanda Status Card */}
          <div className="p-4 rounded-xl bg-[#111111] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#D4A017]">
                Posição Atual na Comanda
              </p>
              <p className="text-lg font-black mt-0.5">{currentStatusObj.label}</p>
              <p className="text-xs text-neutral-300">{currentStatusObj.description}</p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <p className="text-[11px] text-neutral-400">Total do Pedido</p>
              <p className="text-xl font-black text-[#D4A017] tabular-nums">
                {formatCurrency(order.total)}
              </p>
            </div>
          </div>

          {/* All 7 Comanda Statuses Timeline */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
              Posição do Status na Comanda (7 Etapas)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ORDER_STATUS_LIST.map((st, idx) => {
                const isCurrent = st.id === order.status;
                return (
                  <div
                    key={st.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${
                      isCurrent
                        ? 'bg-red-50 border-[#8A0000] text-[#111111]'
                        : 'bg-white border-neutral-200 text-neutral-500'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-[#8A0000] text-[#D4A017]'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {STATUS_ICONS[st.id]}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-extrabold truncate ${
                          isCurrent ? 'text-[#8A0000]' : 'text-neutral-700'
                        }`}
                      >
                        {idx + 1}. {st.label}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {st.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ordered Items & Add-ons Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
              Itens & Adicionais da Comanda
            </h3>
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200">
              {order.items.map((it) => {
                const extras = Object.entries(
                  it.customization.addedExtras || {}
                ).filter(([, q]) => q > 0);
                return (
                  <div key={it.cartItemId} className="p-3 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-[#111111]">
                      <span>
                        {it.quantity}x {it.menuItem.name}
                      </span>
                      <span className="tabular-nums">
                        {formatCurrency(it.totalPrice)}
                      </span>
                    </div>
                    {extras.length > 0 && (
                      <p className="text-neutral-600 text-[11px]">
                        Adicionais:{' '}
                        {extras
                          .map(([extId, q]) => {
                            const found =
                              it.menuItem.availableExtras?.find(
                                (e) => e.id === extId
                              ) || COMMON_EXTRAS.find((e) => e.id === extId);
                            return found ? `${q}x ${found.name}` : null;
                          })
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenReceiptModal}
            className="px-4 py-2.5 border border-neutral-300 hover:border-[#111111] bg-white rounded-lg text-xs font-bold text-[#111111] flex items-center gap-1.5 cursor-pointer"
          >
            <ReceiptText className="w-4 h-4 text-[#8A0000]" />
            <span>Ver Comanda Completa</span>
          </button>

          <button
            type="button"
            onClick={() => triggerWhatsAppKitchenComanda(order)}
            className="px-4 py-2.5 bg-[#8A0000] hover:bg-[#6E0000] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#D4A017]" />
            <span>Reenviar Comanda WhatsApp ({RESTAURANT_INFO.phone})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
