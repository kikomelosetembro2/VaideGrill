import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Layers, ArrowRight, Flame, Award } from 'lucide-react';
import { CategoryId } from '../types';

interface BannerCarouselProps {
  onOpenBuildBurger: () => void;
  onSelectCategory: (category: CategoryId) => void;
  onApplyCouponCode: (code: string) => void;
  onOpenFidelidade: () => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  onOpenBuildBurger,
  onSelectCategory,
  onApplyCouponCode,
  onOpenFidelidade,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'slide_campeao_grill',
      tag: '🔥 O Mais Pedido no Bairro João Eduardo',
      title: 'Combo Campeão Vai de Grill',
      subtitle: 'Blend Angus 200g grelhado na brasa com crosta suculenta, queijo cheddar melt cremoso, bacon caramelizado, batata rústica e refrigerante lata gelado!',
      priceText: 'Apenas R$ 47,90',
      badge: 'Economize R$ 11,00',
      bgGradient: 'from-[#580c1f] via-[#240a10] to-[#12080a]',
      accentColor: 'text-[#eab308]',
      image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=1000&q=80',
      buttonText: 'Pedir Este Combo',
      action: () => onSelectCategory('combos_grill'),
    },
    {
      id: 'slide_picanha_artesanal',
      tag: '🥩 Picanha na Grelha Raiz',
      title: 'Vai de Picanha Especial Grill',
      subtitle: 'Blend nobre de Picanha 200g moldado à mão, queijo provolone derretido, chimichurri fresco e maionese de alho-poró no pão australiano!',
      priceText: 'R$ 36,90',
      badge: 'Grelhado na Brasa',
      bgGradient: 'from-[#6b0f1a] via-[#2a0e16] to-[#12080a]',
      accentColor: 'text-[#facc15]',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80',
      buttonText: 'Ver Sanduíches',
      action: () => onSelectCategory('sanduiches_artesanais'),
    },
    {
      id: 'slide_clube_fidelidade',
      tag: '⭐ Clube VIP Vai de Grill',
      title: 'Ganhe Pontos em Cada Lanche!',
      subtitle: 'Cada R$ 1,00 gasto vira 1 ponto de fidelidade. Resgate batata frita, suco de cupuaçu regional ou cupons de até R$ 15 OFF no checkout.',
      priceText: 'Use: VAIDEGRILL10',
      badge: 'Pontos & Prêmios',
      bgGradient: 'from-[#3d0813] via-[#1f070b] to-[#12080a]',
      accentColor: 'text-[#eab308]',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80',
      buttonText: 'Ver Meus Pontos',
      action: () => onOpenFidelidade(),
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#eab308]/30 bg-[#16070a] shadow-2xl mb-8">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={slide.image}
          alt={slide.title}
          className="w-full h-full object-cover object-center opacity-25 transform scale-105 transition-all duration-1000 ease-out"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-95`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#eab308]/15 via-transparent to-transparent" />
      </div>

      {/* Slide Content */}
      <div className="relative z-10 p-6 sm:p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 min-h-[300px]">
        <div className="max-w-2xl space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
            <span className="bg-[#6b0f1a] border border-[#eab308]/50 text-[#facc15] text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#eab308]" />
              {slide.tag}
            </span>
            <span className="bg-[#eab308]/20 border border-[#eab308]/30 text-white text-xs font-extrabold px-2.5 py-1 rounded-full">
              {slide.badge}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {slide.title}
          </h1>

          <p className="text-zinc-200 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
            {slide.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
            <div className="text-2xl font-black text-[#eab308] drop-shadow">
              {slide.priceText}
            </div>

            <button
              onClick={slide.action}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black px-6 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-[#eab308]/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{slide.buttonText}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Promo Quick Card on the right */}
        <div className="hidden md:flex flex-col gap-3 bg-[#240e15]/95 border border-[#eab308]/40 p-5 rounded-3xl backdrop-blur-md max-w-xs shadow-2xl">
          <div className="flex items-center gap-2 text-[#eab308] font-black text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4 fill-[#eab308]" />
            <span>Vai de Grill • João Eduardo</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Rua A, 1176 - Rio Branco. Carnes suculentas grelhadas na brasa, pães amanteigados e molhos secretos da casa.
          </p>
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">Tempo de Brasa:</span>
            <span className="text-[#facc15] font-extrabold">25 - 40 min</span>
          </div>
          <button
            onClick={onOpenBuildBurger}
            className="w-full mt-1 py-2 bg-[#6b0f1a] hover:bg-[#7f1d1d] text-white border border-[#eab308]/40 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-[#eab308]" />
            <span>Montar Meu Burger do Zero</span>
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        aria-label="Slide anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-[#eab308] hover:text-black text-white flex items-center justify-center transition-colors border border-white/20"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        aria-label="Próximo slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-[#eab308] hover:text-black text-white flex items-center justify-center transition-colors border border-white/20"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Ir para slide ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              currentSlide === index ? 'w-8 bg-[#eab308]' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
