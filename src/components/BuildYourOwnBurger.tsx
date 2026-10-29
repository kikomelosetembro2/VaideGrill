import React, { useState, useMemo } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Plus, 
  Sparkles, 
  Layers, 
  ChefHat, 
  Flame,
  Award
} from 'lucide-react';
import { BUILD_BURGER_CONFIG } from '../data/menuData';
import { CartItem, MenuItem } from '../types';
import { formatCurrency, playSound } from '../utils/helpers';
import { VaiDeGrillLogo } from './VaiDeGrillLogo';

interface BuildYourOwnBurgerProps {
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

export const BuildYourOwnBurger: React.FC<BuildYourOwnBurgerProps> = ({
  onClose,
  onAddToCart,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [burgerName, setBurgerName] = useState<string>('Minha Criação na Grelha');

  // Step 1: Bread
  const [selectedBread, setSelectedBread] = useState<string>('pao_brioche');

  // Step 2: Protein
  const [selectedProtein, setSelectedProtein] = useState<string>('carne_picanha_200');
  const [meatDoneness, setMeatDoneness] = useState<'mal_passado' | 'ao_ponto' | 'bem_passado'>('ao_ponto');

  // Step 3: Cheeses
  const [selectedCheeses, setSelectedCheeses] = useState<string[]>(['queijo_cheddar_melt']);

  // Step 4: Sauces
  const [selectedSauces, setSelectedSauces] = useState<string[]>(['molho_vai_de_grill']);

  // Step 5: Toppings
  const [selectedToppings, setSelectedToppings] = useState<string[]>(['bacon_tiras_artesanal', 'cebola_crispy_dourada']);

  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Toggle multi selections
  const toggleSelection = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, id: string) => {
    playSound('ding');
    if (list.includes(id)) {
      setList(list.filter((item) => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  // Resolve objects
  const breadObj = BUILD_BURGER_CONFIG.breads.find((b) => b.id === selectedBread) || BUILD_BURGER_CONFIG.breads[0];
  const proteinObj = BUILD_BURGER_CONFIG.proteins.find((p) => p.id === selectedProtein) || BUILD_BURGER_CONFIG.proteins[0];
  const cheesesObj = BUILD_BURGER_CONFIG.cheeses.filter((c) => selectedCheeses.includes(c.id));
  const saucesObj = BUILD_BURGER_CONFIG.sauces.filter((s) => selectedSauces.includes(s.id));
  const toppingsObj = BUILD_BURGER_CONFIG.toppings.filter((t) => selectedToppings.includes(t.id));

  // Live Unit Price
  const unitPrice = useMemo(() => {
    let sum = 0;
    sum += breadObj.price;
    sum += proteinObj.price;
    cheesesObj.forEach((c) => (sum += c.price));
    saucesObj.forEach((s) => (sum += s.price));
    toppingsObj.forEach((t) => (sum += t.price));
    return sum;
  }, [breadObj, proteinObj, cheesesObj, saucesObj, toppingsObj]);

  const totalPrice = unitPrice * quantity;

  // Steps configuration
  const steps = [
    { num: 1, title: '1. Pão da Brasa', icon: '🍞' },
    { num: 2, title: '2. Corte & Ponto', icon: '🥩' },
    { num: 3, title: '3. Queijos Melt', icon: '🧀' },
    { num: 4, title: '4. Molhos da Casa', icon: '🥫' },
    { num: 5, title: '5. Toppings Crocantes', icon: '🥓' },
    { num: 6, title: '6. Finalizar', icon: '✨' },
  ];

  const handleNext = () => {
    playSound('ding');
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    playSound('ding');
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    playSound('success');

    const customItem: MenuItem = {
      id: `custom_burger_${Date.now()}`,
      name: burgerName || 'Sanduíche Personalizado Vai de Grill',
      category: 'sanduiches_artesanais',
      description: `${breadObj.name} + ${proteinObj.name} + Queijos: ${cheesesObj.map((c) => c.name).join(', ') || 'Nenhum'} + Molhos: ${saucesObj.map((s) => s.name).join(', ') || 'Nenhum'} + Toppings: ${toppingsObj.map((t) => t.name).join(', ') || 'Nenhum'}`,
      price: unitPrice,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      badge: 'Monte seu Sanduíche',
      prepTimeMinutes: 25,
      defaultIngredients: [
        breadObj.name,
        proteinObj.name,
        ...cheesesObj.map((c) => c.name),
        ...saucesObj.map((s) => s.name),
        ...toppingsObj.map((t) => t.name),
      ],
      removableIngredients: [],
      availableExtras: [],
    };

    const cartItem: CartItem = {
      cartItemId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      menuItem: customItem,
      quantity,
      customization: {
        removedIngredients: [],
        addedExtras: {},
        meatDoneness,
        specialNotes: specialNotes.trim() || undefined,
      },
      unitPrice,
      totalPrice,
      isCustomBurger: true,
      customBurgerLayers: {
        bread: breadObj.name,
        protein: proteinObj.name,
        cheeses: cheesesObj.map((c) => c.name),
        sauces: saucesObj.map((s) => s.name),
        toppings: toppingsObj.map((t) => t.name),
      },
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#1c0c11] border border-[#eab308]/40 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <VaiDeGrillLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Monte seu Sanduíche na Brasa
                </h2>
                <span className="bg-[#eab308] text-black text-[10px] font-black px-2 py-0.5 rounded">
                  Vai de Grill
                </span>
              </div>
              <p className="text-xs text-zinc-300">
                Escolha cada camada e monte o burger dos seus sonhos!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-[#6b0f1a] text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-4 py-3 bg-[#18080c] border-b border-zinc-850 overflow-x-auto shrink-0 flex items-center justify-between gap-1 sm:gap-2">
          {steps.map((st) => (
            <button
              key={st.num}
              onClick={() => {
                playSound('ding');
                setCurrentStep(st.num);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                currentStep === st.num
                  ? 'bg-[#eab308] text-black shadow-md shadow-[#eab308]/20 scale-105'
                  : currentStep > st.num
                  ? 'bg-[#3b121c] text-[#facc15] border border-[#eab308]/40'
                  : 'bg-zinc-900/60 text-zinc-500 border border-zinc-800'
              }`}
            >
              <span>{st.icon}</span>
              <span className="hidden md:inline">{st.title}</span>
              <span className="md:hidden">Passo {st.num}</span>
              {currentStep > st.num && <Check className="w-3 h-3 text-[#eab308]" />}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left / Middle: Step Options Selection */}
          <div className="p-4 sm:p-6 lg:col-span-8 overflow-y-auto space-y-4">
            {/* Step 1: Pão */}
            {currentStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span className="text-xl">🍞</span> Passo 1: Escolha o Pão Selado na Brasa
                  </h3>
                  <span className="text-xs text-[#eab308] font-bold">1 opção</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BUILD_BURGER_CONFIG.breads.map((bread) => {
                    const isSelected = selectedBread === bread.id;
                    return (
                      <div
                        key={bread.id}
                        onClick={() => {
                          playSound('ding');
                          setSelectedBread(bread.id);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#3b121c] border-[#eab308] ring-2 ring-[#eab308]/40 shadow-lg'
                            : 'bg-[#240e15] border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-white text-sm">{bread.name}</h4>
                          <span className="text-xs font-black text-[#eab308]">
                            {formatCurrency(bread.price)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {bread.description}
                        </p>
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-1 text-[11px] font-black text-[#eab308]">
                            <Check className="w-3.5 h-3.5" /> Selecionado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Proteína */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span className="text-xl">🥩</span> Passo 2: Corte de Carne & Grelha
                  </h3>
                  <span className="text-xs text-[#eab308] font-bold">1 opção</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {BUILD_BURGER_CONFIG.proteins.map((protein) => {
                    const isSelected = selectedProtein === protein.id;
                    return (
                      <div
                        key={protein.id}
                        onClick={() => {
                          playSound('ding');
                          setSelectedProtein(protein.id);
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#3b121c] border-[#eab308] ring-2 ring-[#eab308]/40 shadow-lg'
                            : 'bg-[#240e15] border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[80%]">
                          <div className="font-extrabold text-white text-sm flex items-center gap-2">
                            <span>{protein.name}</span>
                            {protein.id === 'carne_picanha_200' && (
                              <span className="text-[10px] bg-[#eab308] text-black px-1.5 py-0.2 rounded font-black">
                                Picanha Nobre
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">{protein.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-[#eab308]">
                            {formatCurrency(protein.price)}
                          </span>
                          {isSelected && (
                            <div className="text-[10px] font-black text-[#eab308] flex items-center justify-end gap-0.5 mt-1">
                              <Check className="w-3 h-3 stroke-[3]" /> Escolhido
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Meat Doneness Selector */}
                {selectedProtein.includes('carne') && (
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                      Ponto da carne para a grelha:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'mal_passado', label: 'Mal Passado' },
                        { id: 'ao_ponto', label: 'Ao Ponto ⭐' },
                        { id: 'bem_passado', label: 'Bem Passado' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setMeatDoneness(d.id as any)}
                          className={`py-2 px-1 text-xs rounded-xl border text-center font-bold transition-all ${
                            meatDoneness === d.id
                              ? 'bg-[#6b0f1a] border-[#eab308] text-white shadow'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Queijos */}
            {currentStep === 3 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span className="text-xl">🧀</span> Passo 3: Queijos Melt Fundidos
                    </h3>
                    <p className="text-xs text-zinc-400">Pode selecionar quantos queijos desejar:</p>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold">{selectedCheeses.length} selecionado(s)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUILD_BURGER_CONFIG.cheeses.map((cheese) => {
                    const isSelected = selectedCheeses.includes(cheese.id);
                    return (
                      <div
                        key={cheese.id}
                        onClick={() => toggleSelection(selectedCheeses, setSelectedCheeses, cheese.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#3b121c] border-[#eab308] ring-2 ring-[#eab308]/40'
                            : 'bg-[#240e15] border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <h4 className="font-extrabold text-white text-xs sm:text-sm">{cheese.name}</h4>
                          <p className="text-[11px] text-zinc-400">{cheese.description}</p>
                          <span className="text-xs font-black text-[#eab308] mt-1 inline-block">
                            +{formatCurrency(cheese.price)}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#eab308] text-black font-black' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Molhos */}
            {currentStep === 4 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span className="text-xl">🥫</span> Passo 4: Molhos Especiais da Casa
                    </h3>
                    <p className="text-xs text-zinc-400">Receitas artesanais Vai de Grill:</p>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold">{selectedSauces.length} selecionado(s)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUILD_BURGER_CONFIG.sauces.map((sauce) => {
                    const isSelected = selectedSauces.includes(sauce.id);
                    return (
                      <div
                        key={sauce.id}
                        onClick={() => toggleSelection(selectedSauces, setSelectedSauces, sauce.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#3b121c] border-[#eab308] ring-2 ring-[#eab308]/40'
                            : 'bg-[#240e15] border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <h4 className="font-extrabold text-white text-xs sm:text-sm">{sauce.name}</h4>
                          <p className="text-[11px] text-zinc-400">{sauce.description}</p>
                          <span className="text-xs font-black text-[#eab308] mt-1 inline-block">
                            +{formatCurrency(sauce.price)}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#eab308] text-black font-black' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Saladas & Toppings */}
            {currentStep === 5 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span className="text-xl">🥓</span> Passo 5: Bacon, Cebola & Toppings
                    </h3>
                    <p className="text-xs text-zinc-400">Finalize com crocância e suculência:</p>
                  </div>
                  <span className="text-xs text-zinc-400 font-bold">{selectedToppings.length} selecionado(s)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BUILD_BURGER_CONFIG.toppings.map((top) => {
                    const isSelected = selectedToppings.includes(top.id);
                    return (
                      <div
                        key={top.id}
                        onClick={() => toggleSelection(selectedToppings, setSelectedToppings, top.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#3b121c] border-[#eab308] ring-2 ring-[#eab308]/40'
                            : 'bg-[#240e15] border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          <h4 className="font-extrabold text-white text-xs sm:text-sm">{top.name}</h4>
                          <p className="text-[11px] text-zinc-400">{top.description}</p>
                          <span className="text-xs font-black text-[#eab308] mt-1 inline-block">
                            +{formatCurrency(top.price)}
                          </span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#eab308] text-black font-black' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 6: Review & Final Details */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="bg-[#240e15] border border-[#eab308]/40 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-[#eab308] font-black text-sm">
                    <Award className="w-4 h-4" />
                    <span>Dê um Nome Para Sua Obra de Arte na Brasa</span>
                  </div>
                  <input
                    type="text"
                    value={burgerName}
                    onChange={(e) => setBurgerName(e.target.value)}
                    placeholder="Ex: Monstro da Picanha João Eduardo..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold focus:border-[#eab308] focus:outline-none text-sm"
                  />
                </div>

                <div className="bg-[#240e15]/70 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
                  <h4 className="text-xs font-black text-[#eab308] uppercase tracking-wider">
                    Camadas Selecionadas na Grelha:
                  </h4>
                  <ul className="space-y-1 text-zinc-200">
                    <li className="flex justify-between">
                      <span className="font-bold text-white">Pão:</span>
                      <span>{breadObj.name} ({formatCurrency(breadObj.price)})</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-white">Carne:</span>
                      <span>{proteinObj.name} ({formatCurrency(proteinObj.price)})</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-white">Ponto da Grelha:</span>
                      <span className="capitalize">{meatDoneness.replace('_', ' ')}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-white">Queijos:</span>
                      <span>{cheesesObj.map((c) => c.name).join(', ') || 'Nenhum'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-white">Molhos:</span>
                      <span>{saucesObj.map((s) => s.name).join(', ') || 'Nenhum'}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-bold text-white">Toppings:</span>
                      <span>{toppingsObj.map((t) => t.name).join(', ') || 'Nenhum'}</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-300">
                    Instruções Especiais para a Cozinha / Churrasqueiro:
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Ex: Cortar ao meio, mandar maionese extra em potinho..."
                    className="w-full bg-zinc-950 border border-zinc-750 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#eab308] resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visual Burger Layer Graphic */}
          <div className="p-4 sm:p-6 lg:col-span-4 bg-[#240e15]/80 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#eab308]" />
                  <span>Camadas da Grelha</span>
                </span>
                <span className="text-[10px] bg-[#eab308] text-black font-black px-2 py-0.5 rounded">
                  Tempo Real
                </span>
              </div>

              {/* Graphic Layered Sandwich Visualizer */}
              <div className="bg-[#12080a] p-4 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden shadow-inner">
                <div className="w-full max-w-[200px] flex flex-col items-center gap-1.5 py-2">
                  {/* Top Bun */}
                  <div
                    className="w-36 h-9 rounded-t-full shadow-md flex items-center justify-center text-[10px] font-black text-black transition-all"
                    style={{ backgroundColor: breadObj.color }}
                  >
                    🍞 {breadObj.name.split(' ')[1] || 'Pão Top'}
                  </div>

                  {/* Sauces layer */}
                  {saucesObj.map((s) => (
                    <div
                      key={s.id}
                      className="w-32 h-2.5 rounded-full shadow-sm text-[9px] font-bold text-white flex items-center justify-center transition-all animate-pulse"
                      style={{ backgroundColor: s.color }}
                      title={s.name}
                    />
                  ))}

                  {/* Toppings layer */}
                  {toppingsObj.map((t) => (
                    <div
                      key={t.id}
                      className="w-34 h-3.5 rounded-lg shadow-sm text-[9px] font-bold text-white flex items-center justify-center truncate px-1 transition-all"
                      style={{ backgroundColor: t.color }}
                      title={t.name}
                    >
                      {t.name.split(' ')[0]}
                    </div>
                  ))}

                  {/* Cheeses layer */}
                  {cheesesObj.map((c) => (
                    <div
                      key={c.id}
                      className="w-36 h-3 rounded-md shadow-inner text-[9px] font-black text-black flex items-center justify-center truncate px-1 transition-all"
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    >
                      🧀 {c.name.split(' ')[0]}
                    </div>
                  ))}

                  {/* Meat / Protein layer */}
                  <div
                    className="w-36 h-8 rounded-xl shadow-lg text-[10px] font-black text-white flex items-center justify-center px-1 transition-all"
                    style={{ backgroundColor: proteinObj.color }}
                  >
                    🥩 {proteinObj.name.split(' ')[0]} {proteinObj.name.split(' ')[1] || ''}
                  </div>

                  {/* Bottom Bun */}
                  <div
                    className="w-36 h-6 rounded-b-2xl shadow-md flex items-center justify-center text-[10px] font-black text-black transition-all"
                    style={{ backgroundColor: breadObj.color }}
                  >
                    🍞 Base da Brasa
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown in side box */}
            <div className="bg-[#140608] p-3.5 rounded-2xl border border-[#eab308]/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total por Unidade:</span>
                <span className="text-sm font-bold text-white">{formatCurrency(unitPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Quantidade:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-5 h-5 rounded bg-zinc-800 text-white flex items-center justify-center text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold text-white text-xs">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-5 h-5 rounded bg-zinc-800 text-white flex items-center justify-center text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-xs font-black text-white">Subtotal:</span>
                <span className="text-base font-black text-[#eab308]">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Step Actions Footer */}
        <div className="p-4 sm:p-5 bg-[#260f15] border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <div className="text-xs text-zinc-400 hidden sm:block">
            Passo {currentStep} de 6
          </div>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#eab308] hover:bg-[#ca8a04] text-black px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105"
            >
              <span>Próximo Passo</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:from-[#facc15] hover:to-[#eab308] text-black px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl shadow-[#eab308]/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Adicionar Sanduíche • {formatCurrency(totalPrice)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
