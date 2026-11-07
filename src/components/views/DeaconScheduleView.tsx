import React, { useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Car,
  ClipboardList,
  Clock,
  Copy,
  DoorOpen,
  HandHeart,
  Info,
  MessageCircle,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { formatTimeStandard } from '../../services/cloudDatabase';
import { DeaconScheduleCategory, DeaconScheduleItem, ScheduleItem } from '../../types';

export interface DeaconCategoryDefinition {
  id: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  defaultTime: string;
  defaultServiceName: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
}

const ACCENT_PALETTE = [
  {
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    borderAccent: 'border-l-[#344E41]'
  },
  {
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-900',
    borderAccent: 'border-l-sky-600'
  },
  {
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    borderAccent: 'border-l-amber-500'
  },
  {
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-900',
    borderAccent: 'border-l-indigo-600'
  }
];

export const SPECIAL_EVENT_CATEGORY: DeaconCategoryDefinition = {
  id: 'evento_especial',
  label: 'Evento especial',
  shortLabel: 'Evento especial',
  subtitle: 'Programações extras, conferências, casamentos, vigílias ou celebrações especiais',
  defaultTime: '19h30',
  defaultServiceName: 'Evento Especial',
  badgeBg: 'bg-purple-100',
  badgeText: 'text-purple-900',
  borderAccent: 'border-l-purple-600'
};

export const CATEGORY_META: Record<
  string,
  {
    label: string;
    shortLabel: string;
    subtitle: string;
    badgeBg: string;
    badgeText: string;
    borderAccent: string;
  }
> = {
  evento_especial: SPECIAL_EVENT_CATEGORY
};

/**
 * Generates Deacon Schedule categories dynamically from the church's registered Cultos (schedules)
 * plus "Evento especial".
 */
export function buildDeaconCategories(schedules: ScheduleItem[] = []): DeaconCategoryDefinition[] {
  const dynamicCats: DeaconCategoryDefinition[] = schedules.map((sch, idx) => {
    const palette = ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
    const formattedTime = formatTimeStandard(sch.time || '19h30');
    const shortLabel = `${sch.day} (${formattedTime}) — ${sch.title}`;
    return {
      id: sch.id || `culto_${idx}`,
      label: `${sch.day} às ${formattedTime} — ${sch.title}`,
      shortLabel,
      subtitle: sch.description || `Plantão diaconal para ${sch.title} (${sch.day} às ${formattedTime})`,
      defaultTime: formattedTime,
      defaultServiceName: sch.title,
      badgeBg: palette.badgeBg,
      badgeText: palette.badgeText,
      borderAccent: palette.borderAccent
    };
  });

  return [...dynamicCats, SPECIAL_EVENT_CATEGORY];
}

/**
 * Resolves metadata for a schedule item's category, matching dynamic church schedules first,
 * or falling back to the item's own serviceName / Evento especial.
 */
export function getDeaconCategoryMeta(
  item: Pick<DeaconScheduleItem, 'category' | 'serviceName' | 'time'>,
  schedules: ScheduleItem[] = []
): DeaconCategoryDefinition {
  const categories = buildDeaconCategories(schedules);
  const directMatch = categories.find((c) => c.id === item.category);
  if (directMatch) return directMatch;

  // Try matching by serviceName or title
  const byName = categories.find(
    (c) =>
      c.id !== 'evento_especial' &&
      c.defaultServiceName.trim().toLowerCase() === (item.serviceName || '').trim().toLowerCase()
  );
  if (byName) return byName;

  if (item.category === 'evento_especial') {
    return SPECIAL_EVENT_CATEGORY;
  }

  return {
    id: item.category || 'culto_geral',
    label: item.serviceName || 'Culto Regular',
    shortLabel: item.serviceName || 'Culto',
    subtitle: `Plantão diaconal — ${formatTimeStandard(item.time || '')}`,
    defaultTime: formatTimeStandard(item.time || '19h30'),
    defaultServiceName: item.serviceName || 'Culto',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    borderAccent: 'border-l-[#344E41]'
  };
}

export const DeaconScheduleView: React.FC = () => {
  const {
    churchInfo,
    activeChurch,
    deaconSchedules,
    isMobileAppPreview,
    showToast,
    isManagerAuthenticated,
    setCurrentView
  } = useChurch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | DeaconScheduleCategory>('ALL');

  const churchDisplayName = churchInfo.name || activeChurch?.name || 'Igreja';
  const deaconBadgeLabel = `Junta Diaconal — ${churchDisplayName}`;

  const dynamicCategories = buildDeaconCategories(churchInfo.schedules);
  const todayIso = new Date().toISOString().split('T')[0];

  // Filter out drafts on public page
  const publishedSchedules = deaconSchedules.filter((item) => item.status !== 'draft');

  // Normalize category to match current church schedules if possible
  const normalizedSchedules: DeaconScheduleItem[] = publishedSchedules.map((item) => {
    const resolved = getDeaconCategoryMeta(item, churchInfo.schedules);
    return { ...item, category: resolved.id };
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

  const nextDuty = sortedSchedules.find((s) => s.date >= todayIso);

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
    const catMeta = getDeaconCategoryMeta(item, churchInfo.schedules);
    return [
      `📋 *ESCALA — ${deaconBadgeLabel.toUpperCase()}*`,
      `🏷️ *Culto / Categoria:* ${catMeta.shortLabel}`,
      `📅 *Data:* ${formattedDate} às ${formatTimeStandard(item.time)}`,
      `⛪ *Programação:* ${item.serviceName}`,
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
      `📋 *QUADRO DE ESCALA DIACONAL — ${churchDisplayName.toUpperCase()}*`,
      `====================================`,
      ``
    ];

    if (sortedSchedules.length === 0) {
      lines.push(`_Nenhuma escala diaconal publicada no momento._`);
      return lines.join('\n');
    }

    for (const it of sortedSchedules) {
      const dStr = new Date(it.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
      lines.push(
        `• *${dStr} (${formatTimeStandard(it.time)}) - ${it.serviceName}*\n  Coord.: ${it.coordinator} | Porta: ${it.receptionTeam.join(', ') || 'A definir'} | Ofertas/Ceia: ${it.offeringAndCommunionTeam.join(', ') || 'A definir'} | Pátio: ${it.parkingAndOrderTeam.join(', ') || 'A definir'}`
      );
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

  const renderScheduleCard = (item: DeaconScheduleItem) => {
    const isToday = item.date === todayIso;
    const catMeta = getDeaconCategoryMeta(item, churchInfo.schedules);

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
              {formatTimeStandard(item.time)}
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
            <span className="text-[11px] text-stone-400">{deaconBadgeLabel}</span>
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
            <a
              href={`https://wa.me/?text=${encodeURIComponent(buildShareText(item))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#EAF0EC] hover:bg-[#dbe6df] text-[#344E41] text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Enviar escala no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header & Filtros Dinâmicos a partir dos Cultos */}
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
              {deaconBadgeLabel}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-[#344E41] shrink-0" />
              <span>Escala de Diáconos</span>
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Confira as equipes escaladas para recepção, ofertas, Santa Ceia e ordem nos cultos e programações de{' '}
              <strong>{churchDisplayName}</strong>.
            </p>
          </div>

          {sortedSchedules.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 self-start">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(buildFullMonthShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>Enviar Quadro no WhatsApp</span>
              </a>
            </div>
          )}
        </div>

        {/* Atalhos rápidos gerados dinamicamente dos horários de cultos da igreja (+ Evento especial) */}
        {dynamicCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-[#344E41] text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todas as Escalas
            </button>
            {dynamicCategories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[#344E41] text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat.shortLabel}
                </button>
              );
            })}
          </div>
        )}

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
              {formatScheduleDate(nextDuty.date)} · {formatTimeStandard(nextDuty.time)}
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

      {/* 3. Lista de Escalas Publicadas */}
      {filteredSchedules.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center space-y-3">
          <ClipboardList className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-medium text-stone-600">
            {publishedSchedules.length === 0
              ? 'Nenhuma escala diaconal publicada no momento.'
              : 'Nenhuma escala encontrada para o filtro selecionado.'}
          </p>
          {isManagerAuthenticated && (
            <button
              type="button"
              onClick={() => setCurrentView('manager')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#344E41] bg-[#EAF0EC] hover:bg-[#dce6e0] px-4 py-2 rounded-xl transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Gerenciar Escalas no Painel do Gestor</span>
            </button>
          )}
        </div>
      ) : (
        <div className={`grid gap-4 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {filteredSchedules.map(renderScheduleCard)}
        </div>
      )}
    </div>
  );
};
