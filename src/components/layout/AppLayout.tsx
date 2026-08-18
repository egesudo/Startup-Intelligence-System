import React from 'react';
import { Header } from './Header';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      id="app-layout"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-red-500/20 selection:text-red-700 dark:selection:bg-red-500/30 dark:selection:text-red-300"
    >
      <Header />
      <main
        id="main-content-area"
        className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 transition-colors duration-200"
      >
        {children}
      </main>
    </div>
  );
};

