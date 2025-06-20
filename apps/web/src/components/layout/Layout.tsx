'use client';

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-secondary-900">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
