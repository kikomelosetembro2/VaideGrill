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
import { formatCurrency } from '../utils/helpers';
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

  const pixCopiaECola = useMemo(
    () =>
      generatePixCopiaECola({
        pixKey: RESTAURANT_INFO.pixKey,
        merchantName: RESTAURANT_INFO.pixBeneficiary,
        merchantCity: RESTAURANT_INFO.city,
        amount: total,
        txid: 'QUIOSKDAPRETA',
      }),
    [total]
  );

  if (!isOpen) return null;

  const handleCopyPixCode = () => {
    try {
      navigator.clipboard.writeText(pixCopiaECola);
      setPixCodeCopied(true);
      setTimeout(() => setPixCodeCopied(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCopyPixKey = () => {
    try {
      navigator.clipboard.writeText(RESTAURANT_INFO.pixKey);
      setPixKeyCopied(true);
      setTimeout(() => setPixKeyCopied(false), 2500);
    } catch {
      // ignore clipboard errors
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
        paymentStatus:
          paymentMethod === 'pix' && pixConfirmed ? 'aprovado' : 'pendente',
        changeFor:
          paymentMethod === 'dinheiro' && parsedChange && parsedChange > total
            ? parsedChange
            : undefined,
        notes: notes.trim() || undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.order) {
        throw new Error(data.error || 'Não foi possível registrar o pedido.');
      }

      onOrderCreated(data.order as Order);
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
                  {/* QR Code Display Box */}
                  <div className="p-3 bg-white border border-neutral-300 rounded-xl shrink-0 flex flex-col items-center gap-1.5">
                    <QRCodeSVG
                      value={pixCopiaECola}
                      size={140}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#111111"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      QR Code Pix · {formatCurrency(total)}
                    </span>
                  </div>

                  {/* Pix Copia e Cola Field + Key Copy */}
                  <div className="flex-1 w-full space-y-3 text-xs">
                    <div>
                      <p className="font-extrabold text-[#111111] text-sm">
                        Pague via Pix Copia e Cola
                      </p>
                      <p className="text-neutral-600 mt-0.5">
                        Escaneie o QR Code no aplicativo do seu banco ou copie o código Pix abaixo com o valor exato de{' '}
                        <strong className="text-[#8A0000] tabular-nums">
                          {formatCurrency(total)}
                        </strong>
                        .
                      </p>
                    </div>

                    {/* Campo Código Pix Copia e Cola */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                        Código Pix Copia e Cola
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          readOnly
                          value={pixCopiaECola}
                          onFocus={(e) => e.currentTarget.select()}
                          className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono text-[11px] text-[#111111] select-all"
                          aria-label="Código Pix Copia e Cola"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPixCode}
                          className="px-4 py-2 bg-[#8A0000] hover:bg-[#6E0000] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                        >
                          {pixCodeCopied ? (
                            <Check className="w-3.5 h-3.5 text-[#D4A017]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#D4A017]" />
                          )}
                          <span>
                            {pixCodeCopied ? 'Código Copiado!' : 'Copiar Pix'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Chave Pix Direta + Botão Automático */}
                    <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#111111]">
                          Chave Celular:{' '}
                          <span className="tabular-nums">{RESTAURANT_INFO.phone}</span>
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          Favorecido: {RESTAURANT_INFO.pixBeneficiary}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyPixKey}
                        className="px-3 py-1.5 bg-[#111111] hover:bg-neutral-800 text-[#D4A017] rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
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
