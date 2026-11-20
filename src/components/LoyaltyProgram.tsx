import React, { useState } from 'react';
import {
  X,
  Award,
  User,
  Phone,
  CheckCircle2,
  Gift,
  TrendingUp,
  History,
  ShoppingBag,
} from 'lucide-react';
import { LoyaltyAccountState, LoyaltyReward } from '../types';
import { LOYALTY_REWARDS } from '../data/menuData';
import { formatCurrency } from '../utils/helpers';

interface LoyaltyProgramProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: { name: string; phone: string };
  onUpdateProfile: (profile: { name: string; phone: string }) => void;
  loyaltyAccount: LoyaltyAccountState;
  onRedeemSuccess: (updatedAccount: LoyaltyAccountState, reward: LoyaltyReward) => void;
  onOpenCart: () => void;
}

const PRESET_CUSTOMERS = [
  { name: 'Carlos Eduardo', phone: '(68) 99988-3321' },
  { name: 'Ana Paula Lima', phone: '(68) 99201-7755' },
  { name: 'Mariana Souza', phone: '(68) 99912-4410' },
];

export const LoyaltyProgram: React.FC<LoyaltyProgramProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  loyaltyAccount,
  onRedeemSuccess,
  onOpenCart,
}) => {
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [phoneInput, setPhoneInput] = useState(userProfile.phone);
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
    canGoToCart?: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const nextReward = LOYALTY_REWARDS.find(
    (r) => r.pointsCost > loyaltyAccount.balance
  );
  const progressTarget = nextReward ? nextReward.pointsCost : 650;
  const progressPct = Math.min(
    100,
    Math.round((loyaltyAccount.balance / progressTarget) * 100)
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || phoneInput.replace(/\D/g, '').length < 8) {
      setFeedback({
        type: 'err',
        text: 'Informe nome completo e telefone válido para consultar seus pontos.',
      });
      return;
    }
    onUpdateProfile({ name: nameInput.trim(), phone: phoneInput.trim() });
    setProfileSavedMsg('Perfil atualizado! Pontos recalculados pelo total gasto.');
    setTimeout(() => setProfileSavedMsg(null), 3000);
  };

  const handleRedeem = async (reward: LoyaltyReward) => {
    setFeedback(null);
    if (loyaltyAccount.balance < reward.pointsCost) {
      setFeedback({
        type: 'err',
        text: `Faltam ${reward.pointsCost - loyaltyAccount.balance} pts para resgatar ${reward.title}.`,
      });
      return;
    }

    setRedeemingId(reward.id);
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: userProfile.phone,
          rewardId: reward.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.account) {
        throw new Error(data.error || 'Não foi possível resgatar pontos.');
      }
      onRedeemSuccess(data.account as LoyaltyAccountState, reward);
      setFeedback({
        type: 'ok',
        text: `Desconto de ${formatCurrency(reward.discountAmount)} resgatado e aplicado diretamente ao seu carrinho!`,
        canGoToCart: true,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erro ao resgatar pontos.',
      });
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-[#111111] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8A0000] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-[#D4A017]" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">
                Perfil do Cliente & Programa de Fidelidade
              </h2>
              <p className="text-xs text-neutral-300">
                Cada R$ 1,00 gasto em pedidos válidos gera 1 ponto para trocar por descontos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 cursor-pointer"
            aria-label="Fechar fidelidade"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Points Balance & Total Spend Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#111111] text-white">
              <p className="text-[11px] font-bold uppercase text-[#D4A017]">
                Saldo Disponível
              </p>
              <p className="text-2xl font-black mt-1 tabular-nums">
                {loyaltyAccount.balance} pts
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-[11px] font-bold uppercase text-neutral-500">
                Total Gasto
              </p>
              <p className="text-xl font-black text-[#8A0000] mt-1 tabular-nums">
                {formatCurrency(loyaltyAccount.totalSpent)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-[11px] font-bold uppercase text-neutral-500">
                Pontos Acumulados
              </p>
              <p className="text-xl font-black text-[#111111] mt-1 tabular-nums">
                {loyaltyAccount.earnedPoints} pts
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="text-[11px] font-bold uppercase text-neutral-500">
                Pedidos Válidos
              </p>
              <p className="text-xl font-black text-[#111111] mt-1 tabular-nums">
                {loyaltyAccount.ordersCount}
              </p>
            </div>
          </div>

          {/* Progress toward next discount reward */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#111111]">
                <TrendingUp className="w-4 h-4 text-[#8A0000]" />
                {nextReward
                  ? `Progresso para ${nextReward.title} (${nextReward.pointsCost} pts)`
                  : 'Você já desbloqueou o nível máximo de desconto!'}
              </span>
              <span className="tabular-nums text-[#8A0000]">
                {loyaltyAccount.balance} / {progressTarget} pts
              </span>
            </div>
            <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8A0000] rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* SECTION 1: USER PROFILE */}
          <div className="border border-neutral-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#8A0000]" />
                <span>Meu Perfil (Vinculado ao Total Gasto)</span>
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_CUSTOMERS.map((preset) => (
                  <button
                    key={preset.phone}
                    type="button"
                    onClick={() => {
                      setNameInput(preset.name);
                      setPhoneInput(preset.phone);
                      onUpdateProfile(preset);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border cursor-pointer ${
                      userProfile.phone === preset.phone
                        ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                        : 'bg-white text-neutral-600 border-neutral-300 hover:border-[#111111]'
                    }`}
                  >
                    {preset.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {profileSavedMsg && (
              <p className="text-xs font-bold text-emerald-700">{profileSavedMsg}</p>
            )}

            <form
              onSubmit={handleSaveProfile}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Cliente
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm text-[#111111]"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  WhatsApp / Telefone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm text-[#111111] tabular-nums"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full bg-[#111111] hover:bg-neutral-800 text-[#D4A017] font-bold py-2.5 px-3 rounded-lg text-xs cursor-pointer"
                >
                  Atualizar Perfil
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: REDEEM POINTS FOR DISCOUNTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-[#8A0000]" />
                <span>Trocar Pontos por Descontos no Perfil</span>
              </h3>
              <span className="text-xs text-neutral-500 font-semibold">
                {loyaltyAccount.redeemedPoints} pts já resgatados
              </span>
            </div>

            {feedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-wrap items-center justify-between gap-2 ${
                  feedback.type === 'ok'
                    ? 'bg-amber-50 border-[#D4A017] text-[#111111]'
                    : 'bg-red-50 border-[#8A0000] text-[#8A0000]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8A0000] shrink-0" />
                  {feedback.text}
                </span>
                {feedback.canGoToCart && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCart();
                    }}
                    className="bg-[#8A0000] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#D4A017]" />
                    <span>Ir para o Carrinho</span>
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LOYALTY_REWARDS.map((reward) => {
                const canRedeem = loyaltyAccount.balance >= reward.pointsCost;
                const isBusy = redeemingId === reward.id;
                return (
                  <div
                    key={reward.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                      canRedeem
                        ? 'bg-white border-neutral-300'
                        : 'bg-neutral-50 border-neutral-200 opacity-80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-base text-[#8A0000]">
                          {reward.title}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-[#111111] text-[#D4A017] text-xs font-extrabold tabular-nums">
                          {reward.pointsCost} pts
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">
                        {reward.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!canRedeem || isBusy}
                      onClick={() => handleRedeem(reward)}
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                        canRedeem
                          ? 'bg-[#8A0000] hover:bg-[#6E0000] text-white'
                          : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      {isBusy
                        ? 'Resgatando...'
                        : canRedeem
                        ? `Resgatar ${formatCurrency(reward.discountAmount)} OFF`
                        : `Faltam ${reward.pointsCost - loyaltyAccount.balance} pts`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Redemption History */}
          {loyaltyAccount.history.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Histórico de Resgates</span>
              </h4>
              <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-200 text-xs">
                {loyaltyAccount.history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-[#111111]">{h.title}</span>
                    </div>
                    <span className="font-bold text-[#8A0000] tabular-nums">
                      -{h.pointsSpent} pts · {h.redeemedAt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
