import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  UtensilsCrossed,
  Bike,
  Store,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CartItem,
  Order,
  OrderCategory,
  PaymentMethod,
} from '../types';
import { RESTAURANT_INFO, ORDER_CATEGORY_LABELS } from '../data/menuData';
import { formatCurrency, copyTextToClipboard } from '../utils/helpers';
import { generatePixCopiaECola } from '../utils/pixPayload';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  orderCategory: OrderCategory;
  onChangeOrderCategory: (cat: OrderCategory) => void;
  tableNumber: string;
  onChangeTableNumber: (val: string) => void;
  selectedNeighborhood: string;
  deliveryFee: number;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  onOrderCreated: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  orderCategory,
  onChangeOrderCategory,
  tableNumber,
  onChangeTableNumber,
  selectedNeighborhood,
  deliveryFee,
  subtotal,
  discountAmount,
  couponCode,
  total,
  onOrderCreated,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [referencePoint, setReferencePoint] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [changeFor, setChangeFor] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixCodeCopied, setPixCodeCopied] = useState(false);
  const [pixKeyCopied, setPixKeyCopied] = useState(false);
  const [pixConfirmed, setPixConfirmed] = useState(false);

  const [sessionTxid] = useState(() =>
    `QP${Date.now().toString(36).toUpperCase().slice(-6)}`
  );

  const pixCopiaECola = useMemo(
    () =>
      generatePixCopiaECola({
        pixKey: RESTAURANT_INFO.pixKey,
        merchantName: RESTAURANT_INFO.pixBeneficiary,
        merchantCity: RESTAURANT_INFO.city,
        amount: total,
        txid: `${sessionTxid}${Math.round(Math.max(0, total) * 100)}`.slice(0, 25),
      }),
    [total, sessionTxid]
  );

  if (!isOpen) return null;

  const handleCopyPixCode = async (e?: React.SyntheticEvent<HTMLInputElement | HTMLButtonElement>) => {
    if (e && e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.select();
    }
    const ok = await copyTextToClipboard(pixCopiaECola);
    if (ok) {
      setPixCodeCopied(true);
      window.setTimeout(() => setPixCodeCopied(false), 2600);
    }
  };

  const handleCopyPixKey = async (e?: React.SyntheticEvent<HTMLInputElement | HTMLButtonElement>) => {
    if (e && e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.select();
    }
    const ok = await copyTextToClipboard(RESTAURANT_INFO.pixKey);
    if (ok) {
      setPixKeyCopied(true);
      window.setTimeout(() => setPixKeyCopied(false), 2600);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (name.trim().length < 2) {
      setErrorMsg('Informe o nome completo do cliente.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 8) {
      setErrorMsg('Informe um telefone ou WhatsApp válido para receber notificações.');
      return;
    }
    if (orderCategory === 'delivery' && (!street.trim() || !number.trim())) {
      setErrorMsg('Informe rua e número para a entrega via Delivery.');
      return;
    }
    if (orderCategory === 'mesa' && !tableNumber.trim()) {
      setErrorMsg('Informe o número da mesa para atendimento presencial.');
      return;
    }

    const parsedChange = changeFor ? Number(changeFor.replace(',', '.')) : undefined;

    const computedPaymentStatus: 'aprovado' | 'pendente' =
      paymentMethod === 'pix' && pixConfirmed ? 'aprovado' : 'pendente';

    setIsSubmitting(true);
    try {
      const payload = {
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          ...(orderCategory === 'delivery'
            ? {
                address: {
                  street: street.trim(),
                  number: number.trim(),
                  neighborhood: selectedNeighborhood,
                  city: RESTAURANT_INFO.city,
                  state: RESTAURANT_INFO.state,
                  complement: complement.trim() || undefined,
                  referencePoint: referencePoint.trim() || undefined,
                },
              }
            : {}),
        },
        items,
        orderCategory,
        tableNumber: orderCategory === 'mesa' ? tableNumber.trim() : undefined,
        deliveryFee: orderCategory === 'delivery' ? deliveryFee : 0,
        subtotal,
        discount: discountAmount,
        couponCode,
        total,
        paymentMethod,
        paymentStatus: computedPaymentStatus,
        changeFor:
          paymentMethod === 'dinheiro' && parsedChange && parsedChange > total
            ? parsedChange
            : undefined,
        notes: notes.trim() || undefined,
      };

      let createdOrder: Order | null = null;
      let apiValidationError: string | null = null;

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const rawText = await res.text();
        let parsed: { order?: Order; error?: string } | null = null;
        try {
          parsed = rawText ? (JSON.parse(rawText) as { order?: Order; error?: string }) : null;
        } catch {
          parsed = null;
        }

        if (res.ok && parsed?.order) {
          createdOrder = parsed.order;
        } else if (parsed?.error && res.status >= 400 && res.status < 500 && res.status !== 404) {
          apiValidationError = parsed.error;
        }
      } catch {
        // Network error — fallback locally below
      }

      if (apiValidationError) {
        throw new Error(apiValidationError);
      }

      let finalOrder: Order;
      if (createdOrder) {
        finalOrder = createdOrder;
      } else {
        // Resilient local order creation when API returns non-JSON (e.g., static preview / offline)
        let nextNum = 1;
        try {
          const savedCounter = Number(localStorage.getItem('quiosk_local_order_counter') || '0');
          nextNum = Math.max(1, (Number.isFinite(savedCounter) ? savedCounter : 0) + 1);
          localStorage.setItem('quiosk_local_order_counter', String(nextNum));
        } catch {
          nextNum = Math.floor(100 + Math.random() * 899);
        }

        const now = new Date();
        finalOrder = {
          id: `#${String(nextNum).padStart(4, '0')}`,
          orderNumber: nextNum,
          customer: payload.customer,
          items: payload.items,
          orderCategory: payload.orderCategory,
          tableNumber: payload.tableNumber,
          deliveryFee: payload.deliveryFee,
          subtotal: payload.subtotal,
          discount: payload.discount,
          couponCode: payload.couponCode,
          total: payload.total,
          paymentMethod: payload.paymentMethod,
          paymentStatus: computedPaymentStatus,
          changeFor: payload.changeFor,
          status: 'pedido_aceito',
          createdAt: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          createdIso: now.toISOString(),
          estimatedTime: payload.orderCategory === 'delivery' ? '30 - 45 min' : '15 - 25 min',
          notes: payload.notes,
        };

        try {
          const rawExisting = localStorage.getItem('quiosk_local_orders');
          const existing: Order[] = rawExisting ? JSON.parse(rawExisting) : [];
          localStorage.setItem(
            'quiosk_local_orders',
            JSON.stringify([finalOrder, ...existing].slice(0, 30))
          );
        } catch {
          // ignore storage quota issues
        }
      }

      onOrderCreated(finalOrder);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao finalizar pedido. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg text-[#111111]">
              Finalizar Pedido · {RESTAURANT_INFO.name}
            </h2>
            <p className="text-xs text-neutral-500">
              A numeração da comanda é gerada automaticamente e enviada para a cozinha via WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-[#111111]"
            aria-label="Fechar checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-[#8A0000] text-xs font-bold text-[#8A0000]">
              {errorMsg}
            </div>
          )}

          {/* 1. Customer Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
              1. Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#8A0000]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  WhatsApp / Telefone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(68) 99999-9999"
                    className="w-full pl-9 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-[#111111] tabular-nums focus:outline-none focus:border-[#8A0000]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Category Confirmation */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
              2. Categoria do Atendimento ({ORDER_CATEGORY_LABELS[orderCategory].label})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'delivery' as OrderCategory, label: 'Delivery', icon: Bike },
                { id: 'retirada' as OrderCategory, label: 'Retirada', icon: Store },
                { id: 'mesa' as OrderCategory, label: 'Mesa Presencial', icon: UtensilsCrossed },
              ].map((cat) => {
                const Icon = cat.icon;
                const active = orderCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onChangeOrderCategory(cat.id)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {orderCategory === 'delivery' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Rua / Avenida *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Nome da rua"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-[#111111]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Ex: 120"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Bairro Selecionado
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedNeighborhood}
                    className="w-full px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-xs text-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Casa, Apto, Bloco"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-[#111111]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={referencePoint}
                    onChange={(e) => setReferencePoint(e.target.value)}
                    placeholder="Próx. ao mercado..."
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-[#111111]"
                  />
                </div>
              </div>
            )}

            {orderCategory === 'mesa' && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-[#D4A017]">
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Número ou Identificação da Mesa *
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => onChangeTableNumber(e.target.value)}
                  placeholder="Ex: Mesa 05"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-bold text-[#111111]"
                />
              </div>
            )}

            {orderCategory === 'retirada' && (
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700">
                Retirada diretamente no balcão do <strong>{RESTAURANT_INFO.name}</strong> ({RESTAURANT_INFO.openingHours}). Você receberá um alerta quando o pedido estiver pronto.
              </div>
            )}
          </div>

          {/* 3. Payment Method */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
              3. Forma de Pagamento
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'pix' as PaymentMethod, label: 'Pix', icon: QrCode },
                { id: 'cartao_credito' as PaymentMethod, label: 'Crédito', icon: CreditCard },
                { id: 'cartao_debito' as PaymentMethod, label: 'Débito', icon: CreditCard },
                { id: 'dinheiro' as PaymentMethod, label: 'Dinheiro', icon: Banknote },
              ].map((pm) => {
                const Icon = pm.icon;
                const active = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#8A0000] text-white border-[#8A0000]'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {paymentMethod === 'pix' && (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Code Dinâmico Display Box */}
                  <div className="p-3 bg-white border-2 border-[#111111] rounded-xl shrink-0 flex flex-col items-center gap-2 shadow-sm">
                    <QRCodeSVG
                      value={pixCopiaECola}
                      size={152}
                      level="M"
                      includeMargin={false}
                      bgColor="#FFFFFF"
                      fgColor="#111111"
                    />
                    <div className="text-center">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                        QR Code Pix Dinâmico
                      </span>
                      <span className="block text-xs font-black text-[#8A0000] tabular-nums">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  {/* Pix Copia e Cola Field + Key Copy */}
                  <div className="flex-1 w-full space-y-3 text-xs">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-extrabold text-[#111111] text-sm">
                          Pague agora com Pix Dinâmico
                        </p>
                        <span className="px-2 py-0.5 rounded bg-[#111111] text-[#D4A017] text-[10px] font-extrabold uppercase tracking-wider">
                          Valor Automático
                        </span>
                      </div>
                      <p className="text-neutral-600 mt-1 leading-relaxed">
                        Escaneie o QR Code no aplicativo do seu banco ou clique no campo abaixo para copiar o código Pix Copia e Cola no valor exato de{' '}
                        <strong className="text-[#8A0000] tabular-nums">
                          {formatCurrency(total)}
                        </strong>
                        {orderCategory === 'delivery' && deliveryFee > 0
                          ? ` (inclui entrega de ${formatCurrency(deliveryFee)})`
                          : ''}
                        .
                      </p>
                    </div>

                    {/* Campo de Texto Clicável: Código Pix Copia e Cola */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor="pix-copia-e-cola-input"
                          className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700"
                        >
                          Pix Copia e Cola (clique no campo para copiar)
                        </label>
                        {pixCodeCopied && (
                          <span className="text-[11px] font-extrabold text-emerald-700">
                            Copiado com sucesso!
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="pix-copia-e-cola-input"
                          type="text"
                          readOnly
                          value={pixCopiaECola}
                          onClick={handleCopyPixCode}
                          title="Clique para copiar o código Pix Copia e Cola"
                          className={`flex-1 px-3 py-2.5 bg-white border rounded-lg font-mono text-[11px] text-[#111111] select-all cursor-pointer transition-colors ${
                            pixCodeCopied
                              ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                              : 'border-neutral-300 hover:border-[#8A0000]'
                          }`}
                          aria-label="Campo clicável para copiar Código Pix Copia e Cola"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPixCode}
                          className={`px-4 py-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                            pixCodeCopied
                              ? 'bg-emerald-700 text-white'
                              : 'bg-[#8A0000] hover:bg-[#6E0000] text-white'
                          }`}
                        >
                          {pixCodeCopied ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#D4A017]" />
                          )}
                          <span>
                            {pixCodeCopied ? 'Copiado!' : 'Copiar Pix'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Campo Clicável da Chave Pix Celular */}
                    <div className="pt-2 border-t border-neutral-200 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-neutral-600">
                          Favorecido: <strong className="text-[#111111]">{RESTAURANT_INFO.pixBeneficiary}</strong>
                        </p>
                        {pixKeyCopied && (
                          <span className="text-[11px] font-extrabold text-emerald-700">
                            Chave copiada!
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={RESTAURANT_INFO.pixKey}
                          onClick={handleCopyPixKey}
                          title="Clique para copiar a chave Pix celular"
                          aria-label="Chave Pix celular clicável"
                          className={`flex-1 px-3 py-1.5 bg-white border rounded-lg font-mono text-xs font-bold text-[#111111] tabular-nums cursor-pointer transition-colors ${
                            pixKeyCopied
                              ? 'border-emerald-600 bg-emerald-50/40'
                              : 'border-neutral-300 hover:border-[#111111]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleCopyPixKey}
                          className="px-3 py-1.5 bg-[#111111] hover:bg-neutral-800 text-[#D4A017] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {pixKeyCopied ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {pixKeyCopied ? 'Chave Copiada!' : 'Copiar Chave Pix'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirmação pelo Cliente */}
                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-white border border-neutral-200 cursor-pointer hover:border-[#8A0000] transition-colors">
                  <input
                    type="checkbox"
                    checked={pixConfirmed}
                    onChange={(e) => setPixConfirmed(e.target.checked)}
                    className="w-4 h-4 accent-[#8A0000]"
                  />
                  <span className="text-xs font-bold text-[#111111]">
                    Já efetuei o pagamento via Pix e quero confirmar na comanda
                  </span>
                </label>
              </div>
            )}

            {paymentMethod === 'dinheiro' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Precisa de troco para quanto? (Opcional)
                </label>
                <input
                  type="text"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  placeholder="Ex: 100,00"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-[#111111] tabular-nums"
                />
              </div>
            )}
          </div>

          {/* 4. General Notes */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111] mb-1">
              Observação Geral da Comanda (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Alguma instrução especial para entrega ou cozinha?"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-[#111111]"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-500">Total da Comanda</p>
              <p className="text-xl font-black text-[#8A0000] tabular-nums">
                {formatCurrency(total)}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#8A0000] hover:bg-[#6E0000] disabled:opacity-60 text-white font-extrabold py-3.5 px-6 rounded-lg text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />
              <span>
                {isSubmitting
                  ? 'Gerando Comanda...'
                  : 'Confirmar & Enviar Comanda via WhatsApp'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
