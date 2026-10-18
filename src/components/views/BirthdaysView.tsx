import React, { useState } from 'react';
import {
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Gift,
  MessageCircle,
  Search,
  Sparkles
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const BirthdaysView: React.FC = () => {
  const { birthdays, isMobileAppPreview } = useChurch();

  const today = new Date();
  const currentRealMonth = today.getMonth() + 1;
  const currentRealDay = today.getDate();

  // Selected Month State (1-12)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePrevMonth = () => {
    setSelectedMonth((m) => (m === 1 ? 12 : m - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((m) => (m === 12 ? 1 : m + 1));
  };

  // Filter birthdays for the selected month and query
  const monthBirthdays = birthdays
    .filter((b) => b.birthMonth === selectedMonth)
    .filter((b) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        (b.ministry && b.ministry.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.birthDay - b.birthDay);

  // Check if there are birthdays today in this selected month
  const todayBirthdaysInMonth = monthBirthdays.filter(
    (b) => selectedMonth === currentRealMonth && b.birthDay === currentRealDay
  );

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header & Month Selector */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-xs space-y-5">
        <div
          className={`flex gap-4 ${
            isMobileAppPreview
              ? 'flex-col'
              : 'flex-col md:flex-row md:items-center justify-between'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B08938] bg-amber-50 px-3 py-1 rounded-full inline-block">
              Celebração Comunitária
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <CalendarHeart className="w-6 h-6 sm:w-7 sm:h-7 text-[#B08938] shrink-0" />
              <span>Aniversariantes do Mês</span>
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm">
              Louvemos a Deus pela bênção de cada vida concedida em nossa família de fé.
            </p>
          </div>

          {/* Month Stepper */}
          <div className="flex items-center justify-between gap-1.5 bg-stone-100 p-1.5 rounded-2xl self-start">
            <button
              onClick={handlePrevMonth}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white text-stone-700 hover:bg-stone-50 shadow-2xs transition-colors"
              title="Mês anterior"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="min-h-[40px] px-3 font-bold text-xs sm:text-sm bg-transparent border-0 text-stone-900 focus:outline-none cursor-pointer text-center"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name} {idx + 1 === currentRealMonth ? '(Mês Atual)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white text-stone-700 hover:bg-stone-50 shadow-2xs transition-colors"
              title="Próximo mês"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Pesquisar aniversariante em ${MONTH_NAMES[selectedMonth - 1]}...`}
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#344E41] focus:bg-white"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* 2. Destaque Especial: Aniversariantes do Dia */}
      {selectedMonth === currentRealMonth && todayBirthdaysInMonth.length > 0 && (
        <section className="bg-gradient-to-r from-amber-400/20 via-amber-200/30 to-amber-100/20 border-2 border-amber-300 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-amber-900">
            <Sparkles className="w-5 h-5 text-[#B08938] shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Aniversariante(s) de Hoje ({currentRealDay} de {MONTH_NAMES[currentRealMonth - 1]})
            </span>
          </div>

          <div className={`grid gap-4 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {todayBirthdaysInMonth.map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex items-center gap-4"
              >
                <div className="relative shrink-0">
                  <img
                    src={
                      person.photoUrl ||
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={person.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-400"
                  />
                  <span className="absolute -bottom-1 -right-1 text-base">🎂</span>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block">
                    Parabéns hoje!
                  </span>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base truncate mt-0.5">
                    {person.name}
                  </h3>
                  <p className="text-xs text-stone-500 truncate">{person.ministry || 'Membro IPC'}</p>

                  {person.phone && (
                    <a
                      href={`https://wa.me/${person.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá, ${person.name}! A paz do Senhor! Desejamos um feliz aniversário repleto da graça e das bênçãos de Deus!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Parabenizar no WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Lista de Aniversariantes do Mês Ordenada por Dia */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-stone-900 text-base">
            Mês de {MONTH_NAMES[selectedMonth - 1]} ({monthBirthdays.length} aniversariante
            {monthBirthdays.length !== 1 ? 's' : ''})
          </h2>
        </div>

        {monthBirthdays.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 text-stone-500 space-y-2">
            <Gift className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="text-sm font-medium">Nenhum aniversariante cadastrado para este mês.</p>
            <p className="text-xs text-stone-400">
              O gestor da igreja pode cadastrar membros ou importar via planilha CSV.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-3.5 ${
              isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {monthBirthdays.map((person) => {
              const isToday =
                selectedMonth === currentRealMonth && person.birthDay === currentRealDay;

              return (
                <div
                  key={person.id}
                  className={`bg-white rounded-2xl p-4 border transition-all flex items-center justify-between gap-3 ${
                    isToday
                      ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-300/60 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {person.photoUrl ? (
                      <div className="relative shrink-0">
                        <img
                          src={person.photoUrl}
                          alt={person.name}
                          className="w-12 h-12 rounded-full object-cover border border-stone-200"
                        />
                        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-[#344E41] text-white w-5 h-5 rounded-full flex items-center justify-center border border-white">
                          {person.birthDay}
                        </span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#EAF0EC] text-[#344E41] flex flex-col items-center justify-center shrink-0 border border-emerald-100">
                        <span className="text-xs font-bold leading-none">{person.birthDay}</span>
                        <span className="text-[9px] uppercase tracking-tighter opacity-80 mt-0.5">
                          {MONTH_NAMES[selectedMonth - 1].slice(0, 3)}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-stone-900 text-sm truncate">{person.name}</h4>
                        {isToday && <span className="text-xs">🎉</span>}
                      </div>
                      <p className="text-xs text-stone-500 truncate">
                        {person.ministry || 'Membro da Congregação'}
                      </p>
                      <span className="text-[11px] text-stone-400 font-medium">
                        Dia {person.birthDay} de {MONTH_NAMES[selectedMonth - 1]}
                      </span>
                    </div>
                  </div>

                  {person.phone && (
                    <a
                      href={`https://wa.me/${person.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá, ${person.name}! A paz do Senhor! Parabéns pelo seu aniversário! Que Deus abençoe ricamente sua caminhada!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] min-w-[40px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 transition-colors"
                      title="Enviar parabéns no WhatsApp"
                      aria-label={`Enviar mensagem para ${person.name}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
