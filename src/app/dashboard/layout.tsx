'use client';

import React from 'react';
import { ReduxProvider } from '@/store/provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { RoleBanner } from '@/components/layout/role-banner';
import { RecordDetailDrawer } from '@/components/records/record-detail-drawer';
import { AISearchModal } from '@/components/search/ai-search-modal';
import { SaveViewModal } from '@/components/views/save-view-modal';
import { CommandPalette } from '@/components/layout/command-palette';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <RoleBanner />
          <main className="flex-1 overflow-y-auto min-h-0 bg-slate-950/50 flex flex-col">
            {children}
          </main>
        </div>

        {/* Global Modals, Command Palette & Drawers */}
        <CommandPalette />
        <RecordDetailDrawer />
        <AISearchModal />
        <SaveViewModal />
      </div>
    </ReduxProvider>
  );
}

