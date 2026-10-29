import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Server, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Globe 
} from 'lucide-react';
import { TECH_STACK_RECOMMENDATION, MVP_ROADMAP } from '../data/techDocs';
import { KikomeloLogo } from './KikomeloLogo';

interface TechArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechArchitectureModal: React.FC<TechArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'roadmap' | 'payments' | 'kds'>('stack');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-orange-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <KikomeloLogo size="sm" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Especificação Técnica, Stack & Cronograma MVP
              </h2>
              <p className="text-xs text-zinc-400">
                Arquitetura de alta performance para Lanchonete Kikomelo001 (Rio Branco, AC)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="bg-zinc-950 border-b border-zinc-850 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'stack', label: '1. Stack Tecnológica Recomendada', icon: Server },
            { id: 'payments', label: '2. Meios de Pagamento & Pix', icon: CreditCard },
            { id: 'kds', label: '3. Painel KDS & Cozinha', icon: Layers },
            { id: 'roadmap', label: '4. Cronograma MVP por Semanas', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-black shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {activeTab === 'stack' && (
            <div className="space-y-6">
              {TECH_STACK_RECOMMENDATION.slice(0, 2).map((section, idx) => (
                <div key={idx} className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-white text-orange-400">
                      {section.title}
                    </h3>
                    <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-bold">
                      {section.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {section.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {section.details.map((d, dIdx) => (
                      <div key={dIdx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 space-y-1">
                        <span className="text-[10px] text-orange-400 font-bold uppercase">{d.category}</span>
                        <h4 className="font-bold text-white text-xs">{d.tech}</h4>
                        <p className="text-[11px] text-zinc-400 leading-tight">{d.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/60 p-5 rounded-2xl border border-orange-500/30 space-y-3">
                <h3 className="text-base font-extrabold text-white">
                  Integrações de Pagamento Essenciais no Brasil
                </h3>
                <p className="text-xs text-zinc-300">
                  Para máxima taxa de conversão em sanduicherias delivery:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>Pix Instantâneo (Mercado Pago / Efí / Asaas)</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      QR Code dinâmico com temporizador de 15 minutos e código Copia e Cola. O webhook do PSP avisa o backend em 2 segundos e a comanda já é enviada para a chapa.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                      <CreditCard className="w-4 h-4" />
                      <span>Cartão de Crédito com Tokenização Segura</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Checkout transparente via Stripe ou Mercado Pago SDK sem redirecionamento externo. Permite pagamento em 1 clique e salva cartões com criptografia PCI-DSS.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                      <Globe className="w-4 h-4" />
                      <span>Carteiras Digitais (Apple Pay & Google Pay)</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      O cliente paga diretamente com FaceID ou impressão digital no navegador do celular, sem precisar pegar a carteira física.
                    </p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Dinheiro com Cálculo de Troco</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Pergunta automática &quot;Troco para quanto?&quot; e imprime o valor exato a ser levado pelo motoboy na comanda térmica de 80mm.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kds' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-3">
                <h3 className="text-base font-extrabold text-white">
                  Painel do Estabelecimento & KDS (Kitchen Display System)
                </h3>
                <p className="text-xs text-zinc-300">
                  Como funciona a operação na Lanchonete Kikomelo001 (Rua Teste, 1182 - Centro):
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 font-bold">1</div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">Recepção Instantânea com Alerta Sonoro</h4>
                      <p className="text-xs text-zinc-400">Assim que o cliente confirma o pedido, toca um alarme sonoro na cozinha e o card entra na coluna &quot;Novos Pedidos&quot; piscando em laranja.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">2</div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">Destaque de Customizações Críticas</h4>
                      <p className="text-xs text-zinc-400">Ingredientes removidos (&quot;SEM CEBOLA&quot;) aparecem tachados em vermelho brilhante para evitar erros humanos na montagem, e carnes extras aparecem em verde.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">3</div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">Impressão Térmica de Comanda (ESC/POS 80mm)</h4>
                      <p className="text-xs text-zinc-400">Geração de duas vias de cupom térmico: via 1 para a chapa e montagem, via 2 com endereço e telefone para anexar na sacola de delivery do motoboy.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold">4</div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">Despacho de Motoboy e Notificação Push</h4>
                      <p className="text-xs text-zinc-400">Ao clicar em &quot;Despachar Motoboy&quot;, o cliente recebe notificação push imediata e a tela de acompanhamento passa a mostrar o mapa da rota em Rio Branco.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Cronograma Sugerido de Desenvolvimento (MVP)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Dividido por semanas para entrega acelerada com alta qualidade:
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {MVP_ROADMAP.map((wk) => (
                  <div
                    key={wk.week}
                    className="p-4 bg-zinc-900/70 rounded-2xl border border-zinc-800 space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-orange-500 text-black font-black text-xs flex items-center justify-center">
                          {wk.week}
                        </span>
                        <h4 className="font-extrabold text-white text-xs sm:text-sm">{wk.phase}</h4>
                      </div>
                      <span className="text-[11px] bg-orange-500/10 text-orange-400 font-bold px-2 py-0.5 rounded border border-orange-500/30">
                        {wk.duration}
                      </span>
                    </div>

                    <ul className="space-y-1 text-xs text-zinc-300 pl-4 list-disc">
                      {wk.deliverables.map((del, dIdx) => (
                        <li key={dIdx}>{del}</li>
                      ))}
                    </ul>

                    <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        <strong>Marco Principal:</strong> {wk.keyMilestone}
                      </span>
                      {wk.status === 'concluido_neste_prototipo' && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Implementado no App
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl"
          >
            Fechar Especificação
          </button>
        </div>
      </div>
    </div>
  );
};
