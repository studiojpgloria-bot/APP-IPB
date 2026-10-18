import React from 'react';
import { BookOpen, Calendar, Church, ClipboardList, FileText, Home } from 'lucide-react';
import { useChurch } from '../../context/ChurchContext';
import { ViewMode } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentView, setCurrentView, isMobileAppPreview, notes } = useChurch();

  const tabs: { id: ViewMode; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'bible', label: 'Bíblia', icon: <BookOpen className="w-5 h-5" />, badge: notes.length > 0 ? notes.length : undefined },
    { id: 'bulletins', label: 'Boletim', icon: <FileText className="w-5 h-5" /> },
    { id: 'deacons', label: 'Escala', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'birthdays', label: 'Aniversários', icon: <Calendar className="w-5 h-5" /> },
    { id: 'church', label: 'Igreja', icon: <Church className="w-5 h-5" /> }
  ];

  const handleSelect = (id: ViewMode) => {
    setCurrentView(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`${
        isMobileAppPreview
          ? 'sticky bottom-0 left-0 right-0 z-40'
          : 'fixed bottom-0 left-0 right-0 z-40 lg:hidden'
      } bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg`}
    >
      <nav className="grid grid-cols-6 h-16 max-w-lg mx-auto px-1 items-center" aria-label="Navegação inferior móvel">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`min-h-[48px] w-full flex flex-col items-center justify-center relative transition-colors focus-visible:outline-none ${
                isActive ? 'text-[#344E41]' : 'text-stone-400 hover:text-stone-600'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#344E41] text-white text-[9px] font-bold flex items-center justify-center border border-white"
                    title={`${tab.badge} anotações salvas em cache`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#344E41] rounded-full" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 font-medium truncate max-w-full px-0.5 ${isActive ? 'font-semibold text-[#344E41]' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
