import React, { useState, useMemo } from 'react';
import {
  Star,
  Camera,
  UtensilsCrossed,
  Bike,
  Upload,
  X,
  MessageSquarePlus,
  CheckCircle2,
  Trash2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { EventReview } from '../types';
import { CATEGORY_IMAGES, resolveProductImage } from '../data/menuData';

interface EventsSectionProps {
  events: EventReview[];
  adminToken: string | null;
  onEventCreated: (evt: EventReview) => void;
  onEventDeleted: (eventId: string) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  adminToken,
  onEventCreated,
  onEventDeleted,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerMode, setCustomerMode] = useState<
    'mesa_presencial' | 'delivery_retirada'
  >('mesa_presencial');
  const [tableNumber, setTableNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'todos' | 'fotos_mesa' | 'cinco_estrelas'>('todos');

  const stats = useMemo(() => {
    const total = events.length;
    const avg =
      total > 0
        ? events.reduce((acc, e) => acc + (e.rating || 0), 0) / total
        : 5;
    const mesaPhotos = events.filter(
      (e) => e.customerMode === 'mesa_presencial' && e.photoUrl
    );
    return {
      total,
      average: avg.toFixed(1),
      mesaPhotosCount: mesaPhotos.length,
      mesaPhotos,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (feedFilter === 'fotos_mesa') {
      return events.filter(
        (e) => e.customerMode === 'mesa_presencial' && Boolean(e.photoUrl)
      );
    }
    if (feedFilter === 'cinco_estrelas') {
      return events.filter((e) => e.rating === 5);
    }
    return events;
  }, [events, feedFilter]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (customerMode !== 'mesa_presencial') {
      setErrorMsg('Upload de fotos da mesa é exclusivo para clientes presenciais.');
      return;
    }
    if (file.size > 1_500_000) {
      setErrorMsg('Foto muito grande. Escolha uma imagem JPG/PNG abaixo de 1.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleModeSwitch = (mode: 'mesa_presencial' | 'delivery_retirada') => {
    setCustomerMode(mode);
    if (mode !== 'mesa_presencial') {
      setPhotoUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (customerName.trim().length < 2) {
      setErrorMsg('Informe seu nome para publicar sua avaliação.');
      return;
    }
    if (customerMode === 'mesa_presencial' && !tableNumber.trim()) {
      setErrorMsg('Informe o número da sua mesa para atendimento presencial.');
      return;
    }
    if (comment.trim().length < 4) {
      setErrorMsg('Escreva um comentário sobre o atendimento, pratos ou ambiente.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerMode,
          tableNumber:
            customerMode === 'mesa_presencial' ? tableNumber.trim() : undefined,
          orderId: orderId.trim() || undefined,
          eventTitle: eventTitle.trim() || undefined,
          rating,
          comment: comment.trim(),
          photoUrl:
            customerMode === 'mesa_presencial' && photoUrl ? photoUrl : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.event) {
        throw new Error(data.error || 'Não foi possível enviar sua avaliação.');
      }
      onEventCreated(data.event as EventReview);
      setCustomerName('');
      setTableNumber('');
      setOrderId('');
      setEventTitle('');
      setRating(5);
      setComment('');
      setPhotoUrl('');
      setSuccessMsg('Obrigado! Sua avaliação foi publicada na aba de Eventos.');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao publicar avaliação.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      onEventDeleted(id);
    }
  };

  return (
    <section id="eventos" className="space-y-8">
      {/* Header & Metrics Summary */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8A0000]">
            <span className="w-6 h-0.5 bg-[#D4A017]" />
            <span>Eventos, Comentários & Mural das Mesas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Avalie nosso serviço e compartilhe momentos nas mesas
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Deixe sua avaliação com estrelas e comentários sobre o atendimento do Quiosk da Preta.{' '}
            <strong className="text-[#111111]">
              Clientes presenciais nas mesas
            </strong>{' '}
            têm espaço exclusivo para enviar fotos diretamente da sua mesa.
          </p>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
            <div className="flex items-center justify-center gap-1 text-[#D4A017]">
              <Star className="w-4 h-4 fill-[#D4A017]" />
              <span className="text-xl font-black text-[#111111] tabular-nums">
                {stats.average}
              </span>
            </div>
            <p className="text-[11px] font-bold text-neutral-500 mt-0.5">
              Nota Média
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
            <p className="text-xl font-black text-[#8A0000] tabular-nums">
              {stats.total}
            </p>
            <p className="text-[11px] font-bold text-neutral-500 mt-0.5">
              Avaliações
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
            <p className="text-xl font-black text-[#111111] tabular-nums">
              {stats.mesaPhotosCount}
            </p>
            <p className="text-[11px] font-bold text-neutral-500 mt-0.5">
              Fotos das Mesas
            </p>
          </div>
        </div>
      </div>

      {/* Main Split: Form (Left 5 cols) + Mural & Feed (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Publish Evaluation + Table Photo Upload */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-200">
            <MessageSquarePlus className="w-5 h-5 text-[#8A0000]" />
            <div>
              <h3 className="font-black text-base text-[#111111]">
                Publicar Avaliação / Foto da Mesa
              </h3>
              <p className="text-xs text-neutral-500">
                Sua opinião ajuda nossa cozinha e atendimento.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-[#8A0000] text-xs font-bold text-[#8A0000]">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-amber-50 border border-[#D4A017] text-xs font-bold text-[#111111] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#8A0000] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Customer Attendance Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111]">
              Tipo de Atendimento *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleModeSwitch('mesa_presencial')}
                className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  customerMode === 'mesa_presencial'
                    ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Cliente Presencial (Mesa)</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeSwitch('delivery_retirada')}
                className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  customerMode === 'delivery_retirada'
                    ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:border-[#111111]'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Delivery / Retirada</span>
              </button>
            </div>
          </div>

          {/* Name & Table Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={customerMode === 'mesa_presencial' ? '' : 'sm:col-span-2'}>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Seu Nome *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#8A0000]"
              />
            </div>

            {customerMode === 'mesa_presencial' && (
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nº da Mesa *
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: Mesa 04"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-bold text-[#111111] focus:outline-none focus:border-[#8A0000]"
                />
              </div>
            )}
          </div>

          {/* Optional Event Occasion & Order Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Ocasião / Evento (Opcional)
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Ex: Aniversário, Happy Hour"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-[#111111]"
              />
            </div>
            {customerMode === 'mesa_presencial' && (
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Nº da Comanda (Opcional)
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Ex: #0004"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs text-[#111111] tabular-nums"
                />
              </div>
            )}
          </div>

          {/* Star Rating Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#111111]">
              Avaliação do Serviço *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const active = starVal <= rating;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    className="p-1.5 rounded-lg border border-neutral-200 hover:border-[#D4A017] cursor-pointer transition-colors"
                    aria-label={`${starVal} estrelas`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        active
                          ? 'text-[#D4A017] fill-[#D4A017]'
                          : 'text-neutral-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-bold text-[#111111] tabular-nums">
                {rating} de 5 estrelas
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">
              Comentário sobre o Serviço e Pratos *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência no Quiosk da Preta..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#8A0000]"
            />
          </div>

          {/* Dedicated Upload Space — Strictly Presencial Table Customers Only */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#111111] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#8A0000]" />
                <span>Espaço de Foto da Mesa</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A0000]">
                Exclusivo Presencial
              </span>
            </div>

            {customerMode === 'mesa_presencial' ? (
              photoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-neutral-300 bg-white">
                  <img
                    src={photoUrl}
                    alt="Prévia da foto da mesa"
                    className="w-full h-44 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#111111]/85 text-white hover:bg-[#8A0000] cursor-pointer"
                    aria-label="Remover foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-neutral-300 hover:border-[#8A0000] rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 bg-white cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-[#8A0000]" />
                  <div>
                    <p className="text-xs font-bold text-[#111111]">
                      Clique para enviar uma foto da sua mesa
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      JPG, PNG ou WebP até 1.5MB · Disponível somente para clientes presenciais
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )
            ) : (
              <div className="p-3 rounded-lg bg-white border border-neutral-200 flex items-center gap-2.5 text-xs text-neutral-600">
                <Lock className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>
                  O envio de fotos das mesas é liberado apenas para{' '}
                  <strong className="text-[#111111]">clientes presenciais em mesa</strong>.
                  Você ainda pode publicar seu comentário e avaliação de serviço acima.
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#8A0000] hover:bg-[#6E0000] disabled:opacity-60 text-white font-extrabold py-3 px-5 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {submitting ? 'Publicando...' : 'Publicar Avaliação na Aba Eventos'}
          </button>
        </form>

        {/* Right: Table Photos Mural + Reviews Feed */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photo Mural of Presencial Tables */}
          {stats.mesaPhotos.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#8A0000]" />
                  <h3 className="font-black text-sm text-[#111111] uppercase tracking-wider">
                    Galeria das Mesas Presenciais
                  </h3>
                </div>
                <span className="text-xs font-bold text-neutral-500 tabular-nums">
                  {stats.mesaPhotosCount} {stats.mesaPhotosCount === 1 ? 'foto' : 'fotos'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.mesaPhotos.slice(0, 4).map((item) => (
                  <div
                    key={`mural_${item.id}`}
                    className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50"
                  >
                    <div className="aspect-[4/3] w-full bg-neutral-100 relative overflow-hidden">
                      <img
                        src={resolveProductImage(item.photoUrl)}
                        alt={`Foto da Mesa ${item.tableNumber} por ${item.customerName}`}
                        onError={(e) => {
                          e.currentTarget.src = CATEGORY_IMAGES.espetinhos;
                        }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-[#111111]/90 text-[#D4A017] px-2.5 py-1 rounded text-[11px] font-bold">
                        Mesa {item.tableNumber}
                      </div>
                    </div>
                    <div className="p-3 text-xs">
                      <p className="font-extrabold text-[#111111] truncate">
                        {item.eventTitle || item.customerName}
                      </p>
                      <p className="text-neutral-600 truncate">{item.customerName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Filter & List */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-black text-base text-[#111111]">
                Comentários & Avaliações ({filteredEvents.length})
              </h3>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'fotos_mesa', label: 'Com Foto da Mesa' },
                  { id: 'cinco_estrelas', label: '5 Estrelas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setFeedFilter(f.id as 'todos' | 'fotos_mesa' | 'cinco_estrelas')
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      feedFilter === f.id
                        ? 'bg-[#111111] text-[#D4A017] border-[#111111]'
                        : 'bg-white text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="p-8 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-xs text-neutral-500">
                Nenhuma avaliação encontrada neste filtro ainda. Seja o primeiro a comentar!
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((rev) => (
                  <article
                    key={rev.id}
                    className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-sm text-[#111111]">
                            {rev.customerName}
                          </h4>
                          <span className="text-neutral-300">·</span>
                          <span className="text-xs font-bold text-[#8A0000]">
                            {rev.customerMode === 'mesa_presencial'
                              ? `Cliente Presencial · Mesa ${rev.tableNumber}`
                              : 'Delivery / Retirada'}
                          </span>
                          {rev.verifiedTableOrder && (
                            <>
                              <span className="text-neutral-300">·</span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <Sparkles className="w-3 h-3" />
                                Comanda {rev.orderId}
                              </span>
                            </>
                          )}
                        </div>
                        {rev.eventTitle && (
                          <p className="text-xs font-bold text-neutral-700 mt-0.5">
                            {rev.eventTitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'text-[#D4A017] fill-[#D4A017]'
                                  : 'text-neutral-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-neutral-400 tabular-nums">
                          {rev.createdAt}
                        </span>
                        {adminToken && (
                          <button
                            type="button"
                            onClick={() => handleDelete(rev.id)}
                            className="p-1 text-neutral-400 hover:text-[#8A0000]"
                            title="Remover publicação (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-neutral-700 leading-relaxed">
                      {rev.comment}
                    </p>

                    {rev.photoUrl && rev.customerMode === 'mesa_presencial' && (
                      <div className="rounded-xl overflow-hidden border border-neutral-200 max-w-md bg-neutral-100">
                        <img
                          src={resolveProductImage(rev.photoUrl)}
                          alt={`Foto presencial Mesa ${rev.tableNumber}`}
                          onError={(e) => {
                            e.currentTarget.src = CATEGORY_IMAGES.espetinhos;
                          }}
                          className="w-full h-56 object-cover"
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
