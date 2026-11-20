import React from 'react';
import { X, Phone, Clock, Instagram } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/menuData';

interface OriginalMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OriginalMenuModal: React.FC<OriginalMenuModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <div>
            <h3 className="font-black text-base text-[#111111]">
              Cardápio Original — {RESTAURANT_INFO.name}
            </h3>
            <p className="text-xs text-neutral-500 flex flex-wrap items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#D4A017]" />
                {RESTAURANT_INFO.openingHours}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Phone className="w-3.5 h-3.5 text-[#8A0000]" />
                {RESTAURANT_INFO.phone}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5 text-neutral-500" />
                {RESTAURANT_INFO.instagram}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:text-[#111111] hover:bg-neutral-100"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto bg-neutral-50 flex justify-center">
          <img
            src={RESTAURANT_INFO.originalMenuImage}
            alt="Cardápio Original Quiosk da Preta"
            className="max-w-full h-auto rounded-lg border border-neutral-200 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};
