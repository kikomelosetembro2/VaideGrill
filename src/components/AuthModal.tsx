import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  ArrowRight, 
  User, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { playSound } from '../utils/helpers';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; phone: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'method' | 'otp' | 'profile'>('method');
  const [phone, setPhone] = useState('(68) 99227-7408');
  const [name, setName] = useState('Cliente Vai de Grill');
  const [otpCode, setOtpCode] = useState(['5', '9', '2', '1', '0', '8']);
  const [simulatedReceivedCode, setSimulatedReceivedCode] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('ding');
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedReceivedCode(randomCode);
    setOtpCode(randomCode.split(''));
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('success');
    setStep('profile');
  };

  const handleFinishProfile = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('success');
    onLoginSuccess({
      name: name.trim() || 'Cliente Vai de Grill',
      phone: phone.trim(),
    });
    onClose();
  };

  const handleSocialLogin = (provider: 'Google' | 'Apple') => {
    playSound('success');
    onLoginSuccess({
      name: provider === 'Google' ? 'Usuário Google' : 'Usuário Apple ID',
      phone: '(68) 99227-7408',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#1c0c11] border border-[#eab308]/40 rounded-3xl shadow-2xl overflow-hidden my-auto p-6 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <VaiDeGrillLogo size="lg" />
          <h2 className="text-lg font-black text-white">
            {step === 'method' ? 'Acesse sua Conta Vai de Grill' :
             step === 'otp' ? 'Validação por SMS (OTP)' : 'Conclua seu Cadastro'}
          </h2>
          <p className="text-xs text-zinc-300 max-w-xs">
            {step === 'method' ? 'Entre para acumular pontos de fidelidade e acompanhar pedidos em tempo real.' :
             step === 'otp' ? `Enviamos um código de verificação para ${phone}` :
             'Como gostaria de ser chamado pelo entregador?'}
          </p>
        </div>

        {/* Step 1: Methods (Social + Phone) */}
        {step === 'method' && (
          <div className="space-y-4">
            {/* Social Logins */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                className="w-full flex items-center justify-center gap-3 bg-[#260f15] hover:bg-[#381420] text-white border border-zinc-750 py-3 rounded-2xl font-bold text-xs transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuar com Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('Apple')}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-200 text-black py-3 rounded-2xl font-bold text-xs transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.66-2.82 1.44-.58.67-1.1 1.77-.96 2.84 1.12.09 2.21-.59 2.82-1.33z" />
                </svg>
                <span>Continuar com Apple ID</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">
                ou Celular (WhatsApp)
              </span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            {/* Phone Form */}
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Número de Celular com DDD (68)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(68) 99227-7408"
                    className="w-full bg-zinc-900 border border-zinc-750 rounded-xl pl-10 pr-3 py-2.5 text-white font-bold text-xs focus:border-[#eab308] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black py-3 rounded-xl font-black text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Receber Código por SMS</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {simulatedReceivedCode && (
              <div className="bg-[#6b0f1a]/40 border border-[#eab308]/50 p-3 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#eab308] font-bold">
                  <MessageSquare className="w-4 h-4" />
                  <span>SMS Recebido (Simulação):</span>
                </div>
                <p className="text-zinc-200">
                  Seu código Vai de Grill é:{' '}
                  <strong className="text-white text-sm tracking-widest">{simulatedReceivedCode}</strong>
                </p>
              </div>
            )}

            <div className="flex justify-center gap-2">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const newOtp = [...otpCode];
                    newOtp[index] = e.target.value;
                    setOtpCode(newOtp);
                  }}
                  className="w-10 h-12 bg-zinc-900 border border-zinc-700 rounded-xl text-center text-lg font-black text-[#eab308] focus:border-[#eab308] focus:outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-black py-3 rounded-xl font-black text-xs shadow-md transition-transform active:scale-95"
            >
              Verificar Código e Continuar
            </button>

            <button
              type="button"
              onClick={() => setStep('method')}
              className="w-full text-center text-xs text-zinc-400 hover:text-white"
            >
              Trocar número de telefone
            </button>
          </form>
        )}

        {/* Step 3: Profile Name */}
        {step === 'profile' && (
          <form onSubmit={handleFinishProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Seu Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full bg-zinc-900 border border-zinc-750 rounded-xl pl-10 pr-3 py-2.5 text-white font-bold text-xs focus:border-[#eab308] focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black py-3 rounded-xl font-black text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Concluir e Fazer Pedido</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
