import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Download,
  Eye,
  Search,
  Sparkles
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

export const BulletinsView: React.FC = () => {
  const { bulletins, setSelectedBulletinForReader, isMobileAppPreview } = useChurch();
  const [searchQuery, setSearchQuery] = useState('');

  // Sort by edition date descending
  const sortedBulletins = [...bulletins].sort((a, b) => {
    return new Date(b.editionDate).getTime() - new Date(a.editionDate).getTime();
  });

  const filteredBulletins = sortedBulletins.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.summary.toLowerCase().includes(q) ||
      (b.themeVerse && b.themeVerse.toLowerCase().includes(q))
    );
  });

  const currentBulletin = bulletins.find((b) => b.isCurrent) || sortedBulletins[0];

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-xs space-y-4">
        <div
          className={`flex gap-4 ${
            isMobileAppPreview
              ? 'flex-col'
              : 'flex-col md:flex-row md:items-center justify-between'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4A6B5D] bg-[#EAF0EC] px-3 py-1 rounded-full inline-block">
              Comunicação Semanal
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Boletins Informativos
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm">
              Acompanhe as meditações pastorais, liturgia dos cultos dominicais e avisos da semana.
            </p>
          </div>

          {/* Search Bar */}
          <div className={`relative w-full ${isMobileAppPreview ? '' : 'md:w-72'}`}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar em edições anteriores..."
              className="w-full min-h-[44px] pl-9 pr-3 rounded-xl bg-stone-50 border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#344E41] focus:bg-white"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 2. Destaque: Edição Atual */}
      {!searchQuery && currentBulletin && (
        <section className="bg-gradient-to-br from-stone-900 to-[#1e2e27] text-white rounded-3xl p-5 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Edição Atual em Destaque</span>
            </span>
            <span className="text-xs text-stone-400">
              {new Date(currentBulletin.editionDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="space-y-2 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
              {currentBulletin.title}
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              {currentBulletin.summary || currentBulletin.pastoralWord}
            </p>
          </div>

          {currentBulletin.themeVerse && (
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 text-xs font-serif italic text-stone-200">
              {currentBulletin.themeVerse}
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedBulletinForReader(currentBulletin)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-white text-[#284136] font-bold text-xs sm:text-sm hover:bg-stone-100 flex items-center gap-2 shadow-xs transition-colors"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>{currentBulletin.type === 'pdf' ? 'Visualizar PDF' : 'Ler Boletim Completo'}</span>
            </button>

            {currentBulletin.type === 'pdf' && currentBulletin.pdfUrl && (
              <a
                href={currentBulletin.pdfUrl}
                download={currentBulletin.pdfFileName || 'boletim.pdf'}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition-colors"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Baixar PDF</span>
              </a>
            )}
          </div>
        </section>
      )}

      {/* 3. Lista de Todos os Boletins */}
      <section className="space-y-3">
        <h3 className="font-bold text-stone-900 text-base">
          {searchQuery ? `Resultados (${filteredBulletins.length})` : 'Arquivo de Boletins Anteriores'}
        </h3>

        {filteredBulletins.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 text-stone-500">
            Nenhum boletim encontrado para sua busca.
          </div>
        ) : (
          <div className={`grid gap-4 ${isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {filteredBulletins.map((bulletin) => {
              const isCurrent = bulletin.id === currentBulletin?.id;
              return (
                <div
                  key={bulletin.id}
                  className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                    isCurrent
                      ? 'border-[#344E41] ring-1 ring-[#344E41]/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#344E41] bg-[#EAF0EC] px-2 py-0.5 rounded-md">
                        {bulletin.type === 'pdf' ? 'Arquivo PDF' : 'Edição Digital'}
                      </span>
                      <span className="text-xs text-stone-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {new Date(bulletin.editionDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h4 className="font-bold text-stone-900 text-base leading-snug line-clamp-2">
                      {bulletin.title}
                    </h4>

                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {bulletin.summary || bulletin.pastoralWord}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-400 truncate">
                      {bulletin.type === 'pdf'
                        ? bulletin.pdfFileName || 'Documento PDF'
                        : 'Liturgia e Palavra'}
                    </span>

                    <button
                      onClick={() => setSelectedBulletinForReader(bulletin)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-[#EAF0EC] text-stone-800 hover:text-[#344E41] font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Abrir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
