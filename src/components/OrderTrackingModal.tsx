import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Bike, 
  MapPin, 
  MessageCircle, 
  Package, 
  Sparkles,
  Phone,
  Flame
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { RESTAURANT_INFO } from '../data/menuData';
import { formatCurrency, playSound } from '../utils/helpers';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface OrderTrackingModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, nextStatus: OrderStatus) => void;
  onOpenReceiptModal?: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onOpenReceiptModal,
}) => {
  const [mapProgress, setMapProgress] = useState(0.4);

  useEffect(() => {
    if (!order) return;
    if (order.status === 'saiu_para_entrega') {
      const interval = setInterval(() => {
        setMapProgress((prev) => (prev >= 0.95 ? 0.2 : prev + 0.03));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order?.status]);

  if (!order) return null;

  const timelineSteps: { key: OrderStatus; label: string; desc: string; icon: any }[] = [
    { key: 'recebido', label: 'Pedido Recebido', desc: 'Confirmado no caixa Vai de Grill', icon: CheckCircle2 },
    { key: 'em_preparo', label: 'Na Grelha & Preparo', desc: 'Churrasqueiro assando seu burger', icon: Flame },
    { key: 'pronto', label: 'Pronto & Embalado', desc: 'Aguardando saída da comanda', icon: Package },
    { key: 'saiu_para_entrega', label: 'Saiu para Entrega', desc: 'Motoboy em rota em Rio Branco', icon: Bike },
    { key: 'entregue', label: 'Entregue com Sucesso', desc: 'Bom apetite!', icon: Sparkles },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'recebido': return 0;
      case 'em_preparo': return 1;
      case 'pronto': return 2;
      case 'saiu_para_entrega': return 3;
      case 'entregue': return 4;
      default: return 0;
    }
  };

  const currentStepIndex = getStepIndex(order.status);

  const advanceStatus = () => {
    playSound('ding');
    const orderStatuses: OrderStatus[] = ['recebido', 'em_preparo', 'pronto', 'saiu_para_entrega', 'entregue'];
    const nextIdx = (currentStepIndex + 1) % orderStatuses.length;
    if (onUpdateStatus) {
      onUpdateStatus(order.id, orderStatuses[nextIdx]);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá Vai de Grill! Gostaria de acompanhar meu Pedido #${order.id}. Endereço: ${order.customer.address?.neighborhood || 'Retirada'} - Total: R$ ${order.total.toFixed(2)}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#1c0c11] border border-[#eab308]/40 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <VaiDeGrillLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Acompanhamento em Tempo Real
                </h2>
                <span className="bg-[#eab308] text-black text-xs font-black px-2 py-0.5 rounded">
                  Pedido #{order.id}
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                {RESTAURANT_INFO.name} • {RESTAURANT_INFO.address}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar rastreamento"
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-[#6b0f1a] text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Tracking Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Estimated delivery banner */}
          <div className="p-4 bg-gradient-to-r from-[#580c1f] via-[#240e15] to-[#12080a] rounded-2xl border border-[#eab308]/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-11 h-11 rounded-full bg-[#eab308]/20 border border-[#eab308]/40 flex items-center justify-center text-[#eab308] shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#eab308] uppercase tracking-wider">
                  Previsão de Entrega
                </div>
                <div className="text-lg font-black text-white">
                  {order.status === 'entregue' ? 'Pedido Entregue!' : order.estimatedDeliveryTime}
                </div>
              </div>
            </div>

            {/* Quick advance status tester button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={advanceStatus}
                className="bg-[#2a0e16] hover:bg-[#eab308] hover:text-black text-white border border-[#eab308]/40 px-3 py-1.5 rounded-xl text-xs font-black transition-all"
                title="Avançar status para teste"
              >
                Simular Próximo Status &gt;
              </button>
            </div>
          </div>

          {/* Timeline of Statuses */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Status do Pedido
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-6 border-l-2 border-zinc-800 ml-4 sm:ml-6">
              {timelineSteps.map((st, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = st.icon;

                return (
                  <div key={st.key} className="relative group">
                    <div
                      className={`absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-[#eab308] text-black ring-4 ring-[#eab308]/30 shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-[#6b0f1a] text-white border border-[#eab308]/60'
                          : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-xs sm:text-sm ${
                            isCurrent
                              ? 'text-[#eab308]'
                              : isCompleted
                              ? 'text-white'
                              : 'text-zinc-600'
                          }`}
                        >
                          {st.label}
                        </span>
                        {isCurrent && (
                          <span className="bg-[#eab308]/20 text-[#eab308] text-[10px] font-black px-2 py-0.2 rounded-full animate-pulse border border-[#eab308]/30">
                            Em andamento
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-300 mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Delivery Map (Rio Branco Vector Simulation from João Eduardo) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#eab308]" />
                <span>Rota de Entrega a Partir do Bairro João Eduardo</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                GPS Ativo
              </span>
            </div>

            <div className="relative h-60 w-full bg-[#12080a] rounded-2xl border border-zinc-800 overflow-hidden shadow-inner flex items-center justify-center">
              <svg className="w-full h-full opacity-65" viewBox="0 0 600 240">
                <defs>
                  <linearGradient id="grillRouteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </linearGradient>
                </defs>

                {/* City grid lines */}
                <line x1="0" y1="60" x2="600" y2="60" stroke="#271118" strokeWidth="2" />
                <line x1="0" y1="120" x2="600" y2="120" stroke="#271118" strokeWidth="2" />
                <line x1="0" y1="180" x2="600" y2="180" stroke="#271118" strokeWidth="2" />
                <line x1="120" y1="0" x2="120" y2="240" stroke="#271118" strokeWidth="2" />
                <line x1="240" y1="0" x2="240" y2="240" stroke="#271118" strokeWidth="2" />
                <line x1="360" y1="0" x2="360" y2="240" stroke="#271118" strokeWidth="2" />
                <line x1="480" y1="0" x2="480" y2="240" stroke="#271118" strokeWidth="2" />

                {/* Rio Acre River representation */}
                <path
                  d="M 0,220 C 150,210 250,150 400,160 C 500,165 550,130 600,120"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="14"
                  strokeOpacity="0.3"
                />
                <text x="50" y="235" fill="#3b82f6" fontSize="10" fontWeight="bold">Rio Acre</text>

                {/* Route: João Eduardo (x:130, y:80) to Customer (x:450, y:150) */}
                <path
                  d="M 130,80 L 250,80 L 250,150 L 450,150"
                  fill="none"
                  stroke="#421420"
                  strokeWidth="6"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 130,80 L 250,80 L 250,150 L 450,150"
                  fill="none"
                  stroke="url(#grillRouteGradient)"
                  strokeWidth="4"
                />

                {/* Store Point Marker (Vai de Grill) */}
                <circle cx="130" cy="80" r="10" fill="#eab308" />
                <circle cx="130" cy="80" r="4" fill="#000" />
                <text x="90" y="60" fill="#facc15" fontSize="11" fontWeight="bold">
                  📍 Vai de Grill (Rua A, 1176 - João Eduardo)
                </text>

                {/* Customer Point Marker */}
                <circle cx="450" cy="150" r="10" fill="#22c55e" />
                <circle cx="450" cy="150" r="4" fill="#000" />
                <text x="380" y="180" fill="#86efac" fontSize="11" fontWeight="bold">
                  🏠 {order.customer.address?.neighborhood || 'Seu Endereço'}
                </text>
              </svg>

              {/* Moving Motoboy Icon on route */}
              <div
                className="absolute z-20 flex flex-col items-center pointer-events-none transition-all duration-1000 ease-linear"
                style={{
                  left: `${130 + mapProgress * (450 - 130)}px`,
                  top: `${mapProgress < 0.35 ? 70 : mapProgress < 0.6 ? 120 : 140}px`,
                }}
              >
                <div className="bg-[#eab308] text-black px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1">
                  <Bike className="w-3 h-3" />
                  <span>Motoboy Vai de Grill</span>
                </div>
                <div className="w-2.5 h-2.5 bg-[#eab308] rotate-45 -mt-1 shadow" />
              </div>

              {/* Overlay Info Tag */}
              <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                <span className="text-[#eab308] font-black">Saída:</span> Rua A, 1176 (Bairro João Eduardo) ➔{' '}
                <span className="text-white font-bold">{order.customer.address?.neighborhood || 'Balcão'}</span>
              </div>
            </div>
          </div>

          {/* Customer & Order Items Breakdown */}
          <div className="bg-[#240e15] p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-zinc-300 uppercase tracking-wider">
                Resumo dos Itens ({order.items.length})
              </span>
              <span className="font-black text-[#eab308]">
                Total: {formatCurrency(order.total)}
              </span>
            </div>

            <div className="space-y-2">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs text-zinc-300">
                  <div>
                    <span className="font-bold text-white">{it.quantity}x {it.menuItem.name}</span>
                    {it.customization.meatDoneness && (
                      <span className="text-[#eab308] ml-1">({it.customization.meatDoneness.replace('_', ' ')})</span>
                    )}
                    {it.customization.removedIngredients.length > 0 && (
                      <div className="text-[10px] text-red-400 line-through">
                        Sem: {it.customization.removedIngredients.join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-white">{formatCurrency(it.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* WhatsApp & Support Footer */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-zinc-300 text-center sm:text-left">
            Dúvidas sobre o pedido? Ligue para{' '}
            <strong className="text-white">{RESTAURANT_INFO.phone}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenReceiptModal && (
              <button
                type="button"
                onClick={onOpenReceiptModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#36101a] hover:bg-[#4d1624] text-[#facc15] font-black text-xs border border-[#eab308]/40 transition-colors"
                title="Ver Comprovante Formatado para a Cozinha"
              >
                <span>Comprovante Cozinha</span>
              </button>
            )}

            <a
              href={`https://wa.me/${RESTAURANT_INFO.whatsappRaw}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd59] text-black px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
