import React, { useState } from 'react';
import { BookOpen, Calendar, Download, ExternalLink, FileText, Printer, Share2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

export const BulletinReaderModal: React.FC = () => {
  const { selectedBulletinForReader, setSelectedBulletinForReader, showToast } = useChurch();
  const [zoomLevel, setZoomLevel] = useState(100);

  if (!selectedBulletinForReader) return null;

  const b = selectedBulletinForReader;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: b.title,
          text: `${b.title} - ${b.summary}`,
          url: window.location.href
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      navigator.clipboard.writeText(`${b.title} - ${window.location.href}`);
      showToast('Link do boletim copiado para a área de transferência!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF9F6] rounded-2xl w-full max-w-4xl h-[92vh] max-h-[850px] shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="bg-white px-4 py-3 border-b border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#EAF0EC] text-[#344E41] flex items-center justify-center shrink-0">
              {b.type === 'pdf' ? <FileText className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate">{b.title}</h2>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(b.editionDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                {b.isCurrent && (
                  <span className="text-[10px] font-semibold text-[#344E41] bg-[#EAF0EC] px-2 py-0.5 rounded-full">
                    Edição Atual
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Reader Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {b.type === 'text' && (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-1 bg-stone-100 rounded-lg text-stone-600">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                  className="p-1 hover:text-stone-900 rounded"
                  title="Diminuir fonte"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono w-10 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                  className="p-1 hover:text-stone-900 rounded"
                  title="Aumentar fonte"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg hidden sm:flex"
              title="Imprimir boletim"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleShare}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedBulletinForReader(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 ml-1"
              aria-label="Fechar leitor"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {b.type === 'pdf' && b.pdfUrl ? (
            <div className="w-full h-full flex flex-col items-center">
              {/* PDF Viewer */}
              <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative">
                <iframe
                  src={`${b.pdfUrl}#toolbar=1&navpanes=0`}
                  title={b.title}
                  className="w-full h-full"
                />
              </div>
              <div className="mt-3 flex items-center justify-between w-full">
                <span className="text-xs text-stone-500">{b.pdfFileName || 'Boletim.pdf'}</span>
                <a
                  href={b.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={b.pdfFileName || 'boletim.pdf'}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#344E41] hover:underline bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar arquivo PDF</span>
                </a>
              </div>
            </div>
          ) : (
            /* Formatted Text Bulletin */
            <div
              className="max-w-2xl mx-auto space-y-8 bg-white p-6 sm:p-10 rounded-2xl shadow-xs border border-stone-200/90"
              style={{ fontSize: `${zoomLevel}%` }}
            >
              {/* Editorial Header */}
              <div className="text-center pb-6 border-b border-stone-200">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#4A6B5D]">
                  Boletim Semanal da Igreja Presbiteriana Central
                </span>
                <h1 className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
                  {b.title}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-stone-500">
                  Edição de {new Date(b.editionDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {/* Theme Verse */}
              {b.themeVerse && (
                <div className="p-4 sm:p-5 rounded-xl bg-[#FAF9F6] border-l-4 border-[#344E41]">
                  <p className="font-serif italic text-stone-800 text-sm sm:text-base leading-relaxed">
                    {b.themeVerse}
                  </p>
                </div>
              )}

              {/* Pastoral Word / Editorial */}
              {b.pastoralWord && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Palavra Pastoral
                  </h3>
                  <div className="prose prose-stone text-sm sm:text-base text-stone-700 leading-relaxed font-serif whitespace-pre-line">
                    {b.pastoralWord}
                  </div>
                </div>
              )}

              {/* Custom Text Content */}
              {b.textContent && (
                <div className="space-y-3">
                  <div className="prose prose-stone text-sm sm:text-base text-stone-700 leading-relaxed whitespace-pre-line">
                    {b.textContent}
                  </div>
                </div>
              )}

              {/* Order of Service / Liturgia */}
              {b.orderOfService && b.orderOfService.length > 0 && (
                <div className="pt-6 border-t border-stone-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Ordem do Culto & Liturgia
                  </h3>
                  <ol className="space-y-2">
                    {b.orderOfService.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                        <span className="w-5 h-5 rounded-full bg-[#EAF0EC] text-[#344E41] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Announcements */}
              {b.announcements && b.announcements.length > 0 && (
                <div className="pt-6 border-t border-stone-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Avisos & Comunicações da Semana
                  </h3>
                  <ul className="space-y-2">
                    {b.announcements.map((ann, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B08938] shrink-0 mt-2" />
                        <span className="leading-relaxed">{ann}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-8 border-t border-stone-100 text-center">
                <p className="text-xs text-stone-400">
                  Igreja Presbiteriana Central · Vivendo o Evangelho da Graça
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
