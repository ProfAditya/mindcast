import React from 'react';
import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/manrope';
import Providers from './providers';
import '../styles/tailwind.css';


export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#111111' };

export const metadata: Metadata = {
  title: {
    default: 'NEURIX — Understand the patterns behind how you feel',
    template: '%s · NEURIX',
  },
  description:
    'NEURIX brings your wellbeing tracking, health records, self-assessments and private reflections together, and helps you share exactly what you choose with your doctor.',
  icons: { icon: [{ url: '/favicon.ico', type: 'image/x-icon' }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-obsidian font-sans text-ivory">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-gold focus:px-3 focus:py-2 focus:text-obsidian"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
