import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  MoreVertical,
  CheckCircle2,
  X,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'hero' | 'footer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
}) => {
  const { canPromptNative, isInstalled, justInstalled, isIOS, install } =
    usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Suppress install UI completely when already running inside installed standalone app
  if (isInstalled) {
    return null;
  }

  const handlePrimaryClick = async () => {
    // If desktop/Android header quick install works directly or opens rich preview modal
    setInstallFeedback(null);
    setIsModalOpen(true);
  };

  const handleNativeInstall = async () => {
    setInstalling(true);
    setInstallFeedback(null);
    try {
      const outcome = await install();
      if (outcome === 'accepted') {
        setInstallFeedback(
          'Aplicativo instalado! O ícone do Quiosk da Preta aparecerá na tela inicial do seu celular.'
        );
      } else if (outcome === 'dismissed') {
        setInstallFeedback(
          'Instalação cancelada. Você pode instalar quando quiser pelo botão abaixo.'
        );
      } else {
        setInstallFeedback(
          'Prompt automático indisponível neste navegador. Siga os passos rápidos para Android ou iPhone ao lado.'
        );
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyAppUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore clipboard errors in restricted frames
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-300 hover:border-[#8A0000] bg-white hover:bg-[#8A0000]/5 text-[#111111] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="Instalar App Quiosk da Preta no Celular"
        >
          <img
            src="/pwa-192x192.png"
            alt="Ícone Quiosk da Preta"
            className="w-5 h-5 rounded object-cover border border-neutral-200"
          />
          <span className="hidden sm:inline">Instalar App</span>
          <Download className="w-3.5 h-3.5 text-[#8A0000]" />
        </button>
      )}

      {variant === 'hero' && (
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="border border-[#111111] bg-[#111111] hover:bg-neutral-800 text-white font-bold px-4 py-3.5 rounded-lg text-sm flex items-center gap-2.5 transition-colors cursor-pointer"
        >
          <img
            src="/pwa-192x192.png"
            alt="Ícone do App Quiosk da Preta"
            className="w-5 h-5 rounded bg-white object-cover"
          />
          <span>Instalar App no Celular</span>
          <Smartphone className="w-4 h-4 text-[#D4A017]" />
        </button>
      )}

      {variant === 'footer' && (
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="inline-flex items-center gap-2 font-bold text-[#8A0000] hover:underline cursor-pointer"
        >
          <img
            src="/pwa-192x192.png"
            alt="Ícone Quiosk da Preta"
            className="w-4 h-4 rounded object-cover border border-neutral-300"
          />
          <span>Instalar App no Celular (Android / iPhone)</span>
        </button>
      )}

      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
          >
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#111111] text-white px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Logo Quiosk da Preta"
                  className="w-10 h-10 rounded-xl bg-white p-0.5 object-contain border border-[#D4A017]"
                />
                <div>
                  <h2
                    id="pwa-install-title"
                    className="font-black text-base tracking-tight text-white"
                  >
                    Instalar App Quiosk da Preta
                  </h2>
                  <p className="text-[11px] text-neutral-300">
                    Ícone oficial na tela inicial · Acesso rápido & offline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar janela de instalação"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Brand Icon Launcher Preview Card */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-16 h-16 rounded-2xl shadow-md border border-neutral-200 overflow-hidden bg-white p-0.5">
                    <img
                      src="/pwa-192x192.png"
                      alt="Ícone Tela Inicial Quiosk da Preta"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#111111] tracking-tight">
                    QuioskPreta
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-neutral-700">
                  <p className="font-extrabold text-[#111111] text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D4A017]" />
                    <span>Cardápio sempre à mão no seu celular</span>
                  </p>
                  <p className="leading-relaxed">
                    Ao instalar, o aplicativo ganha o{' '}
                    <strong className="text-[#111111]">
                      ícone oficial da logo marca Quiosk da Preta
                    </strong>{' '}
                    na sua tela inicial, abre em tela cheia e mantém o cardápio
                    salvo mesmo sem internet.
                  </p>
                </div>
              </div>

              {/* Feedback Banner */}
              {(justInstalled || installFeedback) && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 text-xs font-semibold flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    {installFeedback ||
                      'Aplicativo instalado com sucesso! Confira o ícone na tela inicial.'}
                  </span>
                </div>
              )}

              {/* Direct 1-Click Install Section (when browser supports prompt) */}
              {canPromptNative ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={installing}
                    onClick={handleNativeInstall}
                    className="w-full bg-[#8A0000] hover:bg-[#6E0000] disabled:opacity-60 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#D4A017]" />
                    <span>
                      {installing
                        ? 'Instalando aplicativo...'
                        : 'Instalar Aplicativo Agora'}
                    </span>
                  </button>
                  <p className="text-[11px] text-neutral-500 text-center">
                    Instalação direta e segura com o ícone Quiosk da Preta.
                  </p>
                </div>
              ) : null}

              {/* Step-by-Step Platform Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Android / Chrome Instructions */}
                <div
                  className={`rounded-xl border p-4 space-y-2.5 ${
                    !isIOS
                      ? 'border-[#8A0000]/40 bg-[#8A0000]/[0.02]'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#8A0000]">
                      Android (Chrome)
                    </span>
                    <MoreVertical className="w-4 h-4 text-neutral-500" />
                  </div>
                  <ol className="text-xs text-neutral-700 space-y-1.5 list-decimal list-inside">
                    <li>
                      Toque no menu{' '}
                      <strong className="text-[#111111]">⋮</strong> no canto
                      superior do Chrome.
                    </li>
                    <li>
                      Selecione{' '}
                      <strong className="text-[#111111]">
                        Instalar aplicativo
                      </strong>{' '}
                      ou{' '}
                      <strong className="text-[#111111]">
                        Adicionar à tela inicial
                      </strong>
                      .
                    </li>
                    <li>
                      Confirme em{' '}
                      <strong className="text-[#111111]">Instalar</strong> para
                      fixar o ícone da logo.
                    </li>
                  </ol>
                </div>

                {/* iOS / Safari Instructions */}
                <div
                  className={`rounded-xl border p-4 space-y-2.5 ${
                    isIOS
                      ? 'border-[#8A0000]/40 bg-[#8A0000]/[0.02]'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
                      iPhone / iPad (Safari)
                    </span>
                    <Share className="w-4 h-4 text-[#D4A017]" />
                  </div>
                  <ol className="text-xs text-neutral-700 space-y-1.5 list-decimal list-inside">
                    <li>
                      Abra no <strong className="text-[#111111]">Safari</strong>{' '}
                      e toque em{' '}
                      <strong className="text-[#111111]">Compartilhar</strong>{' '}
                      (quadrado com seta).
                    </li>
                    <li className="inline-flex items-center gap-1 flex-wrap">
                      <span>Role e toque em</span>
                      <strong className="text-[#111111] inline-flex items-center gap-1">
                        <PlusSquare className="w-3.5 h-3.5 text-[#8A0000]" />
                        Adicionar à Tela de Início
                      </strong>
                      .
                    </li>
                    <li>
                      Toque em{' '}
                      <strong className="text-[#111111]">Adicionar</strong> no
                      canto superior direito.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Copy App Link Utility for Opening on Mobile */}
              <div className="border-t border-neutral-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-neutral-600 font-medium">
                  Quer enviar o link do App para outro celular?
                </span>
                <button
                  type="button"
                  onClick={handleCopyAppUrl}
                  className="px-3 py-2 rounded-lg border border-neutral-300 hover:border-[#111111] text-xs font-bold text-[#111111] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#8A0000]" />
                      <span>Copiar Link do App</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
};
