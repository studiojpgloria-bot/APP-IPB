import React from 'react';
import { Church, Instagram, Lock, Mail, MapPin, Phone, ShieldCheck, Youtube } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';

export const Footer: React.FC = () => {
  const { churchInfo, setCurrentView, isManagerAuthenticated, isMobileAppPreview } = useChurch();

  return (
    <footer
      className={`bg-stone-900 text-stone-300 border-t border-stone-800 transition-colors ${
        isMobileAppPreview ? 'pt-8 pb-6' : 'pt-12 pb-24 lg:pb-12'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className={`grid gap-8 pb-8 border-b border-stone-800 ${
            isMobileAppPreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-4'
          }`}
        >
          {/* Col 1: About & Logo */}
          <div className={`${isMobileAppPreview ? '' : 'md:col-span-2'} space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#4A6B5D] flex items-center justify-center text-white font-serif font-bold text-lg shrink-0 overflow-hidden">
                {churchInfo.logoUrl ? (
                  <img src={churchInfo.logoUrl} alt={churchInfo.name} className="w-full h-full object-cover" />
                ) : (
                  <Church className="w-5 h-5 text-stone-100" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-base sm:text-lg tracking-tight truncate">
                  {churchInfo.name}
                </h3>
                <p className="text-stone-400 text-xs truncate">{churchInfo.tagline}</p>
              </div>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-md">
              {churchInfo.aboutHistory.slice(0, 190)}...
            </p>
            <div className="flex items-center gap-3 pt-1">
              {churchInfo.instagramUrl && (
                <a
                  href={churchInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
                  aria-label="Instagram da igreja"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {churchInfo.youtubeUrl && (
                <a
                  href={churchInfo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
                  aria-label="Canal do YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {churchInfo.whatsappNumber && (
                <a
                  href={`https://wa.me/${churchInfo.whatsappNumber}?text=${encodeURIComponent(churchInfo.whatsappDefaultMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-emerald-950/80 hover:bg-emerald-900 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors"
                  aria-label="Fale pelo WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Cultos e Horários */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold tracking-wide uppercase text-[11px] text-stone-400">
              Cultos & Encontros
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              {churchInfo.schedules.slice(0, 4).map((sch) => (
                <li key={sch.id} className="flex flex-col">
                  <span className="font-semibold text-stone-200">
                    {sch.day} · {sch.time}
                  </span>
                  <span className="text-stone-400 text-[11px]">{sch.title}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Contato & Endereço */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold tracking-wide uppercase text-[11px] text-stone-400">
              Endereço & Contato
            </h4>
            <div className="space-y-2 text-xs text-stone-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  {churchInfo.address}
                  <br />
                  {churchInfo.cityStateZip}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-500 shrink-0" />
                <span>{churchInfo.primaryPhone}</span>
              </p>
              <p className="flex items-center gap-2 break-all">
                <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                <span>{churchInfo.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar & Discreet Manager Link */}
        <div
          className={`pt-6 flex gap-4 text-xs text-stone-500 ${
            isMobileAppPreview
              ? 'flex-col items-center text-center'
              : 'flex-col sm:flex-row items-center justify-between'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} {churchInfo.name}. Todos os direitos reservados.</span>
          </div>

          {/* Discreet Manager Button */}
          <div>
            <button
              onClick={() => {
                setCurrentView('manager');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-800 focus-visible:outline-none"
              title="Acesso administrativo para gestores da igreja"
            >
              {isManagerAuthenticated ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-stone-300 font-medium">Painel de Gestão</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Área do Gestor</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
