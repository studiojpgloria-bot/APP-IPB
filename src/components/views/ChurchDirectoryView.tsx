import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Church,
  Compass,
  Lock,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { ChurchTenant } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

function normalizeText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const ChurchDirectoryView: React.FC = () => {
  const {
    activeChurches,
    platformSettings,
    selectChurchBySlug,
    openManagerPortalFromDirectory,
    isPlatformOwner,
    setCurrentView,
    showToast
  } = useChurch();

  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const handleUseMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('Seu navegador não suporta geolocalização.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocating(false);
        showToast('Igrejas ordenadas por proximidade da sua localização!');
      },
      () => {
        setLocating(false);
        showToast('Não foi possível obter sua localização. Verifique a permissão de GPS.', 'info');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const filteredAndSortedChurches = useMemo(() => {
    const q = normalizeText(searchQuery);
    const matches = activeChurches.filter((c) => {
      if (c.status !== 'ativa') return false;
      if (!q) return true;
      const nameNorm = normalizeText(c.name);
      const cityNorm = normalizeText(c.city || c.cityStateZip);
      const stateNorm = normalizeText(c.state);
      const slugNorm = normalizeText(c.slug);
      return (
        nameNorm.includes(q) ||
        cityNorm.includes(q) ||
        stateNorm.includes(q) ||
        slugNorm.includes(q)
      );
    });

    if (!userCoords) {
      return matches.map((church) => ({ church, distanceKm: null as number | null }));
    }

    return matches
      .map((church) => {
        if (typeof church.latitude === 'number' && typeof church.longitude === 'number') {
          const dist = haversineDistanceKm(
            userCoords.lat,
            userCoords.lng,
            church.latitude,
            church.longitude
          );
          return { church, distanceKm: dist };
        }
        return { church, distanceKm: null as number | null };
      })
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return (a.church.name || '').localeCompare(b.church.name || '');
      });
  }, [activeChurches, searchQuery, userCoords]);

  const handleSelectChurch = (church: ChurchTenant) => {
    void selectChurchBySlug(church.slug, 'home');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#344E41] text-white flex items-center justify-center shadow-xs shrink-0">
              <Church className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-serif font-bold text-base sm:text-lg text-stone-900 tracking-tight block truncate">
                {platformSettings.appName || 'Minha Igreja'}
              </span>
              <span className="text-[11px] text-stone-500 block truncate">
                {platformSettings.tagline || 'Conectando você à sua comunidade de fé'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            {isPlatformOwner && (
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold flex items-center gap-1.5 border border-amber-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#344E41]" />
                <span>Painel Owner (/admin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={openManagerPortalFromDirectory}
              className="hidden sm:inline-flex min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sou gestor</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Search Card */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#284136] via-[#344E41] to-[#1E2E27] text-white p-6 sm:p-10 shadow-sm border border-[#23352C]">
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-medium text-emerald-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>Plataforma Digital Multi-Igreja</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
              Encontre sua igreja
            </h1>
            <p className="text-xs sm:text-base text-stone-200 leading-relaxed max-w-xl mx-auto">
              Acesse boletins, horários de cultos, escalas, aniversariantes e a Bíblia Sagrada ACF offline diretamente no seu celular, sem precisar de login.
            </p>

            {/* Large Search Bar */}
            <div className="pt-2 space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busque pelo nome da igreja ou cidade/UF..."
                  className="w-full min-h-[54px] pl-12 pr-4 py-3 rounded-2xl bg-white text-stone-900 placeholder:text-stone-400 text-sm sm:text-base font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border ${
                    userCoords
                      ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>
                    {locating
                      ? 'Obtendo localização...'
                      : userCoords
                      ? 'Ordenado por proximidade'
                      : 'Usar minha localização'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentView('bible')}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span>Abrir Bíblia ACF Offline</span>
                </button>
              </div>
            </div>
          </div>

          <div className="absolute right-[-10%] bottom-[-25%] w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        </section>

        {/* Churches List Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                Igrejas Cadastradas ({filteredAndSortedChurches.length})
              </h2>
              <p className="text-xs text-stone-500">
                Ao escolher sua igreja, ela ficará salva neste aparelho para abrir direto nas próximas vezes.
              </p>
            </div>
          </div>

          {filteredAndSortedChurches.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200/90 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF0EC] text-[#344E41] flex items-center justify-center mx-auto">
                {activeChurches.length === 0 ? (
                  <Church className="w-6 h-6" />
                ) : (
                  <Compass className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                  {activeChurches.length === 0
                    ? 'Bem-vindo! Nenhuma igreja cadastrada ainda'
                    : 'Nenhuma igreja encontrada para esta busca'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                  {activeChurches.length === 0
                    ? 'A plataforma está pronta para começar do zero. Se você é pastor, líder ou gestor, clique no botão abaixo para cadastrar sua igreja gratuitamente e gerar seu link e QR Code.'
                    : 'Tente buscar por outro nome ou cidade, ou cadastre sua igreja gratuitamente se você faz parte da liderança.'}
                </p>
              </div>
              <button
                type="button"
                onClick={openManagerPortalFromDirectory}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#284136] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sou gestor — Entrar / Cadastrar minha igreja</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedChurches.map(({ church, distanceKm }) => {
                const locationLabel =
                  church.city && church.state
                    ? `${church.city} / ${church.state}`
                    : church.city || church.cityStateZip || 'Localização não informada';

                return (
                  <button
                    key={church.id}
                    type="button"
                    onClick={() => handleSelectChurch(church)}
                    className="bg-white rounded-2xl p-5 border border-stone-200/90 hover:border-[#344E41] shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-white font-serif font-bold text-lg shrink-0 border border-stone-200 shadow-2xs"
                        style={{ backgroundColor: church.themeColor || '#344E41' }}
                      >
                        {church.logoUrl ? (
                          <img
                            src={church.logoUrl}
                            alt={church.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Church className="w-6 h-6 text-white" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug group-hover:text-[#344E41] transition-colors line-clamp-2">
                          {church.name}
                        </h3>
                        <p className="text-xs text-stone-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{locationLabel}</span>
                        </p>
                        {distanceKm !== null && (
                          <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            Aprox. {distanceKm < 1 ? '< 1 km' : `${distanceKm.toFixed(1)} km`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-stone-400 truncate">
                        /{church.slug}
                      </span>
                      <span className="font-bold text-[#344E41] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Acessar igreja</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Discreet Footer with Manager CTA */}
      <footer className="bg-white border-t border-stone-200 py-6 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span>
            © {new Date().getFullYear()} {platformSettings.appName || 'Minha Igreja'}. Plataforma digital para igrejas.
          </span>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {isPlatformOwner && (
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold flex items-center gap-1.5 border border-amber-200 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#344E41]" />
                <span>Painel Admin (/admin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={openManagerPortalFromDirectory}
              className="px-3.5 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-[#344E41]" />
              <span>Sou gestor — Entrar / Cadastrar minha igreja</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
