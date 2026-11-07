import React from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { BannerCarousel } from './components/common/BannerCarousel';
import { BottomNav } from './components/common/BottomNav';
import { ConfirmModal } from './components/common/ConfirmModal';
import { Footer } from './components/common/Footer';
import { Navbar } from './components/common/Navbar';
import { BibleView } from './components/views/BibleView';
import { BirthdaysView } from './components/views/BirthdaysView';
import { BulletinsView } from './components/views/BulletinsView';
import { ChurchDirectoryView } from './components/views/ChurchDirectoryView';
import { ChurchInfoView } from './components/views/ChurchInfoView';
import { DeaconScheduleView } from './components/views/DeaconScheduleView';
import { HomeView } from './components/views/HomeView';
import { ManagerView } from './components/views/ManagerView';
import { PlatformAdminView } from './components/views/PlatformAdminView';
import { ChurchProvider, useChurch } from './context/ChurchContext';

const ToastOverlay: React.FC = () => {
  const { toasts } = useChurch();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[95] flex flex-col gap-2 max-w-xs sm:max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 p-3.5 rounded-2xl shadow-lg border text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200 ${
            t.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : t.type === 'info'
              ? 'bg-stone-900 text-white border-stone-700'
              : 'bg-[#284136] text-white border-emerald-700'
          }`}
        >
          {t.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : t.type === 'info' ? (
            <Info className="w-4 h-4 text-stone-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          )}
          <span className="leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
};

const MainShell: React.FC = () => {
  const { currentView, activeChurch } = useChurch();

  // If on the platform root directory (/), render the dedicated Directory Screen
  if (currentView === 'directory') {
    return (
      <>
        <ChurchDirectoryView />
        <ConfirmModal />
        <ToastOverlay />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 flex flex-col justify-between selection:bg-[#344E41] selection:text-white">
      <div>
        {/* 1. POSIÇÃO FIXA: BANNER TOPO (only when inside a church member view) */}
        {activeChurch && currentView !== 'admin' && currentView !== 'manager' && (
          <div className="bg-stone-900/5 border-b border-stone-200/60">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 empty:hidden">
              <BannerCarousel position="topo" />
            </div>
          </div>
        )}

        {/* 2. Navbar */}
        <Navbar />

        {/* 3. Main Content Container */}
        <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-8 pb-20 lg:pb-12">
          {currentView === 'admin' && <PlatformAdminView />}
          {currentView === 'home' && <HomeView />}
          {currentView === 'bible' && <BibleView />}
          {currentView === 'bulletins' && <BulletinsView />}
          {currentView === 'deacons' && <DeaconScheduleView />}
          {currentView === 'birthdays' && <BirthdaysView />}
          {currentView === 'church' && <ChurchInfoView />}
          {currentView === 'manager' && <ManagerView />}
        </main>
      </div>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* 6. System Modals & Toasts */}
      <ConfirmModal />
      <ToastOverlay />
    </div>
  );
};

export function App() {
  return (
    <ChurchProvider>
      <MainShell />
    </ChurchProvider>
  );
}

export default App;
