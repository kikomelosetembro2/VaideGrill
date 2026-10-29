import React, { useState } from 'react';
import { 
  X, 
  MessageCircle, 
  Copy, 
  Check, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Flame, 
  MapPin, 
  Phone, 
  Store, 
  Bike,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { RESTAURANT_INFO } from '../data/menuData';
import { generateWhatsAppReceipt, openWhatsAppOrder } from '../utils/whatsappReceipt';
import { formatCurrency, playSound } from '../utils/helpers';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface OrderReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTracking?: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenTracking,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const receiptRawText = generateWhatsAppReceipt(order);

  const handleCopy = () => {
    playSound('ding');
    navigator.clipboard.writeText(receiptRawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendToWhatsApp = () => {
    playSound('success');
    openWhatsAppOrder(order);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1c0c11] border border-[#eab308]/50 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-black flex items-center justify-center font-black shadow-lg">
              <MessageCircle className="w-6 h-6 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Comprovante para a Cozinha (WhatsApp)
                </h2>
                <span className="bg-[#eab308] text-black text-[10px] font-black px-2 py-0.5 rounded">
                  Pedido #{order.id}
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Envie o comprovante direto para a produção da Lanchonete Vai de Grill!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-[#6b0f1a] text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Callout Action Banner */}
        <div className="bg-gradient-to-r from-[#128C7E] to-[#25D366] text-black p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <MessageCircle className="w-6 h-6 fill-black shrink-0" />
            <div>
              <span className="font-black text-xs uppercase tracking-wider block">
                Envio Imediato para a Cozinha
              </span>
              <p className="text-xs font-bold text-black/90">
                Ao clicar abaixo, o WhatsApp abrirá com o pedido pré-formatado para o telefone <strong>(68) 99227-7408</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendToWhatsApp}
            className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-zinc-900 text-white font-black text-xs rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366] fill-[#25D366]" />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>

        {/* Content: Formatted Digital Receipt Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Quick Copy / Print Toolbar */}
          <div className="flex items-center justify-between gap-2 bg-[#240e15] p-2.5 rounded-2xl border border-zinc-800">
            <span className="text-[11px] font-bold text-zinc-300">
              Visualização da Comanda de Cozinha:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 bg-[#18080c] hover:bg-[#eab308] hover:text-black text-white font-bold text-xs rounded-xl transition-colors border border-zinc-700 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-[#18080c] hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl transition-colors border border-zinc-700 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Formatted Receipt Box (Terminal / Paper style) */}
          <div className="bg-[#12080a] border border-[#eab308]/40 rounded-2xl p-4 sm:p-5 font-mono text-[11px] text-zinc-200 leading-relaxed space-y-3 shadow-inner overflow-x-auto">
            {/* Logo and store title */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#eab308]/40">
              <div className="flex justify-center pb-1">
                <VaiDeGrillLogo size="sm" />
              </div>
              <div className="font-black text-sm text-[#eab308]">
                LANCHONETE VAI DE GRILL
              </div>
              <div className="text-zinc-400 text-[10px]">
                {RESTAURANT_INFO.address} - Rio Branco, AC<br />
                Delivery WhatsApp: {RESTAURANT_INFO.phone}
              </div>
              <div className="pt-2 font-black text-xs text-white">
                COMPROVANTE OFICIAL DE COZINHA • PEDIDO #{order.id}
              </div>
              <div className="text-[10px] text-zinc-400">
                Horário do Pedido: {order.createdAt}
              </div>
            </div>

            {/* Customer & Delivery Mode */}
            <div className="pb-2 border-b border-dashed border-zinc-800 space-y-0.5">
              <div><strong className="text-[#eab308]">CLIENTE:</strong> {order.customer.name}</div>
              <div><strong className="text-[#eab308]">FONE:</strong> {order.customer.phone}</div>
              <div>
                <strong className="text-[#eab308]">TIPO:</strong>{' '}
                {order.deliveryMethod === 'entrega' ? 'DELIVERY MOTOBOY (RIO BRANCO)' : 'RETIRADA NO BALCÃO (JOÃO EDUARDO)'}
              </div>
              {order.customer.address && (
                <div className="text-zinc-300">
                  <strong>ENDEREÇO:</strong> {order.customer.address.street}, Nº {order.customer.address.number}<br />
                  <strong>BAIRRO:</strong> {order.customer.address.neighborhood}<br />
                  {order.customer.address.complement && <><strong>COMPLEMENTO:</strong> {order.customer.address.complement}<br /></>}
                  {order.customer.address.referencePoint && <><strong>REFERÊNCIA:</strong> {order.customer.address.referencePoint}</>}
                </div>
              )}
            </div>

            {/* Items and Custom Comandas */}
            <div className="space-y-2 pb-2 border-b border-dashed border-zinc-800">
              <div className="font-black text-[#eab308] flex justify-between">
                <span>ITENS DO PEDIDO</span>
                <span>SUBTOTAL</span>
              </div>

              {order.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5 bg-[#1a0b0e] p-2 rounded border border-zinc-850">
                  <div className="flex justify-between font-bold text-white">
                    <span>{it.quantity}x {it.menuItem.name}</span>
                    <span className="text-[#eab308]">{formatCurrency(it.totalPrice)}</span>
                  </div>

                  {it.customization.meatDoneness && (
                    <div className="text-amber-300 font-bold">
                      &gt;&gt; PONTO NA GRELHA: {it.customization.meatDoneness.replace('_', ' ').toUpperCase()}
                    </div>
                  )}

                  {it.customization.removedIngredients && it.customization.removedIngredients.length > 0 && (
                    <div className="text-red-400 font-bold">
                      &gt;&gt; REMOVER: {it.customization.removedIngredients.join(', ')}
                    </div>
                  )}

                  {Object.entries(it.customization.addedExtras || {}).map(([id, q]) => {
                    const extra = it.menuItem.availableExtras.find((e) => e.id === id);
                    return extra ? (
                      <div key={id} className="text-emerald-400 font-bold">
                        &gt;&gt; ADICIONAL: +{q}x {extra.name} (+{formatCurrency(extra.price * q)})
                      </div>
                    ) : null;
                  })}

                  {it.isCustomBurger && it.customBurgerLayers && (
                    <div className="text-[10px] text-zinc-300 pt-0.5">
                      Pão: {it.customBurgerLayers.bread} | Carne: {it.customBurgerLayers.protein} | Queijos: {it.customBurgerLayers.cheeses.join(', ') || 'Nenhum'} | Molhos: {it.customBurgerLayers.sauces.join(', ') || 'Nenhum'}
                    </div>
                  )}

                  {it.customization.specialNotes && (
                    <div className="text-amber-200 italic font-bold">
                      &gt;&gt; OBS: &quot;{it.customization.specialNotes}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 pb-2 border-b border-dashed border-zinc-800">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de Entrega:</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Desconto ({order.couponCode || 'Cupom'}):</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-[#eab308] pt-1 border-t border-zinc-800">
                <span>VALOR TOTAL:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="text-zinc-300 pt-0.5">
                PAGAMENTO: <strong className="text-white uppercase">{order.paymentMethod.replace('_', ' ')}</strong>
                {order.changeFor && ` (Troco para R$ ${order.changeFor.toFixed(2)})`}
              </div>
            </div>

            <div className="text-center text-[10px] text-zinc-400 pt-1">
              *** Comprovante enviado via WhatsApp para a cozinha Vai de Grill ***
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Comprovante Copiado!' : 'Copiar Texto para WhatsApp'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenTracking && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTracking();
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
              >
                Rastrear no Mapa
              </button>
            )}

            <button
              type="button"
              onClick={handleSendToWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd59] text-black px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>Abrir no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
