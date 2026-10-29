import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ChefHat, Bike, Sparkles, X, Volume2 } from 'lucide-react';
import { OrderStatus } from '../types';
import { playSound } from '../utils/helpers';
import { KikomeloLogo } from './KikomeloLogo';

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
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  notifications,
  onDismiss,
  onOpenOrderTracking,
}) => {
  const [hasBrowserPushPermission, setHasBrowserPushPermission] = useState<boolean>(false);

  useEffect(() => {
    if ('Notification' in window) {
      setHasBrowserPushPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setHasBrowserPushPermission(perm === 'granted');
        if (perm === 'granted') {
          playSound('success');
          new Notification('Kikomelo001 Delivery', {
            body: 'Notificações push ativadas com sucesso! Você receberá atualizações em tempo real do seu lanche.',
            icon: '/favicon.ico',
          });
        }
      } catch {
        // notification request error
      }
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'recebido': return <CheckCircle2 className="w-5 h-5 text-orange-400" />;
      case 'em_preparo': return <ChefHat className="w-5 h-5 text-amber-400" />;
      case 'pronto': return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
      case 'saiu_para_entrega': return <Bike className="w-5 h-5 text-purple-400" />;
      case 'entregue': return <Sparkles className="w-5 h-5 text-emerald-400" />;
      default: return <Bell className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {/* If browser push permission not requested yet, show gentle banner on desktop */}
      {!hasBrowserPushPermission && 'Notification' in window && (
        <div className="pointer-events-auto bg-zinc-950/95 border border-orange-500/40 p-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-400 animate-bounce" />
            <span className="text-zinc-200">
              Receber alertas de status do pedido na tela?
            </span>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="bg-orange-500 hover:bg-orange-600 text-black font-extrabold px-3 py-1 rounded-xl text-[11px] shrink-0"
          >
            Ativar
          </button>
        </div>
      )}

      {/* Render active notifications list */}
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-zinc-950/95 border border-orange-500/50 p-4 rounded-2xl shadow-2xl flex items-start gap-3 backdrop-blur-md animate-slide-in transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
            {getStatusIcon(notif.status)}
          </div>

          <div
            className="flex-1 cursor-pointer"
            onClick={() => onOpenOrderTracking(notif.orderId)}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-white text-xs sm:text-sm">
                {notif.title}
              </h4>
              <span className="text-[10px] text-zinc-500">{notif.timestamp}</span>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
              {notif.message}
            </p>
            <span className="text-[10px] text-orange-400 font-bold hover:underline inline-block mt-1">
              Ver no Mapa de Entrega &gt;
            </span>
          </div>

          <button
            onClick={() => onDismiss(notif.id)}
            className="text-zinc-500 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
