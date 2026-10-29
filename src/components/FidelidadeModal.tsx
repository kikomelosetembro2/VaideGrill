import React from 'react';
import { 
  X, 
  Award, 
  Gift, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Flame, 
  Coins, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { LoyaltyReward, CustomerInfo } from '../types';
import { LOYALTY_REWARDS, RESTAURANT_INFO } from '../data/menuData';
import { formatCurrency, playSound } from '../utils/helpers';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface FidelidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerInfo | null;
  currentPoints: number;
  onRedeemReward: (reward: LoyaltyReward) => void;
}

export const FidelidadeModal: React.FC<FidelidadeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentPoints,
  onRedeemReward,
}) => {
  if (!isOpen) return null;

  // Tier calculation
  const tier = currentPoints >= 200 ? 'Ouro da Brasa' : currentPoints >= 100 ? 'Prata Grill' : 'Bronze Artesanal';
  const nextTierPoints = currentPoints >= 200 ? 300 : currentPoints >= 100 ? 200 : 100;
  const progressToNext = Math.min(100, Math.round((currentPoints / nextTierPoints) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1c0c11] border border-[#eab308]/40 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#2a0e16] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#eab308] flex items-center justify-center text-black font-black shadow-lg">
              <Award className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Clube de Fidelidade Vai de Grill
                </h2>
                <span className="bg-[#eab308]/20 text-[#eab308] text-[10px] font-black px-2 py-0.5 rounded border border-[#eab308]/40">
                  {tier}
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Ganhe 1 ponto a cada R$ 1,00 gasto em sanduíches artesanais!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-[#6b0f1a] text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Virtual Loyalty Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#580c1f] via-[#7f1d1d] to-[#36050b] p-6 text-white border border-[#eab308]/50 shadow-2xl">
            {/* Background Sizzling Circles */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[#eab308]/10 blur-xl pointer-events-none" />
            <div className="absolute top-2 right-4 opacity-20">
              <VaiDeGrillLogo size="lg" variant="icon" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#facc15] font-black block">
                    CARTÃO VIP • LANCHONETE VAI DE GRILL
                  </span>
                  <h3 className="text-lg font-black tracking-tight text-white mt-0.5">
                    {currentUser?.name || 'Cliente Apaixonado por Burger'}
                  </h3>
                  <span className="text-xs text-zinc-300">
                    {currentUser?.phone || '(68) 99224-9224'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-300 uppercase block font-semibold">
                    Saldo Acumulado
                  </span>
                  <div className="text-3xl font-black text-[#eab308] flex items-center justify-end gap-1">
                    <span>{currentPoints}</span>
                    <span className="text-xs font-bold text-white">pts</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar to next Tier */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-zinc-200">
                    Nível Atual: <strong className="text-[#facc15]">{tier}</strong>
                  </span>
                  <span className="text-zinc-300">
                    {currentPoints} / {nextTierPoints} pts para próximo benefício
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden border border-white/20">
                  <div
                    className="bg-gradient-to-r from-[#eab308] to-[#facc15] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* How it Works Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#240e15] border border-zinc-800 p-3.5 rounded-2xl flex items-start gap-2.5">
              <Coins className="w-5 h-5 text-[#eab308] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-white text-xs">1. Peça na Brasa</h4>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Cada R$ 1,00 gasto no app acumula 1 ponto automático na sua conta.
                </p>
              </div>
            </div>

            <div className="bg-[#240e15] border border-zinc-800 p-3.5 rounded-2xl flex items-start gap-2.5">
              <Gift className="w-5 h-5 text-[#eab308] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-white text-xs">2. Resgate Prêmios</h4>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Troque seus pontos por batatas crocantes, sucos ou descontos de R$ 15.
                </p>
              </div>
            </div>

            <div className="bg-[#240e15] border border-zinc-800 p-3.5 rounded-2xl flex items-start gap-2.5">
              <Flame className="w-5 h-5 text-[#eab308] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-white text-xs">3. Sem Validade Curta</h4>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Seus pontos ficam salvos e são válidos para delivery ou retirada.
                </p>
              </div>
            </div>
          </div>

          {/* Rewards Catalog */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#eab308]" />
                <span>Catálogo de Recompensas Disponíveis</span>
              </h3>
              <span className="text-xs text-zinc-400">
                Seus pontos: <strong className="text-[#eab308]">{currentPoints} pts</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LOYALTY_REWARDS.map((reward) => {
                const canAfford = currentPoints >= reward.pointsCost;
                return (
                  <div
                    key={reward.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                      canAfford
                        ? 'bg-[#260f15] border-[#eab308]/40 hover:border-[#eab308]'
                        : 'bg-[#18080c] border-zinc-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-white text-xs sm:text-sm">
                          {reward.title}
                        </span>
                        {reward.badge && (
                          <span className="text-[9px] bg-[#eab308] text-black font-black px-1.5 py-0.2 rounded shrink-0">
                            {reward.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-snug">
                        {reward.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                      <div className="flex items-center gap-1 font-black text-xs text-[#eab308]">
                        <Coins className="w-4 h-4" />
                        <span>{reward.pointsCost} Pontos</span>
                      </div>

                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => {
                          playSound('success');
                          onRedeemReward(reward);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all ${
                          canAfford
                            ? 'bg-[#eab308] hover:bg-[#ca8a04] text-black shadow active:scale-95 cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? 'Resgatar Prêmio' : `Faltam ${reward.pointsCost - currentPoints} pts`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#260f15] border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
