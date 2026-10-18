import React from 'react';
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Calendar,
  CalendarHeart,
  CheckCircle2,
  ChevronRight,
  Church,
  ClipboardList,
  Clock,
  Database,
  Edit3,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { BIBLE_BOOKS } from '../../services/bibleData';
import { ChurchStorageService } from '../../services/storage';
import { BannerCarousel } from '../common/BannerCarousel';

export const HomeView: React.FC = () => {
  const {
    churchInfo,
    setCurrentView,
    currentBulletin,
    setSelectedBulletinForReader,
    birthdays,
    deaconSchedules,
    notes,
    favorites,
    cacheMetadata,
    isMobileAppPreview,
    setIsMobileAppPreview
  } = useChurch();

  const readingState = ChurchStorageService.getReadingState();
  const lastReadBook =
    BIBLE_BOOKS.find((b) => b.abbrev.toLowerCase() === readingState.bookAbbrev.toLowerCase()) || BIBLE_BOOKS[18];

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;

  // Filter today's birthday person
  const todayBirthdays = birthdays.filter(
    (b) => b.birthDay === currentDay && b.birthMonth === currentMonth
  );

  // Month birthdays ordered by day
  const thisMonthBirthdays = birthdays
    .filter((b) => b.birthMonth === currentMonth)
    .sort((a, b) => a.birthDay - b.birthDay);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const quickModules = [
    {
      id: 'bible' as const,
      title: 'Bíblia Sagrada',
      desc: 'Navegue por livros, capítulos e faça anotações pessoais',
      icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[#344E41]" />,
      bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100',
      badge: `${notes.length} notas`
    },
    {
      id: 'bulletins' as const,
      title: 'Boletim Semanal',
      desc: 'Liturgia, palavra pastoral, escalas e avisos da congregação',
      icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#344E41]" />,
      bg: 'bg-stone-50 hover:bg-stone-100 border-stone-200'
    },
    {
      id: 'deacons' as const,
      title: 'Escala de Diáconos',
      desc: 'Plantão de recepção, ofertas, Santa Ceia e ordem no pátio',
      icon: <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-[#344E41]" />,
      bg: 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-100',
      badge: `${deaconSchedules.length} escalas`
    },
    {
      id: 'birthdays' as const,
      title: 'Aniversariantes',
      desc: 'Celebre a vida dos irmãos e envie felicitações fraternas',
      icon: <CalendarHeart className="w-5 h-5 sm:w-6 sm:h-6 text-[#B08938]" />,
      bg: 'bg-amber-50 hover:bg-amber-100/80 border-amber-100'
    },
    {
      id: 'church' as const,
      title: 'A Igreja & Pastores',
      desc: 'Horários dos cultos, endereço, liderança pastoral e história',
      icon: <Church className="w-5 h-5 sm:w-6 sm:h-6 text-[#344E41]" />,
      bg: 'bg-stone-50 hover:bg-stone-100 border-stone-200'
    }
  ];

  const todayIso = today.toISOString().split('T')[0];
  const nextDeaconDuty =
    [...deaconSchedules]
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .find((s) => s.date >= todayIso) || deaconSchedules[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-6">
      {/* 1. Welcoming Hero Banner */}
      <section
        className={`relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#284136] via-[#344E41] to-[#1E2E27] text-white shadow-sm border border-[#23352C] ${
          isMobileAppPreview ? 'p-5' : 'p-5 sm:p-10'
        }`}
      >
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-medium text-emerald-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Bem-vindo à comunhão</span>
            </div>
            {!isMobileAppPreview && (
              <button
                type="button"
                onClick={() => setIsMobileAppPreview(true)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold text-white transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Abrir Versão App Mobile</span>
              </button>
            )}
          </div>

          <h1
            className={`font-serif font-bold tracking-tight text-white leading-tight ${
              isMobileAppPreview ? 'text-2xl' : 'text-2xl sm:text-4xl'
            }`}
          >
            {churchInfo.name}
          </h1>
          <p className={`text-stone-200 leading-relaxed ${isMobileAppPreview ? 'text-xs' : 'text-xs sm:text-base'}`}>
            {churchInfo.tagline}. Junte-se a nós para adorar a Deus, aprender da Sua Palavra e crescer em comunidade.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setCurrentView('church')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-[#284136] font-semibold text-xs sm:text-sm hover:bg-stone-100 shadow-sm transition-transform active:scale-95 flex items-center gap-2"
            >
              <span>Horários dos Cultos</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <a
              href={`https://wa.me/${churchInfo.whatsappNumber}?text=${encodeURIComponent(churchInfo.whatsappDefaultMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-medium text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Fale Conosco</span>
            </a>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-[-10%] bottom-[-20%] w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
      </section>

      {/* 2. Painel de Cache Pessoal & Continuidade de Estudo Bíblico */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs space-y-4">
        <div
          className={`flex gap-3.5 pb-3.5 border-b border-stone-100 ${
            isMobileAppPreview
              ? 'flex-col'
              : 'flex-col lg:flex-row lg:items-center lg:justify-between'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                  Suas Anotações e Leitura no Aparelho
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Cache Ativo</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Seus estudos e anotações ficam salvos neste dispositivo para acesso imediato mesmo ao fechar o app.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentView('bible');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`min-h-[42px] px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0 ${
              isMobileAppPreview ? 'w-full' : 'w-full lg:w-auto'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Continuar em {lastReadBook.name} {readingState.chapter}</span>
          </button>
        </div>

        {/* Resumo das últimas anotações salvas em cache */}
        <div
          className={`grid gap-3 ${
            isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
          }`}
        >
          {/* Card 1: Anotações */}
          <div
            onClick={() => setCurrentView('bible')}
            className="p-3.5 rounded-xl bg-[#FAF9F6] hover:bg-stone-100/80 border border-stone-200/80 cursor-pointer transition-colors flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EAF0EC] text-[#344E41] flex items-center justify-center shrink-0 mt-0.5">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {notes.length} {notes.length === 1 ? 'Anotação Salva' : 'Anotações Salvas'}
                </span>
                <span className="text-[11px] font-semibold text-[#344E41] shrink-0">Abrir →</span>
              </div>
              {notes[0] ? (
                <p className="text-[11px] text-stone-600 line-clamp-1">
                  <strong className="text-stone-800">{notes[0].reference}:</strong> {notes[0].noteText}
                </p>
              ) : (
                <p className="text-[11px] text-stone-500 line-clamp-1">
                  Toque em qualquer versículo para criar notas.
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Favoritos */}
          <div
            onClick={() => setCurrentView('bible')}
            className="p-3.5 rounded-xl bg-[#FAF9F6] hover:bg-stone-100/80 border border-stone-200/80 cursor-pointer transition-colors flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#B08938] flex items-center justify-center shrink-0 mt-0.5">
              <Bookmark className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {favorites.length} {favorites.length === 1 ? 'Versículo Favorito' : 'Favoritos Salvos'}
                </span>
                <span className="text-[11px] font-semibold text-[#344E41] shrink-0">Ver →</span>
              </div>
              {favorites[0] ? (
                <p className="text-[11px] text-stone-600 line-clamp-1">
                  <strong className="text-stone-800">{favorites[0].reference}:</strong> &ldquo;{favorites[0].verseText}&rdquo;
                </p>
              ) : (
                <p className="text-[11px] text-stone-500 line-clamp-1">
                  Guarde seus versículos preferidos no aparelho.
                </p>
              )}
            </div>
          </div>

          {/* Card 3: Leitura Offline */}
          <div
            onClick={() => setCurrentView('bible')}
            className="p-3.5 rounded-xl bg-[#FAF9F6] hover:bg-stone-100/80 border border-stone-200/80 cursor-pointer transition-colors flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EAF0EC] text-[#344E41] flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-900 truncate">Leitura Offline</span>
                <span className="text-[10px] font-medium bg-stone-200/70 text-stone-700 px-2 py-0.5 rounded-full shrink-0">
                  {cacheMetadata.cachedChaptersCount} cap. em cache
                </span>
              </div>
              <p className="text-[11px] text-stone-600 truncate">
                Última leitura: <strong className="text-stone-800">{lastReadBook.name} {readingState.chapter}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Atalhos para os Módulos Principais */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
            Módulos & Serviços
          </h2>
          <span className="text-xs text-stone-500 font-medium">Acesso rápido</span>
        </div>

        <div
          className={`grid gap-3.5 ${
            isMobileAppPreview ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
          }`}
        >
          {quickModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => {
                setCurrentView(mod.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`p-4 rounded-2xl border text-left transition-all hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 group flex flex-col justify-between ${mod.bg}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {mod.icon}
                  </div>
                  {mod.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#344E41] border border-emerald-200 shrink-0">
                      {mod.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center justify-between gap-1">
                  <span className="leading-snug">{mod.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors shrink-0" />
                </h3>
              </div>
              <p className="text-[11px] text-stone-600 mt-1.5 leading-relaxed line-clamp-2">
                {mod.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 4. BANNER MEIO */}
      <section>
        <BannerCarousel position="meio" />
      </section>

      {/* 5. Seções de Destaque (Aniversariantes do Mês & Último Boletim) */}
      <div className={`grid gap-6 items-start ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Aniversariantes do Mês & Aniversariante do Dia */}
        <section className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#B08938] flex items-center justify-center shrink-0">
                <CalendarHeart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Aniversariantes</h3>
                <p className="text-xs text-stone-500">Mês de {monthNames[currentMonth - 1]}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentView('birthdays');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-semibold text-[#344E41] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destaque para o aniversariante do dia (se houver) */}
          {todayBirthdays.length > 0 ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={
                    todayBirthdays[0].photoUrl ||
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={todayBirthdays[0].name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                />
                <span className="absolute -bottom-1 -right-1 text-base">🎉</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full inline-block mb-1">
                  É hoje! Parabéns!
                </span>
                <h4 className="font-bold text-stone-900 text-sm truncate">{todayBirthdays[0].name}</h4>
                <p className="text-xs text-stone-600 truncate">{todayBirthdays[0].ministry || 'Membro da IPC'}</p>
              </div>
              {todayBirthdays[0].phone && (
                <a
                  href={`https://wa.me/${todayBirthdays[0].phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Parabéns, ${todayBirthdays[0].name}! Que o Senhor continue abençoando ricamente a sua vida!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[38px] px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 flex items-center gap-1 shrink-0"
                  title="Enviar mensagem de felicitações"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className={isMobileAppPreview ? 'hidden' : 'hidden sm:inline'}>Parabenizar</span>
                </a>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Hoje não temos aniversariantes cadastrados. Acompanhe os próximos do mês abaixo:</span>
            </div>
          )}

          {/* Lista compacta dos próximos aniversariantes do mês */}
          <div className="space-y-2 pt-1">
            {thisMonthBirthdays.slice(0, 4).map((person) => {
              const isToday = person.birthDay === currentDay;
              return (
                <div
                  key={person.id}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
                    isToday ? 'bg-amber-50/50 border-amber-200' : 'bg-white hover:bg-stone-50 border-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#EAF0EC] text-[#344E41] font-bold text-xs flex items-center justify-center shrink-0">
                      {person.birthDay}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-800 truncate">{person.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{person.ministry || 'Comunhão'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-stone-400 shrink-0">
                    {person.birthDay} de {monthNames[currentMonth - 1].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Último Boletim Informativo */}
        <section className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EAF0EC] text-[#344E41] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Último Boletim</h3>
                <p className="text-xs text-stone-500">Edição dominical em destaque</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentView('bulletins');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-xs font-semibold text-[#344E41] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Ver arquivo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {currentBulletin ? (
            <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#344E41] bg-[#EAF0EC] px-2 py-0.5 rounded-md inline-block">
                    {currentBulletin.type === 'pdf' ? 'Boletim em PDF' : 'Boletim Digital'}
                  </span>
                  <h4 className="font-bold text-stone-900 text-base leading-snug">
                    {currentBulletin.title}
                  </h4>
                  <p className="text-xs text-stone-500">
                    Publicado em{' '}
                    {new Date(currentBulletin.editionDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {currentBulletin.themeVerse && (
                <p className="text-xs font-serif italic text-stone-700 bg-white p-3 rounded-lg border border-stone-200/70 leading-relaxed">
                  {currentBulletin.themeVerse}
                </p>
              )}

              <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                {currentBulletin.summary || currentBulletin.pastoralWord}
              </p>

              <button
                onClick={() => setSelectedBulletinForReader(currentBulletin)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>Abrir Boletim Completo</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-500">Nenhum boletim publicado ainda.</p>
          )}

          {/* Próxima Escala de Diáconos em Destaque */}
          {nextDeaconDuty && (
            <div className="pt-2 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-[#344E41]" />
                  <span>Próximo Plantão Diaconal</span>
                </h4>
                <button
                  onClick={() => {
                    setCurrentView('deacons');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-[11px] font-semibold text-[#344E41] hover:underline"
                >
                  Ver escala completa →
                </button>
              </div>
              <div
                onClick={() => {
                  setCurrentView('deacons');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-3 bg-[#FAF9F6] hover:bg-stone-100/80 rounded-xl border border-stone-200/80 cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-stone-900 truncate">{nextDeaconDuty.serviceName}</span>
                  <span className="font-mono text-[11px] bg-[#EAF0EC] text-[#344E41] px-2 py-0.5 rounded font-bold shrink-0">
                    {new Date(nextDeaconDuty.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit'
                    })}{' '}
                    · {nextDeaconDuty.time}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#344E41] shrink-0" />
                  <span className="truncate">
                    Coord.: <strong>{nextDeaconDuty.coordinator}</strong> · Porta:{' '}
                    {nextDeaconDuty.receptionTeam.join(', ')}
                  </span>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 6. Localização e Contato Rápido */}
      <section
        className={`bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex gap-4 ${
          isMobileAppPreview
            ? 'flex-col items-stretch text-left'
            : 'flex-col md:flex-row items-center justify-between'
        }`}
      >
        <div className={`space-y-1 ${isMobileAppPreview ? 'text-left' : 'text-center md:text-left'}`}>
          <h3
            className={`font-bold text-stone-900 text-base flex items-center gap-2 ${
              isMobileAppPreview ? 'justify-start' : 'justify-center md:justify-start'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#344E41] shrink-0" />
            <span>Faça-nos uma visita</span>
          </h3>
          <p className="text-xs sm:text-sm text-stone-600">
            {churchInfo.address} · {churchInfo.cityStateZip}
          </p>
        </div>
        <div className={`flex items-center gap-2 ${isMobileAppPreview ? 'w-full' : 'w-full md:w-auto'}`}>
          <a
            href={churchInfo.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Ver no Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
          <a
            href={`tel:${churchInfo.primaryPhone.replace(/\D/g, '')}`}
            className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl bg-[#EAF0EC] hover:bg-[#dce6e0] text-[#344E41] flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>Ligar</span>
          </a>
        </div>
      </section>

      {/* 7. BANNER RODAPÉ */}
      <section>
        <BannerCarousel position="rodape" />
      </section>
    </div>
  );
};
