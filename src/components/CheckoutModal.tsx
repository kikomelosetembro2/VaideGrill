import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Copy, 
  Check, 
  MapPin, 
  User, 
  Phone, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  CartItem, 
  DeliveryMethod, 
  Order, 
  PaymentMethod 
} from '../types';
import { RESTAURANT_INFO } from '../data/menuData';
import { formatCurrency, playSound } from '../utils/helpers';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  deliveryMethod: DeliveryMethod;
  selectedNeighborhood: string;
  deliveryFee: number;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  currentUser: { name: string; phone: string } | null;
  onOrderCreated: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  deliveryMethod,
  selectedNeighborhood,
  deliveryFee,
  subtotal,
  discountAmount,
  couponCode,
  total,
  currentUser,
  onOrderCreated,
}) => {
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Cliente Vai de Grill');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '(68) 99224-9224');
  const [street, setStreet] = useState('Rua A');
  const [streetNumber, setStreetNumber] = useState('1176');
  const [complement, setComplement] = useState('');
  const [referencePoint, setReferencePoint] = useState('Próximo à praça do João Eduardo');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [pixCopied, setPixCopied] = useState(false);
  const [pixSimulatedSuccess, setPixSimulatedSuccess] = useState(false);

  // Credit Card fields
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 5521');
  const [cardHolder, setCardHolder] = useState('CLIENTE VAI DE GRILL');
  const [cardExpiry, setCardExpiry] = useState('10/29');
  const [cardCvv, setCardCvv] = useState('789');

  // Cash change
  const [needsChange, setNeedsChange] = useState(false);
  const [changeForAmount, setChangeForAmount] = useState<string>('50.00');

  if (!isOpen) return null;

  const pointsToEarn = Math.floor(total);

  // Pix string simulation
  const pixCodeString = `00020126580014BR.GOV.BCB.PIX0136${RESTAURANT_INFO.whatsappRaw}520400005303986540${total.toFixed(2)}5802BR5925VAI DE GRILL ARTESANAIS6009RIO BRANCO62070503***6304D1B8`;

  const handleCopyPix = () => {
    playSound('ding');
    navigator.clipboard.writeText(pixCodeString);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handleCompleteOrder = () => {
    playSound('success');

    try {
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#eab308', '#ca8a04', '#6b0f1a', '#ffffff'],
      });
    } catch {
      // ignore
    }

    const newOrder: Order = {
      id: `GRILL-${Math.floor(1000 + Math.random() * 9000)}`,
      customer: {
        name: customerName,
        phone: customerPhone,
        address: deliveryMethod === 'entrega' ? {
          street,
          number: streetNumber,
          neighborhood: selectedNeighborhood,
          city: 'Rio Branco',
          state: 'Acre',
          complement,
          referencePoint,
        } : undefined,
      },
      items,
      deliveryMethod,
      deliveryFee,
      subtotal,
      discount: discountAmount,
      couponCode,
      loyaltyPointsEarned: pointsToEarn,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'pix' && !pixSimulatedSuccess ? 'pendente' : 'aprovado',
      changeFor: needsChange ? parseFloat(changeForAmount) : undefined,
      status: 'recebido',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      estimatedDeliveryTime: deliveryMethod === 'entrega' ? '25 - 40 min' : '15 - 20 min',
    };

    onOrderCreated(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#1c0c11] border border-[#eab308]/40 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <VaiDeGrillLogo size="sm" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Finalizar Pedido na Brasa</h2>
              <p className="text-xs text-zinc-300">
                {RESTAURANT_INFO.name} • {RESTAURANT_INFO.address}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar checkout"
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-[#6b0f1a] text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Section 1: Customer Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#eab308]" />
              <span>1. Seus Dados de Contato</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-[#eab308]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Telefone / WhatsApp com DDD (Acre 68)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(68) 99224-9224"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-[#eab308]"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address in Rio Branco */}
          {deliveryMethod === 'entrega' ? (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#eab308]" />
                <span>2. Endereço de Entrega em Rio Branco</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Rua / Avenida
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-[#eab308]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={streetNumber}
                    onChange={(e) => setStreetNumber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-[#eab308]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Bairro Selecionado
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedNeighborhood} (Acre)`}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-[#eab308] font-black opacity-90 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Casa, Bloco, Apto..."
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#eab308]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={referencePoint}
                    onChange={(e) => setReferencePoint(e.target.value)}
                    placeholder="Ex: Próximo à praça ou comércio..."
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#eab308]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#240e15] rounded-2xl border border-zinc-800 text-xs space-y-1">
              <span className="font-bold text-[#eab308] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Retirada no Balcão Grátis:
              </span>
              <p className="text-zinc-200 font-bold">
                {RESTAURANT_INFO.name} — {RESTAURANT_INFO.address}, Rio Branco, Acre
              </p>
            </div>
          )}

          {/* Section 3: Payment Method Selection */}
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#eab308]" />
                <span>3. Forma de Pagamento</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Selecione o meio de pagamento preferido:
              </p>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'pix', label: 'Pix Instantâneo', icon: QrCode, badge: 'Mais Rápido' },
                { id: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
                { id: 'carteira_digital', label: 'Apple / Google Pay', icon: Smartphone },
                { id: 'dinheiro', label: 'Dinheiro na Entrega', icon: Banknote },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      playSound('ding');
                      setPaymentMethod(m.id as any);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all relative flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#6b0f1a] border-[#eab308] ring-2 ring-[#eab308]/40 text-white'
                        : 'bg-[#240e15] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    {m.badge && (
                      <span className="absolute -top-2 bg-[#eab308] text-black text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                        {m.badge}
                      </span>
                    )}
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#eab308]' : 'text-zinc-500'}`} />
                    <span className="text-xs font-black leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Pix Dynamic QR Box */}
            {paymentMethod === 'pix' && (
              <div className="bg-[#240e15] border border-[#eab308]/40 p-4 sm:p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-36 h-36 bg-white p-2.5 rounded-xl shadow-lg flex flex-col items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="white" />
                      <rect x="5" y="5" width="28" height="28" fill="#580c1f" />
                      <rect x="9" y="9" width="20" height="20" fill="white" />
                      <rect x="13" y="13" width="12" height="12" fill="#580c1f" />
                      <rect x="67" y="5" width="28" height="28" fill="#580c1f" />
                      <rect x="71" y="9" width="20" height="20" fill="white" />
                      <rect x="75" y="13" width="12" height="12" fill="#580c1f" />
                      <rect x="5" y="67" width="28" height="28" fill="#580c1f" />
                      <rect x="9" y="71" width="20" height="20" fill="white" />
                      <rect x="13" y="75" width="12" height="12" fill="#580c1f" />
                      <rect x="38" y="10" width="8" height="8" fill="#580c1f" />
                      <rect x="50" y="15" width="10" height="6" fill="#580c1f" />
                      <rect x="40" y="42" width="18" height="18" fill="#eab308" />
                      <rect x="65" y="40" width="14" height="6" fill="#580c1f" />
                      <rect x="82" y="38" width="12" height="10" fill="#580c1f" />
                      <rect x="65" y="52" width="8" height="16" fill="#580c1f" />
                      <rect x="78" y="55" width="14" height="8" fill="#580c1f" />
                      <rect x="38" y="68" width="12" height="10" fill="#580c1f" />
                      <rect x="55" y="72" width="18" height="8" fill="#580c1f" />
                      <rect x="42" y="82" width="10" height="10" fill="#580c1f" />
                      <rect x="72" y="78" width="16" height="14" fill="#580c1f" />
                    </svg>
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="text-xs text-[#eab308] font-black uppercase tracking-wider">
                      Pagamento Pix Instantâneo
                    </div>
                    <div className="text-xs font-bold text-white">
                      Beneficiário: {RESTAURANT_INFO.pixBeneficiary}
                    </div>
                    <p className="text-xs text-zinc-300">
                      Abra o app do seu banco, escolha <strong>Pix &gt; Ler QR Code</strong> ou copie o código abaixo:
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="flex items-center gap-1.5 bg-[#eab308] hover:bg-[#ca8a04] text-black px-4 py-2 rounded-xl font-black text-xs shadow transition-all active:scale-95 cursor-pointer"
                      >
                        {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{pixCopied ? 'Código Copiado!' : 'Copiar Código Pix'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playSound('success');
                          setPixSimulatedSuccess(true);
                        }}
                        className={`text-xs px-3 py-2 rounded-xl border transition-colors ${
                          pixSimulatedSuccess
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700'
                        }`}
                      >
                        {pixSimulatedSuccess ? '✓ Pix Confirmado!' : 'Simular Aprovação Pix'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cartao_credito' && (
              <div className="bg-[#240e15] border border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Número do Cartão de Crédito
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                      Nome no Cartão
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white uppercase text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        Validade
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'carteira_digital' && (
              <div className="bg-[#240e15] border border-zinc-800 p-5 rounded-2xl text-center space-y-3">
                <Smartphone className="w-8 h-8 text-[#eab308] mx-auto" />
                <h4 className="text-sm font-black text-white">Apple Pay / Google Wallet</h4>
                <p className="text-xs text-zinc-300 max-w-sm mx-auto">
                  Pague com biometria facial ou impressão digital instantaneamente no seu celular.
                </p>
              </div>
            )}

            {paymentMethod === 'dinheiro' && (
              <div className="bg-[#240e15] border border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 font-bold">
                    Precisa de troco para dinheiro?
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNeedsChange(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-black ${
                        !needsChange ? 'bg-[#eab308] text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      Não preciso
                    </button>
                    <button
                      type="button"
                      onClick={() => setNeedsChange(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-black ${
                        needsChange ? 'bg-[#eab308] text-black' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      Sim, preciso
                    </button>
                  </div>
                </div>

                {needsChange && (
                  <div className="flex items-center gap-2 pt-2">
                    <label className="text-xs text-zinc-300 font-bold">Troco para:</label>
                    <input
                      type="number"
                      value={changeForAmount}
                      onChange={(e) => setChangeForAmount(e.target.value)}
                      placeholder="Ex: 50.00"
                      className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold w-32"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-xs text-zinc-400 font-semibold">Total com Entrega:</span>
            <div className="text-xl font-black text-[#eab308]">{formatCurrency(total)}</div>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <Coins className="w-3 h-3 text-[#eab308]" />
              <span>Você ganhará +{pointsToEarn} pontos VIP</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleCompleteOrder}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black px-8 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-[#eab308]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Confirmar e Enviar Pedido</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
