import React, { useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  Bike, 
  CheckCircle2, 
  Printer, 
  Volume2, 
  VolumeX, 
  Store, 
  Phone, 
  Flame,
  ArrowRight,
  MessageCircle,
  X
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { RESTAURANT_INFO } from '../data/menuData';
import { formatCurrency, playSound } from '../utils/helpers';
import { openWhatsAppOrder } from '../utils/whatsappReceipt';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface KitchenDisplaySystemProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onClose: () => void;
}

export const KitchenDisplaySystem: React.FC<KitchenDisplaySystemProps> = ({
  orders,
  onUpdateOrderStatus,
  onClose,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | OrderStatus>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (selectedFilter === 'all') return true;
    return o.status === selectedFilter;
  });

  const countByStatus = {
    recebido: orders.filter((o) => o.status === 'recebido').length,
    em_preparo: orders.filter((o) => o.status === 'em_preparo').length,
    pronto: orders.filter((o) => o.status === 'pronto').length,
    saiu_para_entrega: orders.filter((o) => o.status === 'saiu_para_entrega').length,
    entregue: orders.filter((o) => o.status === 'entregue').length,
  };

  const handleAdvanceStatus = (order: Order) => {
    if (soundEnabled) playSound('ding');
    let nextStatus: OrderStatus = 'recebido';

    if (order.status === 'recebido') nextStatus = 'em_preparo';
    else if (order.status === 'em_preparo') nextStatus = 'pronto';
    else if (order.status === 'pronto') nextStatus = 'saiu_para_entrega';
    else if (order.status === 'saiu_para_entrega') nextStatus = 'entregue';
    else return;

    onUpdateOrderStatus(order.id, nextStatus);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#12080a] text-white flex flex-col overflow-hidden">
      {/* KDS Top Bar */}
      <header className="bg-[#1c0c11] border-b border-[#eab308]/30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <VaiDeGrillLogo size="sm" />
          <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="bg-[#eab308] text-black text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
              Painel KDS Cozinha & Grelha
            </span>
            <span className="text-xs text-zinc-300 font-semibold hidden md:inline">
              Gerenciador de Ordens em Tempo Real • Rua A, 1176 - João Eduardo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-[#6b0f1a] border-[#eab308]/50 text-[#eab308]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title={soundEnabled ? 'Alertas sonoros ativados' : 'Alertas sonoros mudos'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Som</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-[#6b0f1a] hover:text-white border border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <X className="w-4 h-4" />
            <span>Voltar ao Cardápio</span>
          </button>
        </div>
      </header>

      {/* Filter Tabs Bar */}
      <div className="bg-[#18080c] border-b border-zinc-850 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
        {[
          { id: 'all', label: 'Todos os Pedidos', count: orders.length },
          { id: 'recebido', label: '🔔 Novos / Recebidos', count: countByStatus.recebido, alert: countByStatus.recebido > 0 },
          { id: 'em_preparo', label: '🔥 Na Brasa (Grelha)', count: countByStatus.em_preparo },
          { id: 'pronto', label: '📦 Prontos para Saída', count: countByStatus.pronto },
          { id: 'saiu_para_entrega', label: '🛵 Em Rota (Motoboy)', count: countByStatus.saiu_para_entrega },
          { id: 'entregue', label: '✓ Concluídos', count: countByStatus.entregue },
        ].map((tab) => {
          const isSelected = selectedFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playSound('ding');
                setSelectedFilter(tab.id as any);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#eab308] text-black shadow-md'
                  : 'bg-[#240e15] text-zinc-300 hover:text-white border border-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                  isSelected
                    ? 'bg-black text-[#eab308]'
                    : tab.alert
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-center text-zinc-500 space-y-3">
            <ChefHat className="w-12 h-12 text-zinc-700" />
            <div>
              <h3 className="text-base font-bold text-zinc-300">Nenhum pedido nesta coluna</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Quando um cliente fizer um pedido, ele aparecerá aqui com aviso sonoro e comanda!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const isNew = order.status === 'recebido';
              const isCooking = order.status === 'em_preparo';
              const isReady = order.status === 'pronto';
              const isDelivering = order.status === 'saiu_para_entrega';
              const isFinished = order.status === 'entregue';

              return (
                <div
                  key={order.id}
                  className={`bg-[#1c0c11] rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                    isNew
                      ? 'border-[#eab308] ring-2 ring-[#eab308]/40'
                      : isCooking
                      ? 'border-[#881337]'
                      : isReady
                      ? 'border-blue-500/60'
                      : isDelivering
                      ? 'border-purple-500/60'
                      : 'border-zinc-800 opacity-70'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3.5 flex items-center justify-between border-b ${
                      isNew
                        ? 'bg-[#eab308]/20 border-[#eab308]/40 text-[#eab308]'
                        : isCooking
                        ? 'bg-[#6b0f1a]/50 border-[#881337] text-white'
                        : isReady
                        ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                        : isDelivering
                        ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">#{order.id}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/50">
                        {order.status === 'recebido' ? 'NOVO PEDIDO' :
                         order.status === 'em_preparo' ? 'NA BRASA' :
                         order.status === 'pronto' ? 'PRONTO' :
                         order.status === 'saiu_para_entrega' ? 'EM ROTA' : 'ENTREGUE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{order.createdAt}</span>
                    </div>
                  </div>

                  {/* Customer & Destination Summary */}
                  <div className="p-3.5 bg-[#260f15]/80 border-b border-zinc-850 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{order.customer.name}</span>
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="text-[#eab308] font-bold hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customer.phone}</span>
                      </a>
                    </div>

                    <div className="text-zinc-300 flex items-center gap-1">
                      {order.deliveryMethod === 'entrega' ? (
                        <>
                          <Bike className="w-3.5 h-3.5 text-[#eab308]" />
                          <span>Delivery: {order.customer.address?.neighborhood || 'Rio Branco'} ({order.customer.address?.street}, {order.customer.address?.number})</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-3.5 h-3.5 text-blue-400" />
                          <span>Retirada Balcão (Rua A, 1176 - João Eduardo)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order Items with Customization Highlights */}
                  <div className="p-3.5 flex-1 space-y-3 overflow-y-auto max-h-60 text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="border-b border-zinc-850 pb-2 last:border-none last:pb-0">
                        <div className="flex justify-between items-start font-bold text-white">
                          <span className="text-sm">
                            <span className="text-[#eab308] mr-1">{item.quantity}x</span>
                            {item.menuItem.name}
                          </span>
                        </div>

                        {/* Critical kitchen alerts (Sem cebola, Ponto da Carne, Extras) */}
                        <div className="mt-1 space-y-1">
                          {item.customization.meatDoneness && (
                            <span className="inline-block bg-[#6b0f1a] border border-[#eab308]/40 text-[#facc15] text-[10px] font-black uppercase px-2 py-0.5 rounded mr-1">
                              🥩 Ponto: {item.customization.meatDoneness.replace('_', ' ')}
                            </span>
                          )}

                          {item.customization.removedIngredients.map((rem, rIdx) => (
                            <span
                              key={rIdx}
                              className="inline-block bg-red-950 border border-red-500/50 text-red-300 text-[10px] font-black uppercase px-2 py-0.5 rounded mr-1 line-through"
                            >
                              SEM {rem}
                            </span>
                          ))}

                          {Object.entries(item.customization.addedExtras).map(([extId, q], eIdx) => {
                            const ext = item.menuItem.availableExtras.find((e) => e.id === extId);
                            return ext ? (
                              <span
                                key={eIdx}
                                className="inline-block bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded mr-1"
                              >
                                +{q}x {ext.name}
                              </span>
                            ) : null;
                          })}

                          {item.customization.specialNotes && (
                            <div className="text-[11px] text-amber-200 italic bg-[#3d121c] p-1.5 rounded border border-[#eab308]/30 mt-1">
                              Obs: &quot;{item.customization.specialNotes}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-[#260f15] border-t border-zinc-850 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPrintingOrder(order)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Imprimir comanda térmica 80mm"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#eab308]" />
                      <span className="hidden sm:inline">Comanda</span>
                    </button>

                    <button
                      onClick={() => openWhatsAppOrder(order)}
                      className="p-2 bg-[#25D366] hover:bg-[#1ebd59] text-black rounded-xl text-xs font-black flex items-center gap-1 transition-colors shadow"
                      title="Enviar Comprovante do Pedido para o WhatsApp da Cozinha"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-black" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {!isFinished && (
                      <button
                        onClick={() => handleAdvanceStatus(order)}
                        className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          isNew
                            ? 'bg-[#eab308] hover:bg-[#ca8a04] text-black'
                            : isCooking
                            ? 'bg-blue-500 hover:bg-blue-600 text-black'
                            : isReady
                            ? 'bg-purple-500 hover:bg-purple-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-black'
                        }`}
                      >
                        <span>
                          {isNew ? 'Iniciar na Brasa' :
                           isCooking ? 'Marcar Pronto' :
                           isReady ? 'Despachar Motoboy' :
                           'Concluir Entrega'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isFinished && (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entregue</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Thermal Printer 80mm Preview Modal */}
      {printingOrder && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black p-6 rounded-2xl max-w-sm w-full font-mono text-xs shadow-2xl space-y-3 relative">
            <button
              onClick={() => setPrintingOrder(null)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-black font-bold p-1"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-1 border-b border-black/30 pb-3">
              <div className="flex justify-center pb-1">
                <VaiDeGrillLogo size="sm" lightBg />
              </div>
              <h3 className="font-black text-sm uppercase">LANCHONETE VAI DE GRILL</h3>
              <p className="text-[10px] leading-tight">
                Rua A, 1176 - Bairro João Eduardo<br />
                Rio Branco - Acre • CEP: 69911-000<br />
                Telefone/WhatsApp: (68) 99224-9224
              </p>
              <div className="pt-2 font-black text-sm">
                PEDIDO #{printingOrder.id}
              </div>
              <div className="text-[10px]">
                Data/Hora: {printingOrder.createdAt}
              </div>
            </div>

            {/* Customer Details */}
            <div className="border-b border-black/30 pb-2 text-[11px] space-y-0.5">
              <div><strong>CLIENTE:</strong> {printingOrder.customer.name}</div>
              <div><strong>FONE:</strong> {printingOrder.customer.phone}</div>
              <div><strong>TIPO:</strong> {printingOrder.deliveryMethod === 'entrega' ? 'DELIVERY MOTOBOY' : 'RETIRADA NO BALCÃO'}</div>
              {printingOrder.customer.address && (
                <div>
                  <strong>ENDEREÇO:</strong> {printingOrder.customer.address.street}, {printingOrder.customer.address.number}<br />
                  <strong>BAIRRO:</strong> {printingOrder.customer.address.neighborhood}<br />
                  {printingOrder.customer.address.complement && <><strong>COMPL:</strong> {printingOrder.customer.address.complement}<br /></>}
                  {printingOrder.customer.address.referencePoint && <><strong>REF:</strong> {printingOrder.customer.address.referencePoint}</>}
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="border-b border-black/30 pb-2 space-y-2 text-[11px]">
              <div className="font-bold border-b border-dashed border-black/30 pb-1 flex justify-between">
                <span>ITEM</span>
                <span>TOTAL</span>
              </div>

              {printingOrder.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>{it.quantity}x {it.menuItem.name}</span>
                    <span>{formatCurrency(it.totalPrice)}</span>
                  </div>

                  {it.customization.meatDoneness && (
                    <div className="font-bold uppercase text-[10px]">
                      &gt;&gt; PONTO NA GRELHA: {it.customization.meatDoneness.replace('_', ' ')}
                    </div>
                  )}

                  {it.customization.removedIngredients.length > 0 && (
                    <div className="font-bold text-[10px] uppercase">
                      &gt;&gt; SEM: {it.customization.removedIngredients.join(', ')}
                    </div>
                  )}

                  {Object.entries(it.customization.addedExtras).length > 0 && (
                    <div className="text-[10px]">
                      &gt;&gt; EXTRAS: {Object.entries(it.customization.addedExtras)
                        .map(([id, q]) => {
                          const e = it.menuItem.availableExtras.find((ex) => ex.id === id);
                          return e ? `${q}x ${e.name}` : null;
                        })
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}

                  {it.customization.specialNotes && (
                    <div className="text-[10px] font-bold">
                      &gt;&gt; OBS: &quot;{it.customization.specialNotes}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border-b border-black/30 pb-2 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(printingOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa Entrega:</span>
                <span>{formatCurrency(printingOrder.deliveryFee)}</span>
              </div>
              {printingOrder.discount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(printingOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-black/30">
                <span>TOTAL:</span>
                <span>{formatCurrency(printingOrder.total)}</span>
              </div>
              <div className="text-[10px] uppercase pt-1">
                PAGAMENTO: <strong>{printingOrder.paymentMethod.replace('_', ' ')}</strong>
                {printingOrder.changeFor && ` (Troco para R$ ${printingOrder.changeFor.toFixed(2)})`}
              </div>
            </div>

            {/* Print action button */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-black text-white py-2 rounded font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Cupom 80mm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
