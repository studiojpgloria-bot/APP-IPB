import React from 'react';
import { Church, Instagram, Lock, Mail, MapPin, Phone, ShieldCheck, Youtube } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { formatTimeStandard } from '../../services/cloudDatabase';

export const Footer: React.FC = () => {
  const {
    currentView,
    activeChurch,
    platformSettings,
    churchInfo,
    setCurrentView,
    switchChurch,
    isManagerAuthenticated,
    isMobileAppPreview
  } = useChurch();

  const rawPlatformName = (platformSettings.appName || 'Minha Igreja').trim();
  const isSameAsActiveChurch =
    Boolean(activeChurch?.name) &&
    rawPlatformName.toLowerCase() === activeChurch!.name.trim().toLowerCase();
  const platformBrand = !rawPlatformName || isSameAsActiveChurch ? 'Minha Igreja' : rawPlatformName;

  const isPlatformFooterMode =
    currentView === 'manager' || currentView === 'admin' || !activeChurch;

  if (isPlatformFooterMode) {
    return (
      <footer className="bg-white border-t border-stone-200 py-6 px-4 sm:px-6 text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            © {new Date().getFullYear()} {platformBrand}. Plataforma digital multi-igreja.
          </span>
          <button
            type="button"
            onClick={switchChurch}
            className="text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1.5"
          >
            <Church className="w-3.5 h-3.5 text-[#344E41]" />
            <span>Ir para a Tela Inicial (/)</span>
          </button>
        </div>
      </footer>
    );
  }

  const displayChurchName = activeChurch.name || churchInfo.name || platformBrand;
  const displayChurchLogo = activeChurch.logoUrl || churchInfo.logoUrl;

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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-serif font-bold text-lg shrink-0 overflow-hidden"
                style={{ backgroundColor: activeChurch.themeColor || '#4A6B5D' }}
              >
                {displayChurchLogo ? (
                  <img
                    src={displayChurchLogo}
                    alt={displayChurchName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Church className="w-5 h-5 text-stone-100" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-white font-semibold text-base sm:text-lg tracking-tight truncate">
                  {displayChurchName}
                </h3>
                <p className="text-stone-400 text-xs truncate">
                  {churchInfo.tagline || 'Seja bem-vindo! Junte-se a nós para adorar a Deus.'}
                </p>
              </div>
            </div>
            {churchInfo.aboutHistory ? (
              <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-md">
                {churchInfo.aboutHistory.length > 190
                  ? `${churchInfo.aboutHistory.slice(0, 190)}...`
                  : churchInfo.aboutHistory}
              </p>
            ) : (
              <p className="text-stone-500 text-xs leading-relaxed max-w-md">
                {activeChurch.city && activeChurch.state
                  ? `${activeChurch.city} — ${activeChurch.state}`
                  : ''}
              </p>
            )}
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
                  href={`https://wa.me/${churchInfo.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(churchInfo.whatsappDefaultMessage || '')}`}
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
          {churchInfo.schedules.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-white font-semibold tracking-wide uppercase text-[11px] text-stone-400">
                Cultos &amp; Encontros
              </h4>
              <ul className="space-y-2 text-xs text-stone-400">
                {churchInfo.schedules.slice(0, 4).map((sch) => (
                  <li key={sch.id} className="flex flex-col">
                    <span className="font-semibold text-stone-200">
                      {sch.day} · {formatTimeStandard(sch.time)}
                    </span>
                    <span className="text-stone-400 text-[11px]">{sch.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Col 3: Contato & Endereço */}
          {(churchInfo.address || churchInfo.cityStateZip || churchInfo.primaryPhone || churchInfo.email) && (
            <div className="space-y-3">
              <h4 className="text-white font-semibold tracking-wide uppercase text-[11px] text-stone-400">
                Endereço &amp; Contato
              </h4>
              <div className="space-y-2 text-xs text-stone-400">
                {(churchInfo.address || churchInfo.cityStateZip) && (
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      {churchInfo.address}
                      {churchInfo.cityStateZip && (
                        <>
                          <br />
                          {churchInfo.cityStateZip}
                        </>
                      )}
                    </span>
                  </p>
                )}
                {churchInfo.primaryPhone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-500 shrink-0" />
                    <span>{churchInfo.primaryPhone}</span>
                  </p>
                )}
                {churchInfo.email && (
                  <p className="flex items-center gap-2 break-all">
                    <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                    <span>{churchInfo.email}</span>
                  </p>
                )}
              </div>
            </div>
          )}
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
            <span>
              © {new Date().getFullYear()} {displayChurchName} — {platformBrand}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={switchChurch}
              className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-800 focus-visible:outline-none"
              title="Voltar para o diretório e escolher outra igreja"
            >
              <Church className="w-3.5 h-3.5" />
              <span>Trocar de igreja</span>
            </button>

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
                  <span>Área do gestor</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
