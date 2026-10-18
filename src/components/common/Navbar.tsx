import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Calendar, Church, ClipboardList, Database, FileText, Home, LogOut, Menu, Phone, ShieldCheck, X } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { ViewMode } from '../../types';

export const Navbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    churchInfo,
    isManagerAuthenticated,
    managerLogout,
    cacheMetadata
  } = useChurch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-shadow">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand / Logo */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#344E41] rounded-lg py-1 transition-opacity hover:opacity-90 flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#344E41] flex items-center justify-center text-white font-serif font-bold text-base shadow-sm shrink-0">
              {churchInfo.logoUrl ? (
                <img src={churchInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span>IPC</span>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-bold text-stone-900 tracking-tight text-sm sm:text-base leading-tight truncate">
                {churchInfo.name}
              </span>
              <span className="text-[11px] text-stone-500 font-medium truncate">
                {churchInfo.tagline}
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

          {/* Right Actions: Manager + Drawer Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden lg:flex items-center">
              {isManagerAuthenticated ? (
                <div className="flex items-center gap-1 pl-1.5 ml-1 border-l border-stone-200">
                  <button
                    onClick={() => handleNav('manager')}
                    className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      currentView === 'manager'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
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
              ) : (
                <button
                  onClick={() => handleNav('manager')}
                  className="min-h-[38px] px-2.5 py-1.5 ml-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
                  title="Acesso restrito para líderes"
                >
                  <span>Gestor</span>
                </button>
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
                <span className="font-semibold text-stone-800 text-sm tracking-wide">Menu do Aplicativo</span>
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
                  <a
                    href={`https://wa.me/${churchInfo.whatsappNumber}?text=${encodeURIComponent(churchInfo.whatsappDefaultMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Falar no WhatsApp da Igreja</span>
                  </a>

                  <button
                    onClick={() => handleNav('manager')}
                    className={`w-full min-h-[44px] px-3 py-2 text-xs font-medium rounded-xl flex items-center justify-between ${
                      isManagerAuthenticated
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#344E41]" />
                      <span>{isManagerAuthenticated ? 'Painel do Gestor (Ativo)' : 'Área do Gestor'}</span>
                    </div>
                    {isManagerAuthenticated && (
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">Logado</span>
                    )}
                  </button>

                  {isManagerAuthenticated && (
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
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 text-center text-xs text-stone-400">
                <span>{churchInfo.name}</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
