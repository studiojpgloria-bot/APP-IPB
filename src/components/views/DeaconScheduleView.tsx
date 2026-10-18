import React, { useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Car,
  ClipboardList,
  Clock,
  Copy,
  DoorOpen,
  Flame,
  HandHeart,
  Info,
  MessageCircle,
  Moon,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { DeaconScheduleCategory, DeaconScheduleItem } from '../../types';

export const CATEGORY_META: Record<
  DeaconScheduleCategory,
  {
    label: string;
    shortLabel: string;
    subtitle: string;
    badgeBg: string;
    badgeText: string;
    borderAccent: string;
  }
> = {
  semana_oracao: {
    label: '1ª Semana do Mês — Semana de Oração',
    shortLabel: 'Semana de Oração',
    subtitle: 'Reuniões de clamor e intercessão na primeira semana do mês',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    borderAccent: 'border-l-amber-500'
  },
  quinta_estudo: {
    label: 'Quintas-feiras — Culto de Estudo e Oração',
    shortLabel: 'Quinta (Estudo e Oração)',
    subtitle: 'Plantão semanal nas quintas-feiras para o Culto de Estudo Bíblico e Oração',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    borderAccent: 'border-l-[#344E41]'
  },
  domingo_manha: {
    label: 'Domingo pela Manhã — Culto Matutino',
    shortLabel: 'Domingo (Manhã)',
    subtitle: 'Plantão dominical matutino e apoio à Escola Bíblica',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    borderAccent: 'border-l-sky-600'
  },
  domingo_noite: {
    label: 'Domingo à Noite — Culto Noturno',
    shortLabel: 'Domingo (Noite)',
    subtitle: 'Plantão dominical vespertino/noturno de adoração comunitária',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    borderAccent: 'border-l-indigo-600'
  },
  evento_especial: {
    label: 'Espaço Reservado para Eventos Especiais',
    shortLabel: 'Evento Especial',
    subtitle: 'Programações extras, conferências, casamentos, vigílias ou celebrações especiais',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    borderAccent: 'border-l-purple-600'
  }
};

export const DeaconScheduleView: React.FC = () => {
  const { deaconSchedules, isMobileAppPreview, showToast, isManagerAuthenticated, setCurrentView } = useChurch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | DeaconScheduleCategory>('ALL');

  const todayIso = new Date().toISOString().split('T')[0];

  // Ensure every item has a valid category (fallback if older item)
  const normalizedSchedules: DeaconScheduleItem[] = deaconSchedules.map((item) => {
    if (item.category && CATEGORY_META[item.category]) return item;
    const lower = item.serviceName.toLowerCase();
    let cat: DeaconScheduleCategory = 'domingo_noite';
    if (lower.includes('semana de oração') || lower.includes('1ª semana')) cat = 'semana_oracao';
    else if (lower.includes('quinta') || lower.includes('estudo')) cat = 'quinta_estudo';
    else if (lower.includes('manhã') || lower.includes('matutino') || item.time.startsWith('08') || item.time.startsWith('09')) cat = 'domingo_manha';
    else if (lower.includes('evento') || lower.includes('especial')) cat = 'evento_especial';
    return { ...item, category: cat };
  });

  // Sort chronologically
  const sortedSchedules = [...normalizedSchedules].sort((a, b) => {
    const cmpDate = a.date.localeCompare(b.date);
    if (cmpDate !== 0) return cmpDate;
    return a.time.localeCompare(b.time);
  });

  // Filter by search & category
  const filteredSchedules = sortedSchedules.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const allNames = [
      item.coordinator,
      ...item.receptionTeam,
      ...item.offeringAndCommunionTeam,
      ...item.parkingAndOrderTeam
    ]
      .join(' ')
      .toLowerCase();

    return (
      allNames.includes(q) ||
      item.serviceName.toLowerCase().includes(q) ||
      item.date.includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const nextDuty = sortedSchedules.find((s) => s.date >= todayIso) || sortedSchedules[0];

  const formatScheduleDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
      });
    } catch {
      return dateStr;
    }
  };

  const buildShareText = (item: DeaconScheduleItem) => {
    const formattedDate = formatScheduleDate(item.date);
    const catMeta = CATEGORY_META[item.category] || CATEGORY_META.domingo_noite;
    return [
      `📋 *ESCALA DA JUNTA DIACONAL - IPC*`,
      `🏷️ *Modalidade:* ${catMeta.shortLabel}`,
      `📅 *Data:* ${formattedDate} às ${item.time}`,
      `⛪ *Culto/Programação:* ${item.serviceName}`,
      `👤 *Coordenador(a) do Dia:* ${item.coordinator}`,
      ``,
      `🚪 *Recepção e Porta:* ${item.receptionTeam.join(', ') || 'A definir'}`,
      `🍞 *Ofertas e Santa Ceia:* ${item.offeringAndCommunionTeam.join(', ') || 'A definir'}`,
      `🚗 *Pátio e Ordem:* ${item.parkingAndOrderTeam.join(', ') || 'A definir'}`,
      item.notes ? `\n📌 *Observações:* ${item.notes}` : ''
    ]
      .filter(Boolean)
      .join('\n');
  };

  const buildFullMonthShareText = () => {
    const lines: string[] = [
      `📋 *QUADRO GERAL DE ESCALA DE DIÁCONOS - IPC*`,
      `====================================`,
      ``
    ];

    const groups: { key: DeaconScheduleCategory; title: string }[] = [
      { key: 'semana_oracao', title: '🔥 *1ª SEMANA DO MÊS — SEMANA DE ORAÇÃO*' },
      { key: 'quinta_estudo', title: '📖 *QUINTAS-FEIRAS — CULTO DE ESTUDO E ORAÇÃO*' },
      { key: 'domingo_manha', title: '☀️ *DOMINGOS PELA MANHÃ — CULTO MATUTINO*' },
      { key: 'domingo_noite', title: '🌙 *DOMINGOS À NOITE — CULTO NOTURNO*' },
      { key: 'evento_especial', title: '⭐ *ESPAÇO RESERVADO PARA EVENTOS ESPECIAIS*' }
    ];

    for (const g of groups) {
      lines.push(g.title);
      const items = sortedSchedules.filter((s) => s.category === g.key);
      if (items.length === 0) {
        lines.push(`_Espaço reservado (sem escala cadastrada no momento)_`);
      } else {
        for (const it of items) {
          const dStr = new Date(it.date + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
          });
          lines.push(
            `• *${dStr} (${it.time}) - ${it.serviceName}*\n  Coord.: ${it.coordinator} | Porta: ${it.receptionTeam.join(', ')} | Ofertas/Ceia: ${it.offeringAndCommunionTeam.join(', ')} | Pátio: ${it.parkingAndOrderTeam.join(', ')}`
          );
        }
      }
      lines.push(``);
    }

    return lines.join('\n');
  };

  const handleCopySchedule = (item: DeaconScheduleItem) => {
    navigator.clipboard.writeText(buildShareText(item));
    showToast('Escala copiada para a área de transferência!');
  };

  const handleShareWhatsApp = (item: DeaconScheduleItem) => {
    const text = encodeURIComponent(buildShareText(item));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareFullTableWhatsApp = () => {
    const text = encodeURIComponent(buildFullMonthShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const renderScheduleCard = (item: DeaconScheduleItem) => {
    const isToday = item.date === todayIso;
    const catMeta = CATEGORY_META[item.category] || CATEGORY_META.domingo_noite;

    return (
      <div
        key={item.id}
        className={`bg-white rounded-2xl p-5 border border-l-4 transition-all flex flex-col justify-between gap-4 ${catMeta.borderAccent} ${
          isToday
            ? 'border-[#344E41] ring-1 ring-[#344E41]/20 shadow-xs'
            : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="space-y-3.5">
          {/* Top Date & Time Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2.5 border-b border-stone-100">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-[#344E41] shrink-0" />
              <span className="text-xs font-bold text-stone-900 capitalize">
                {formatScheduleDate(item.date)}
              </span>
              {isToday && (
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Hoje
                </span>
              )}
            </div>
            <span className="text-xs font-mono font-bold bg-[#EAF0EC] text-[#344E41] px-2.5 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {item.time}
            </span>
          </div>

          {/* Category Badge + Service Title & Coordinator */}
          <div className="space-y-1.5">
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${catMeta.badgeBg} ${catMeta.badgeText}`}>
              {catMeta.shortLabel}
            </span>
            <h4 className="font-bold text-stone-900 text-base leading-snug">
              {item.serviceName}
            </h4>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#344E41] bg-[#EAF0EC]/70 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Coordenador(a): {item.coordinator}</span>
            </div>
          </div>

          {/* Teams Breakdown */}
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70">
              <span className="font-bold text-stone-700 flex items-center gap-1.5 mb-0.5">
                <DoorOpen className="w-3.5 h-3.5 text-[#344E41] shrink-0" />
                <span>Recepção e Porta:</span>
              </span>
              <p className="text-stone-600 pl-5">
                {item.receptionTeam.join(', ') || 'A definir'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70">
              <span className="font-bold text-stone-700 flex items-center gap-1.5 mb-0.5">
                <HandHeart className="w-3.5 h-3.5 text-[#B08938] shrink-0" />
                <span>Dízimos, Ofertas e Santa Ceia:</span>
              </span>
              <p className="text-stone-600 pl-5">
                {item.offeringAndCommunionTeam.join(', ') || 'A definir'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70">
              <span className="font-bold text-stone-700 flex items-center gap-1.5 mb-0.5">
                <Car className="w-3.5 h-3.5 text-[#344E41] shrink-0" />
                <span>Pátio, Estacionamento e Ordem:</span>
              </span>
              <p className="text-stone-600 pl-5">
                {item.parkingAndOrderTeam.join(', ') || 'A definir'}
              </p>
            </div>
          </div>

          {item.notes && (
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>{item.notes}</span>
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
          {item.coordinatorPhone ? (
            <a
              href={`https://wa.me/${item.coordinatorPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Olá, ${item.coordinator}! A paz do Senhor! Sobre a escala diaconal do dia ${formatScheduleDate(item.date)} (${item.serviceName}):`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Falar com Coordenador</span>
            </a>
          ) : (
            <span className="text-[11px] text-stone-400">Junta Diaconal IPC</span>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCopySchedule(item)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Copiar texto da escala"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar</span>
            </button>
            <button
              type="button"
              onClick={() => handleShareWhatsApp(item)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] text-[#344E41] text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Enviar escala no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Group items into the 4 church sections
  const prayerWeekSchedules = filteredSchedules.filter((s) => s.category === 'semana_oracao');
  const thursdaySchedules = filteredSchedules.filter((s) => s.category === 'quinta_estudo');
  const sundaySchedules = filteredSchedules.filter(
    (s) => s.category === 'domingo_manha' || s.category === 'domingo_noite'
  );
  const specialEventSchedules = filteredSchedules.filter((s) => s.category === 'evento_especial');

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header & Padrão da Escala */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
        <div
          className={`flex gap-4 ${
            isMobileAppPreview
              ? 'flex-col'
              : 'flex-col md:flex-row md:items-center justify-between'
          }`}
        >
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#344E41] bg-[#EAF0EC] px-3 py-1 rounded-full inline-block">
              Junta Diaconal IPC
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-[#344E41] shrink-0" />
              <span>Escala de Diáconos</span>
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Organizada conforme o calendário oficial da igreja: <strong>1ª Semana de Oração</strong>,{' '}
              <strong>Quintas de Estudo e Oração</strong>, <strong>Domingos (Manhã e Noite)</strong> e{' '}
              <strong>Espaço Reservado para Eventos</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              onClick={handleShareFullTableWhatsApp}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Enviar Quadro Mensal no WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Resumo Visual do Funcionamento da Escala */}
        <div
          className={`grid gap-2.5 ${
            isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
            <Flame className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-950 block">1ª Semana do Mês</span>
              <span className="text-amber-800 text-[11px]">Semana de Oração</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#EAF0EC]/70 border border-emerald-200/80 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-[#344E41] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-[#284136] block">Quintas-feiras</span>
              <span className="text-stone-600 text-[11px]">Culto de Estudo e Oração</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200/80 flex items-start gap-2.5">
            <Sun className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-sky-950 block">Domingos</span>
              <span className="text-sky-800 text-[11px]">Culto pela Manhã e Culto à Noite</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-200/80 flex items-start gap-2.5">
            <CalendarPlus className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-purple-950 block">Espaço Reservado</span>
              <span className="text-purple-800 text-[11px]">Eventos Especiais (caso haja)</span>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'Quadro Completo' },
            { id: 'semana_oracao', label: '1ª Semana (Oração)' },
            { id: 'quinta_estudo', label: 'Quintas (Estudo e Oração)' },
            { id: 'domingo_manha', label: 'Domingos (Manhã)' },
            { id: 'domingo_noite', label: 'Domingos (Noite)' },
            { id: 'evento_especial', label: 'Eventos Especiais' }
          ].map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as 'ALL' | DeaconScheduleCategory)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#344E41] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search by Deacon Name or Culto */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar pelo nome do diácono, culto ou data..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41] focus:bg-white"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* 2. Destaque: Próximo Plantão Diaconal */}
      {!searchQuery && selectedCategory === 'ALL' && nextDuty && (
        <section className="bg-gradient-to-br from-[#284136] via-[#344E41] to-[#1e2e27] text-white rounded-3xl p-5 sm:p-7 shadow-sm space-y-4 border border-[#23352C]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-semibold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Próximo Plantão em Destaque</span>
            </span>
            <span className="text-xs font-mono bg-black/25 px-3 py-1 rounded-full text-emerald-100">
              {formatScheduleDate(nextDuty.date)} · {nextDuty.time}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white leading-snug">
              {nextDuty.serviceName}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                Coordenador(a) de Plantão: <strong className="text-white">{nextDuty.coordinator}</strong>
              </span>
            </p>
          </div>

          <div
            className={`grid gap-3 pt-1 ${
              isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                <DoorOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Recepção & Porta</span>
              </span>
              <p className="text-xs text-white font-medium leading-relaxed">
                {nextDuty.receptionTeam.join(', ') || 'A definir'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                <HandHeart className="w-3.5 h-3.5 shrink-0" />
                <span>Ofertas & Santa Ceia</span>
              </span>
              <p className="text-xs text-white font-medium leading-relaxed">
                {nextDuty.offeringAndCommunionTeam.join(', ') || 'A definir'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 shrink-0" />
                <span>Pátio & Ordem</span>
              </span>
              <p className="text-xs text-white font-medium leading-relaxed">
                {nextDuty.parkingAndOrderTeam.join(', ') || 'A definir'}
              </p>
            </div>
          </div>

          {nextDuty.notes && (
            <div className="p-3 rounded-xl bg-black/20 border border-white/10 text-xs text-stone-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span>{nextDuty.notes}</span>
            </div>
          )}

          <div className="pt-1 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleShareWhatsApp(nextDuty)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-white text-[#284136] font-bold text-xs flex items-center gap-2 hover:bg-stone-100 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Compartilhar no WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => handleCopySchedule(nextDuty)}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span>Copiar Escala</span>
            </button>
          </div>
        </section>
      )}

      {/* 3. BLOCO 1: 1ª SEMANA DO MÊS — SEMANA DE ORAÇÃO */}
      {(selectedCategory === 'ALL' || selectedCategory === 'semana_oracao') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">
                1ª Semana do Mês — Semana de Oração
              </h2>
              <p className="text-xs text-stone-500">
                Equipes escaladas para os cultos especiais de oração na primeira semana do mês
              </p>
            </div>
          </div>

          {prayerWeekSchedules.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 text-xs text-stone-500">
              Nenhuma escala da Semana de Oração encontrada para o filtro atual.
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {prayerWeekSchedules.map(renderScheduleCard)}
            </div>
          )}
        </section>
      )}

      {/* 4. BLOCO 2: QUINTAS-FEIRAS — CULTO DE ESTUDO E ORAÇÃO */}
      {(selectedCategory === 'ALL' || selectedCategory === 'quinta_estudo') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">
                Quintas-feiras — Culto de Estudo e Oração
              </h2>
              <p className="text-xs text-stone-500">
                Plantões das quintas-feiras para o Culto de Estudo Bíblico e Oração
              </p>
            </div>
          </div>

          {thursdaySchedules.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 text-xs text-stone-500">
              Nenhuma escala de quinta-feira encontrada para o filtro atual.
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {thursdaySchedules.map(renderScheduleCard)}
            </div>
          )}
        </section>
      )}

      {/* 5. BLOCO 3: DOMINGOS — PELA MANHÃ E À NOITE */}
      {(selectedCategory === 'ALL' ||
        selectedCategory === 'domingo_manha' ||
        selectedCategory === 'domingo_noite') && (
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">
                Domingos — Culto pela Manhã & Culto à Noite
              </h2>
              <p className="text-xs text-stone-500">
                Equipes escaladas para os cultos dominicais matutinos (Manhã) e vespertinos (Noite)
              </p>
            </div>
          </div>

          {sundaySchedules.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 text-xs text-stone-500">
              Nenhuma escala de domingo encontrada para o filtro atual.
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {sundaySchedules.map(renderScheduleCard)}
            </div>
          )}
        </section>
      )}

      {/* 6. BLOCO 4: ESPAÇO RESERVADO PARA EVENTOS ESPECIAIS */}
      {(selectedCategory === 'ALL' || selectedCategory === 'evento_especial') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-stone-900 text-base">
                  Espaço Reservado para Eventos Especiais
                </h2>
                <p className="text-xs text-stone-500">
                  Escalas extras para eventos, conferências, casamentos ou programações especiais caso haja
                </p>
              </div>
            </div>

            {isManagerAuthenticated && (
              <button
                type="button"
                onClick={() => setCurrentView('manager')}
                className="text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors"
              >
                + Adicionar Evento no Gestor
              </button>
            )}
          </div>

          {specialEventSchedules.length === 0 ? (
            <div className="bg-purple-50/40 p-6 rounded-2xl border-2 border-dashed border-purple-200 text-center space-y-2">
              <CalendarPlus className="w-7 h-7 text-purple-400 mx-auto" />
              <h3 className="text-sm font-bold text-purple-950">
                Espaço Reservado para Eventos Extraordinários
              </h3>
              <p className="text-xs text-purple-800/80 max-w-md mx-auto">
                Este espaço é reservado para escalas de eventos especiais do mês (conferências, casamentos, vigílias ou cultos extraordinários). Quando houver evento agendado, a equipe escalada aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              {specialEventSchedules.map(renderScheduleCard)}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
