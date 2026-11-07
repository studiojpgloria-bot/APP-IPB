import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Church,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  Home,
  LogOut,
  Menu,
  Phone,
  ShieldCheck,
  X
} from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { ViewMode } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeChurch,
    platformSettings,
    switchChurch,
    isPlatformOwner,
    churchInfo,
    firebaseUser,
    isManagerAuthenticated,
    managerLogout,
    cacheMetadata
  } = useChurch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPlatformHeaderMode =
    currentView === 'manager' || currentView === 'admin' || !activeChurch;

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-4 h-4" /> },
    { id: 'bible', label: 'Bíblia', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'bulletins', label: 'Boletim', icon: <FileText className="w-4 h-4" /> },
    { id: 'deacons', label: 'Escala Diaconal', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'birthdays', label: 'Aniversariantes', icon: <Calendar className="w-4 h-4" /> },
    { id: 'church', label: 'A Igreja', icon: <Church className="w-4 h-4" /> }
  ];

  const handleNav = (view: ViewMode) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const rawPlatformName = (platformSettings.appName || 'Minha Igreja').trim();
  const isSameAsActiveChurch =
    Boolean(activeChurch?.name) &&
    rawPlatformName.toLowerCase() === activeChurch!.name.trim().toLowerCase();
  const platformBrand = !rawPlatformName || isSameAsActiveChurch ? 'Minha Igreja' : rawPlatformName;

  // ============================================================================
  // MODO 1: CABEÇALHO DA PLATAFORMA (Portal do Gestor, /admin ou Bíblia avulsa)
  // Sem menu de igreja, sem nome de igreja visitada anteriormente e sem botões duplicados
  // ============================================================================
  if (isPlatformHeaderMode) {
    const subtitle =
      currentView === 'manager'
        ? 'Portal do Gestor'
        : currentView === 'admin'
        ? 'Administração da Plataforma (/admin)'
        : platformSettings.tagline || 'Plataforma Digital Multi-Igreja';

    return (
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-shadow">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Platform Brand */}
          <button
            type="button"
            onClick={switchChurch}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#344E41] rounded-lg py-1 transition-opacity hover:opacity-90 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#344E41] text-white flex items-center justify-center shadow-sm shrink-0">
              <Church className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-stone-900 tracking-tight text-sm sm:text-base leading-tight truncate">
                {platformBrand}
              </span>
              <span className="text-[11px] text-[#344E41] font-semibold truncate">
                {subtitle}
              </span>
            </div>
          </button>

          {/* Platform Header Actions (Sem duplicar "Admin", "Ver Igreja" ou "Sair" do Painel) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={switchChurch}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#344E41] shrink-0" />
              <span className="hidden sm:inline">Tela Inicial (/)</span>
              <span className="sm:hidden">Início</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // ============================================================================
  // MODO 2: CABEÇALHO DA IGREJA CADASTRADA (Dentro de /{slug})
  // Mostra sempre o nome e o logo da igreja ativa
  // ============================================================================
  const themeColor = activeChurch.themeColor || '#344E41';
  const churchDisplayName = activeChurch.name || churchInfo.name || platformBrand;
  const churchDisplayLogo = activeChurch.logoUrl || churchInfo.logoUrl;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-shadow">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand / Logo of the Active Church */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#344E41] rounded-lg py-1 transition-opacity hover:opacity-90 flex-1 min-w-0"
          >
            <div
              className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-white font-serif font-bold text-base shadow-sm shrink-0"
              style={{ backgroundColor: themeColor }}
            >
              {churchDisplayLogo ? (
                <img src={churchDisplayLogo} alt={churchDisplayName} className="w-full h-full object-cover" />
              ) : (
                <Church className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-stone-900 tracking-tight text-sm sm:text-base leading-tight truncate">
                {churchDisplayName}
              </span>
              <span className="text-[11px] text-stone-500 font-medium truncate">
                {activeChurch.city && activeChurch.state
                  ? `${activeChurch.city} / ${activeChurch.state}`
                  : churchInfo.tagline || platformBrand}
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#344E41] text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Switch Church + Manager/Owner (ONLY if authorized) + Drawer Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden lg:flex items-center gap-1">
              <PWAInstallButton />

              <button
                type="button"
                onClick={switchChurch}
                title="Trocar de igreja"
                className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#344E41]" />
                <span>Trocar de igreja</span>
              </button>

              {isPlatformOwner && (
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200"
                >
                  Admin
                </button>
              )}

              {isManagerAuthenticated && (
                <div className="flex items-center gap-1 pl-1.5 ml-1 border-l border-stone-200">
                  <button
                    onClick={() => handleNav('manager')}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors bg-stone-100 text-stone-700 hover:bg-stone-200"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#344E41]" />
                    <span>Gestor</span>
                  </button>
                  <button
                    onClick={managerLogout}
                    title="Sair do modo gestor"
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile & Tablet Menu Button */}
            <div className="flex items-center gap-1 lg:hidden">
              {isManagerAuthenticated && (
                <button
                  onClick={() => handleNav('manager')}
                  title="Painel do Gestor"
                  className="min-h-[38px] px-2 py-1 text-[11px] font-semibold rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#344E41] shrink-0" />
                  <span className="hidden sm:inline">Gestor</span>
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-700 hover:bg-stone-100 focus-visible:outline-none"
                aria-label="Abrir menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] bg-stone-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="w-[86%] max-w-sm bg-white h-full shadow-2xl flex flex-col p-5 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <span className="font-semibold text-stone-800 text-sm tracking-wide truncate">
                  {churchDisplayName}
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Local Cache Status Badge */}
              <div className="mt-3 p-3 rounded-xl bg-[#EAF0EC]/70 border border-emerald-200/70 flex items-center gap-2.5">
                <Database className="w-4 h-4 text-[#344E41] shrink-0" />
                <div className="text-[11px] leading-tight text-stone-700">
                  <span className="font-bold text-[#284136] block">Cache Pessoal Ativo</span>
                  <span>
                    {cacheMetadata.notesCount} notas · {cacheMetadata.favoritesCount} favoritos salvos no aparelho
                  </span>
                </div>
              </div>

              <div className="py-4 space-y-1 flex-1">
                {navItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-left font-medium flex items-center gap-3 transition-colors ${
                        isActive
                          ? 'bg-[#344E41] text-white shadow-xs'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {item.icon}
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}

                <div className="pt-4 mt-4 border-t border-stone-100 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      switchChurch();
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4 text-[#344E41]" />
                      <span>Trocar de igreja</span>
                    </span>
                    <span className="text-[10px] text-stone-500">Diretório</span>
                  </button>

                  {churchInfo.whatsappNumber && (
                    <a
                      href={`https://wa.me/${churchInfo.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(churchInfo.whatsappDefaultMessage || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Falar no WhatsApp da Igreja</span>
                    </a>
                  )}

                  {isPlatformOwner && (
                    <button
                      type="button"
                      onClick={() => handleNav('admin')}
                      className="w-full min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#344E41]" />
                      <span>Painel Owner da Plataforma (/admin)</span>
                    </button>
                  )}

                  {isManagerAuthenticated && (
                    <>
                      <button
                        onClick={() => handleNav('manager')}
                        className="w-full min-h-[44px] px-3 py-2 text-xs font-medium rounded-xl flex items-center justify-between bg-amber-50 text-amber-900 border border-amber-200"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#344E41]" />
                          <span>Painel do Gestor (Ativo)</span>
                        </div>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                          Logado
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          managerLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full min-h-[44px] px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair da Sessão</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-400">
                <span>
                  {churchDisplayName} — {platformBrand}
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
