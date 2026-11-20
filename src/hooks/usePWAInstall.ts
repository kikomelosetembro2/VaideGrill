import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standaloneMatch =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standaloneMatch);

    const ua = window.navigator.userAgent;
    const iosDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };
    mediaQuery.addEventListener?.('change', onDisplayModeChange);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      mediaQuery.removeEventListener?.('change', onDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<
    'accepted' | 'dismissed' | 'unavailable'
  > => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setJustInstalled(true);
    }
    return outcome;
  }, [deferredPrompt]);

  return {
    canPromptNative: Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    justInstalled,
    isIOS,
    install,
  };
}
