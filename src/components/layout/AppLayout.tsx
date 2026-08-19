import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  return (
    <div
      id="app-layout"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-red-500/20 selection:text-red-700 dark:selection:bg-red-500/30 dark:selection:text-red-300 relative overflow-x-hidden"
    >
      <Header
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Slide-over Sidebar Drawer & Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            id="sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div
            id="sidebar-drawer-container"
            className="relative z-50 h-full max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200"
          >
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        id="main-content-area"
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 transition-colors duration-200"
      >
        {children}
      </main>
    </div>
  );
};


