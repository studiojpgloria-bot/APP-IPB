/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BannerCarousel } from './components/common/BannerCarousel';
import { BottomNav } from './components/common/BottomNav';
import { ConfirmModal } from './components/common/ConfirmModal';
import { Footer } from './components/common/Footer';
import { Navbar } from './components/common/Navbar';
import { OfflineIndicator } from './components/common/PWAInstallButton';
import { ToastContainer } from './components/common/Toast';
import { BulletinReaderModal } from './components/modals/BulletinReaderModal';
import { BibleView } from './components/views/BibleView';
import { BirthdaysView } from './components/views/BirthdaysView';
import { BulletinsView } from './components/views/BulletinsView';
import { ChurchInfoView } from './components/views/ChurchInfoView';
import { DeaconScheduleView } from './components/views/DeaconScheduleView';
import { HomeView } from './components/views/HomeView';
import { ManagerView } from './components/views/ManagerView';
import { ChurchProvider, useChurch } from './context/ChurchContext';

const AppContent: React.FC = () => {
  const { currentView } = useChurch();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 font-sans selection:bg-[#344E41]/20 selection:text-[#1e2e27]">
      {/* 1. BANNER TOPO (Antes do Header) */}
      <BannerCarousel position="topo" />

      {/* 2. Header com nome/logo da igreja e menu */}
      <Navbar />

      {/* 3. Conteúdo Principal da Aplicação */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 pb-24 lg:pb-10">
        {currentView === 'home' && <HomeView />}
        {currentView === 'bible' && <BibleView />}
        {currentView === 'bulletins' && <BulletinsView />}
        {currentView === 'birthdays' && <BirthdaysView />}
        {currentView === 'deacons' && <DeaconScheduleView />}
        {currentView === 'church' && <ChurchInfoView />}
        {currentView === 'manager' && <ManagerView />}
      </main>

      {/* 4. Rodapé */}
      <Footer />

      {/* 5. Navegação Inferior Móvel Fixa (Mobile-First) */}
      <BottomNav />

      {/* 6. Modais Globais e Feedback */}
      <OfflineIndicator />
      <BulletinReaderModal />
      <ConfirmModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ChurchProvider>
      <AppContent />
    </ChurchProvider>
  );
}
