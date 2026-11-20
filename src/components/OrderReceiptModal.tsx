import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Printer,
  Copy,
  Check,
  Navigation,
  ReceiptText,
} from 'lucide-react';
import { Order } from '../types';
import {
  RESTAURANT_INFO,
  COMMON_EXTRAS,
  ORDER_STATUS_LIST,
  ORDER_CATEGORY_LABELS,
} from '../data/menuData';
import {
  formatKitchenComandaWhatsApp,
  triggerWhatsAppKitchenComanda,
} from '../utils/whatsappReceipt';
import { formatCurrency } from '../utils/helpers';
import { QuioskLogo } from './QuioskLogo';

interface OrderReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTracking: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenTracking,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const statusInfo =
    ORDER_STATUS_LIST.find((s) => s.id === order.status) || ORDER_STATUS_LIST[0];
  const categoryInfo = ORDER_CATEGORY_LABELS[order.orderCategory];

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(formatKitchenComandaWhatsApp(order));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <ReceiptText className="w-5 h-5 text-[#8A0000]" />
            <div>
              <h2 className="font-black text-base text-[#111111]">
                Comanda da Cozinha {order.id}
              </h2>
              <p className="text-xs text-neutral-500">
                Numeração automática #{order.orderNumber} · {categoryInfo.label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-[#111111]"
            aria-label="Fechar comanda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Comanda Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-neutral-50">
          <div className="bg-white border border-neutral-300 rounded-xl p-5 space-y-4 font-mono text-xs text-[#111111]">
            <div className="flex items-center justify-between border-b border-dashed border-neutral-300 pb-3">
              <QuioskLogo size="sm" />
              <div className="text-right">
                <p className="font-black text-base text-[#8A0000] tabular-nums">
                  {order.id}
                </p>
                <p className="text-[11px] text-neutral-500 tabular-nums">
                  {order.createdAt}
                </p>
              </div>
            </div>

            {/* Category & Status Position on Comanda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-dashed border-neutral-300 pb-3">
              <div className="p-2.5 rounded-lg bg-neutral-100 border border-neutral-200">
                <p className="text-[10px] uppercase text-neutral-500 font-bold">
                  Categoria do Pedido
                </p>
                <p className="font-black text-xs text-[#111111]">
                  {categoryInfo.label}
                  {order.orderCategory === 'mesa' && order.tableNumber
                    ? ` · Mesa ${order.tableNumber}`
                    : ''}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-[#D4A017]">
                <p className="text-[10px] uppercase text-neutral-600 font-bold">
                  Status na Comanda
                </p>
                <p className="font-black text-xs text-[#8A0000]">
                  {statusInfo.label}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-1 border-b border-dashed border-neutral-300 pb-3">
              <p className="font-bold uppercase text-[11px] text-neutral-500">
                Cliente
              </p>
              <p className="font-bold">
                {order.customer.name} · <span className="tabular-nums">{order.customer.phone}</span>
              </p>
              {order.orderCategory === 'delivery' && order.customer.address && (
                <p className="text-neutral-700">
                  Entrega: {order.customer.address.street}, Nº {order.customer.address.number} —{' '}
                  {order.customer.address.neighborhood}
                  {order.customer.address.complement
                    ? ` (${order.customer.address.complement})`
                    : ''}
                </p>
              )}
            </div>

            {/* Products & Add-ons */}
            <div className="space-y-2.5 border-b border-dashed border-neutral-300 pb-3">
              <p className="font-bold uppercase text-[11px] text-neutral-500">
                Produtos e Adicionais da Comanda
              </p>
              {order.items.map((item) => {
                const extras = Object.entries(
                  item.customization.addedExtras || {}
                ).filter(([, q]) => q > 0);

                return (
                  <div key={item.cartItemId} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span className="tabular-nums">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                    {item.customization.meatDoneness && (
                      <p className="pl-3 text-[11px] text-neutral-600">
                        • Ponto: {item.customization.meatDoneness.replace('_', ' ')}
                      </p>
                    )}
                    {item.customization.removedIngredients.length > 0 && (
                      <p className="pl-3 text-[11px] text-[#8A0000]">
                        • Remover: {item.customization.removedIngredients.join(', ')}
                      </p>
                    )}
                    {extras.map(([extId, qty]) => {
                      const ext =
                        item.menuItem.availableExtras?.find((e) => e.id === extId) ||
                        COMMON_EXTRAS.find((e) => e.id === extId);
                      if (!ext) return null;
                      return (
                        <p key={extId} className="pl-3 text-[11px] text-[#111111]">
                          + Adicional: {qty}x {ext.name} ({formatCurrency(ext.price * qty)})
                        </p>
                      );
                    })}
                    {item.customization.specialNotes && (
                      <p className="pl-3 text-[11px] italic text-neutral-600">
                        • Obs: {item.customization.specialNotes}
                      </p>
                    )}
                  </div>
                );
              })}

              {order.notes && (
                <p className="pt-1 text-[11px] font-bold text-[#8A0000]">
                  Obs. Geral: {order.notes}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.orderCategory === 'delivery' && (
                <div className="flex justify-between">
                  <span>Taxa Delivery</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.deliveryFee)}
                  </span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Desconto</span>
                  <span className="tabular-nums">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-neutral-200">
                <span>TOTAL ({order.paymentMethod.toUpperCase()})</span>
                <span className="tabular-nums text-[#8A0000]">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200 bg-white space-y-2.5 no-print">
          <button
            type="button"
            onClick={() => triggerWhatsAppKitchenComanda(order)}
            className="w-full bg-[#8A0000] hover:bg-[#6E0000] text-white font-extrabold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#D4A017]" />
            <span>
              Enviar Comanda para Cozinha via WhatsApp ({RESTAURANT_INFO.phone})
            </span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 border border-neutral-300 hover:border-[#111111] rounded-lg text-xs font-bold text-[#111111] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiada!' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="py-2.5 px-3 border border-neutral-300 hover:border-[#111111] rounded-lg text-xs font-bold text-[#111111] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onOpenTracking}
              className="py-2.5 px-3 bg-[#111111] text-[#D4A017] hover:bg-neutral-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Status</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
