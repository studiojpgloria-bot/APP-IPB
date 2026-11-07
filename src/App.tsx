import React from 'react';
import { CheckCircle2, Church, Info, XCircle } from 'lucide-react';
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

const ChurchLoadingShell: React.FC = () => {
  const { activeChurch, churchInfo } = useChurch();
  const logoUrl = activeChurch?.logoUrl || churchInfo.logoUrl;
  const themeColor = activeChurch?.themeColor || '#344E41';
  const churchName = activeChurch?.name || churchInfo.name;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 flex flex-col justify-between">
      <div>
        {/* Skeleton Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-white shadow-sm shrink-0 animate-pulse"
                style={{ backgroundColor: themeColor }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Church className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="space-y-1.5">
                {churchName ? (
                  <span className="font-bold text-stone-900 text-sm sm:text-base block">
                    {churchName}
                  </span>
                ) : (
                  <div className="h-4 w-40 bg-stone-200 rounded-md animate-pulse" />
                )}
                <div className="h-2.5 w-24 bg-stone-100 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <div className="h-9 w-20 bg-stone-100 rounded-lg animate-pulse" />
              <div className="h-9 w-20 bg-stone-100 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-stone-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </header>

        {/* Skeleton Main Content */}
        <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-8 pb-20 space-y-6">
          <div
            className="rounded-3xl p-6 sm:p-10 text-white shadow-sm space-y-4"
            style={{ backgroundColor: themeColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center overflow-hidden animate-pulse">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Church className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                {churchName ? (
                  <h1 className="text-xl sm:text-3xl font-serif font-bold text-white">
                    {churchName}
                  </h1>
                ) : (
                  <div className="h-7 w-64 max-w-full bg-white/20 rounded-xl animate-pulse" />
                )}
                <div className="h-3.5 w-48 max-w-full bg-white/15 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="p-4 rounded-2xl bg-white border border-stone-200/80 space-y-3 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-100" />
                <div className="h-4 w-24 bg-stone-200 rounded-md" />
                <div className="h-3 w-full bg-stone-100 rounded-md" />
              </div>
            ))}
          </div>
        </main>
      </div>
      <ToastOverlay />
    </div>
  );
};

const MainShell: React.FC = () => {
  const { currentView, activeChurch, isChurchLoading } = useChurch();

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

  // Show loading screen (logo/skeleton) when opening /{slug} until church data arrives
  const isMemberChurchView =
    currentView !== 'admin' && currentView !== 'manager';
  if (isMemberChurchView && (isChurchLoading || !activeChurch)) {
    return <ChurchLoadingShell />;
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
