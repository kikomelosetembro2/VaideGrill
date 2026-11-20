import React, { useState } from 'react';
import { Bell, CheckCircle2, ChefHat, Bike, Sparkles, X, RotateCcw } from 'lucide-react';
import { OrderStatus } from '../types';

export interface PushNotificationData {
  id: string;
  title: string;
  message: string;
  status: OrderStatus;
  orderId: string;
  timestamp: string;
}

interface PushNotificationToastProps {
  notifications: PushNotificationData[];
  onDismiss: (id: string) => void;
  onOpenOrderTracking: (orderId: string) => void;
  canPromptBrowserPush?: boolean;
  onAcceptNotifications?: () => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notifications,
  onDismiss,
  onOpenOrderTracking,
  canPromptBrowserPush = false,
  onAcceptNotifications,
}) => {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pedido_aceito':
        return <CheckCircle2 className="w-5 h-5 text-[#111111]" />;
      case 'pedido_andamento':
        return <ChefHat className="w-5 h-5 text-[#D4A017]" />;
      case 'pedido_mesa':
      case 'pedido_delivery':
        return <Bell className="w-5 h-5 text-[#8A0000]" />;
      case 'pedido_entrega':
        return <Bike className="w-5 h-5 text-[#D4A017]" />;
      case 'pedido_finalizado':
        return <Sparkles className="w-5 h-5 text-emerald-700" />;
      case 'pedido_devolvido':
        return <RotateCcw className="w-5 h-5 text-[#8A0000]" />;
      default:
        return <Bell className="w-5 h-5 text-[#8A0000]" />;
    }
  };

  return (
    <div className="fixed top-28 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {canPromptBrowserPush && !bannerDismissed && onAcceptNotifications && (
        <div className="pointer-events-auto bg-white border border-neutral-300 p-3 rounded-xl shadow-lg flex items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-[#111111]">
            <Bell className="w-4 h-4 text-[#8A0000] shrink-0" />
            <span className="font-medium">
              Ativar alerta do sistema quando seu pedido ficar pronto?
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onAcceptNotifications}
              className="bg-[#8A0000] hover:bg-[#6E0000] text-white font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer"
            >
              Ativar
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-neutral-400 hover:text-[#111111] cursor-pointer"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-white border border-neutral-300 p-4 rounded-xl shadow-xl flex items-start gap-3 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
            {getStatusIcon(notif.status)}
          </div>

          <div
            className="flex-1 cursor-pointer"
            onClick={() => onOpenOrderTracking(notif.orderId)}
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-extrabold text-[#111111] text-xs sm:text-sm">
                {notif.title}
              </h4>
              <span className="text-[10px] text-neutral-500 tabular-nums shrink-0">
                {notif.timestamp}
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-0.5 leading-snug">
              {notif.message}
            </p>
            <span className="text-[11px] text-[#8A0000] font-bold hover:underline inline-block mt-1">
              Acompanhar Comanda {notif.orderId} &rarr;
            </span>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(notif.id)}
            className="text-neutral-400 hover:text-[#111111] p-1"
            aria-label="Dispensar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
