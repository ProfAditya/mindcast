'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Keyframes & Global Styles ───────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  :root {
    --obsidian: #0a0a0c;
    --surface-1: #111115;
    --surface-2: #18181e;
    --surface-3: #1f1f28;
    --violet: #7c3aed;
    --violet-light: #a78bfa;
    --indigo: #4f46e5;
    --indigo-light: #818cf8;
    --neon-violet: #8b5cf6;
    --border-subtle: rgba(255,255,255,0.06);
    --border-medium: rgba(255,255,255,0.10);
    --text-primary: #f8f8ff;
    --text-secondary: rgba(248,248,255,0.55);
    --text-muted: rgba(248,248,255,0.30);
  }

  .lp-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }

  @keyframes orb-drift-1 {
    0%,100%{transform:translate(0,0) scale(1);}
    40%{transform:translate(60px,80px) scale(1.12);}
    70%{transform:translate(-30px,40px) scale(0.94);}
  }
  @keyframes orb-drift-2 {
    0%,100%{transform:translate(0,0) scale(1);}
    35%{transform:translate(-80px,50px) scale(1.08);}
    65%{transform:translate(50px,-70px) scale(1.04);}
  }
  @keyframes orb-drift-3 {
    0%,100%{transform:translate(0,0) scale(1);}
    50%{transform:translate(70px,-60px) scale(1.1);}
  }
  @keyframes ticker-scroll {
    0%{transform:translateX(0);}
    100%{transform:translateX(-50%);}
  }
  @keyframes gradient-text {
    0%,100%{background-position:0% 50%;}
    50%{background-position:100% 50%;}
  }
  @keyframes float-card {
    0%,100%{transform:translateY(0px) rotate(-1deg);}
    50%{transform:translateY(-12px) rotate(-1deg);}
  }
  @keyframes pulse-ring {
    0%{transform:scale(1);opacity:0.6;}
    100%{transform:scale(1.5);opacity:0;}
  }
  @keyframes fade-up {
    from{opacity:0;transform:translateY(28px);}
    to{opacity:1;transform:translateY(0);}
  }
  @keyframes fade-in {
    from{opacity:0;}
    to{opacity:1;}
  }
  @keyframes slide-in-right {
    from{opacity:0;transform:translateX(32px);}
    to{opacity:1;transform:translateX(0);}
  }
  @keyframes glow-pulse {
    0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3);}
    50%{box-shadow:0 0 40px rgba(124,58,237,0.6), 0 0 80px rgba(124,58,237,0.2);}
  }
  @keyframes border-glow {
    0%,100%{border-color:rgba(124,58,237,0.2);}
    50%{border-color:rgba(124,58,237,0.5);}
  }
  @keyframes typing-bounce {
    0%,60%,100%{transform:translateY(0);}
    30%{transform:translateY(-6px);}
  }
  @keyframes shimmer-sweep {
    0%{transform:translateX(-100%);}
    100%{transform:translateX(100%);}
  }

  .animate-fade-up { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-fade-in { animation: fade-in 0.5s ease both; }
  .animate-slide-right { animation: slide-in-right 0.7s cubic-bezier(0.22,1,0.36,1) both; }

  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
  .delay-400 { animation-delay: 0.4s; }
  .delay-500 { animation-delay: 0.5s; }
  .delay-600 { animation-delay: 0.6s; }
  .delay-700 { animation-delay: 0.7s; }
  .delay-800 { animation-delay: 0.8s; }

  .gradient-text {
    background: linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #c4b5fd 80%, #a78bfa 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradient-text 5s ease infinite;
  }

  .btn-primary {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    box-shadow: 0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
    transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
    position: relative;
    overflow: hidden;
  }
  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .btn-primary:hover::before { opacity: 1; }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary span { position: relative; z-index: 1; }

  .btn-ghost {
    border: 1px solid rgba(255,255,255,0.10);
    transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
    background: rgba(255,255,255,0.03);
  }
  .btn-ghost:hover {
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.06);
    transform: translateY(-1px);
  }

  .glass-nav {
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    background: rgba(10,10,12,0.75);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .bento-card {
    background: var(--surface-1);
    border: 1px solid var(--border-subtle);
    transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
    position: relative;
    overflow: hidden;
  }
  .bento-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(124,58,237,0.04) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .bento-card:hover {
    border-color: rgba(124,58,237,0.28);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.12);
  }
  .bento-card:hover::before { opacity: 1; }

  .bento-card-accent {
    background: linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(79,70,229,0.05) 100%);
    border: 1px solid rgba(124,58,237,0.18);
    transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
    position: relative;
    overflow: hidden;
  }
  .bento-card-accent:hover {
    border-color: rgba(124,58,237,0.4);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(124,58,237,0.15);
  }

  .feature-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(124,58,237,0.2);
    flex-shrink: 0;
  }

  .demo-tab {
    transition: all 0.2s ease;
    border: 1px solid transparent;
  }
  .demo-tab.active {
    background: rgba(124,58,237,0.12);
    border-color: rgba(124,58,237,0.25);
    color: #a78bfa;
  }
  .demo-tab:not(.active) {
    color: rgba(248,248,255,0.38);
  }
  .demo-tab:not(.active):hover {
    background: rgba(255,255,255,0.04);
    color: rgba(248,248,255,0.65);
  }

  .typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(167,139,250,0.6);
    animation: typing-bounce 1.2s ease-in-out infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  .noise-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .scroll-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .scroll-reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .scroll-reveal-delay-1 { transition-delay: 0.1s; }
  .scroll-reveal-delay-2 { transition-delay: 0.2s; }
  .scroll-reveal-delay-3 { transition-delay: 0.3s; }
  .scroll-reveal-delay-4 { transition-delay: 0.4s; }
  .scroll-reveal-delay-5 { transition-delay: 0.5s; }
`;

// ─── Scroll Reveal Hook ──────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── Animated Background ─────────────────────────────────────────────────────
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: '#0a0a0c' }} />
      {/* Orb 1 — violet */}
      <div
        className="absolute -top-32 -left-32 w-[640px] h-[640px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          animation: 'orb-drift-1 20s ease-in-out infinite',
        }}
      />
      {/* Orb 2 — indigo */}
      <div
        className="absolute top-1/2 -right-48 w-[560px] h-[560px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)',
          animation: 'orb-drift-2 25s ease-in-out infinite',
        }}
      />
      {/* Orb 3 — deep violet bottom */}
      <div
        className="absolute -bottom-20 left-1/4 w-[480px] h-[480px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
          animation: 'orb-drift-3 30s ease-in-out infinite',
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
      {/* Noise */}
      <div className="noise-overlay" />
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Demo', href: '#demo' },
    { label: 'About', href: '#about' },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={scrolled ? {} : { background: 'transparent' }}
    >
      <div className={`transition-all duration-500 ${scrolled ? 'glass-nav' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C5.8 2 4 3.8 4 6c0 1.5.8 2.8 2 3.5V11h4V9.5C11.2 8.8 12 7.5 12 6c0-2.2-1.8-4-4-4z" fill="white" opacity="0.95" />
                <path d="M6 11h4v1.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V11z" fill="white" opacity="0.55" />
              </svg>
            </div>
            <span
              className="font-bold text-[17px] tracking-tight"
              style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}
            >
              MindCast
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200"
                style={{ color: 'rgba(248,248,255,0.5)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#f8f8ff';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(248,248,255,0.5)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-up-login-screen"
              className="px-4 py-2 text-[13px] font-medium transition-colors duration-200"
              style={{ color: 'rgba(248,248,255,0.5)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f8f8ff')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,248,255,0.5)')}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up-login-screen"
              className="btn-primary px-5 py-2.5 rounded-full text-[13px] font-semibold text-white"
            >
              <span>Get Started</span>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            suppressHydrationWarning
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(248,248,255,0.6)' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {menuOpen ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              ) : (
                <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            background: 'rgba(10,10,12,0.96)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="px-5 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium rounded-xl transition-colors"
                style={{ color: 'rgba(248,248,255,0.6)' }}
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link
                href="/sign-up-login-screen"
                className="px-4 py-3 text-sm font-medium text-center rounded-xl transition-colors"
                style={{ color: 'rgba(248,248,255,0.6)' }}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up-login-screen"
                className="btn-primary px-4 py-3.5 rounded-xl text-sm font-semibold text-white text-center"
              >
                <span>Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 sm:px-8 pt-24 pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <div>
            {/* Badge */}
            <div
              className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8"
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.22)',
                color: '#a78bfa',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.8)', animation: 'glow-pulse 2s ease-in-out infinite' }}
              />
              AI-Powered Mental Wellness
            </div>

            {/* Headline */}
            <h1
              className="animate-fade-up delay-100 font-bold leading-[1.04] mb-6"
              style={{
                fontSize: 'clamp(2.6rem, 5.5vw, 4.8rem)',
                letterSpacing: '-0.04em',
                color: '#f8f8ff',
              }}
            >
              Your mind,{' '}
              <br className="hidden sm:block" />
              <span className="gradient-text">finally understood.</span>
            </h1>

            {/* Subheadline */}
            <p
              className="animate-fade-up delay-200 leading-relaxed mb-10 max-w-lg"
              style={{
                fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
                color: 'rgba(248,248,255,0.5)',
                lineHeight: '1.75',
              }}
            >
              MindCast blends AI-driven insights, mood intelligence, habit science, and reflective journaling into one beautifully calm experience — built for the way your mind actually works.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up delay-300 flex flex-wrap items-center gap-3 mb-12">
              <Link
                href="/sign-up-login-screen"
                className="btn-primary group flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-white text-sm"
              >
                <span>Launch App</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path d="M2.5 7h9M7.5 3.5l3.5 3.5-3.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/dashboard"
                className="btn-ghost flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm"
                style={{ color: 'rgba(248,248,255,0.7)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5.5 4.5l4 2.5-4 2.5V4.5z" fill="currentColor" />
                </svg>
                See Dashboard
              </Link>
            </div>

            {/* Minimal trust indicators */}
            <div className="animate-fade-up delay-400 flex items-center gap-5 flex-wrap">
              {[
                { label: 'Free to start' },
                { label: 'No credit card' },
                { label: 'Private by design' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(248,248,255,0.32)' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l2.5 2.5L10 3" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating glass product card */}
          <div className="animate-fade-up delay-500 relative flex items-center justify-center">
            {/* Glow behind card */}
            <div
              className="absolute inset-8 rounded-3xl blur-3xl"
              style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, transparent 70%)' }}
            />

            {/* Floating card */}
            <div
              className="relative w-full max-w-sm"
              style={{ animation: 'float-card 6s ease-in-out infinite' }}
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(17,17,21,0.85)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)',
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                    >
                      M
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: '#f8f8ff' }}>Mira</div>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(248,248,255,0.35)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        Active now
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}
                  >
                    Wellness Score: 87
                  </div>
                </div>

                {/* Chat preview */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex justify-start">
                    <div
                      className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm text-xs leading-relaxed"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(248,248,255,0.7)' }}
                    >
                      I noticed your stress has been elevated for 4 days. Your sleep score dropped to 62 — want to explore what&apos;s driving this?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div
                      className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm text-xs leading-relaxed"
                      style={{ background: 'rgba(124,58,237,0.18)', color: 'rgba(248,248,255,0.82)' }}
                    >
                      Yes, it&apos;s the project deadline on Friday.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div
                      className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>

                {/* Wellness bars */}
                <div className="px-5 pb-5 flex flex-col gap-2.5">
                  {[
                    { label: 'Mood', val: 72, color: '#7c3aed' },
                    { label: 'Sleep', val: 62, color: '#4f46e5' },
                    { label: 'Energy', val: 80, color: '#8b5cf6' },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                      <div className="w-12 text-[10px] font-medium" style={{ color: 'rgba(248,248,255,0.38)' }}>
                        {b.label}
                      </div>
                      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${b.val}%`, background: b.color, opacity: 0.85 }}
                        />
                      </div>
                      <div className="text-[10px] font-semibold w-6 text-right" style={{ color: 'rgba(248,248,255,0.38)' }}>
                        {b.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating accent chips */}
              <div
                className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: 'rgba(17,17,21,0.9)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  color: '#a78bfa',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                ✦ AI Insight ready
              </div>
              <div
                className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: 'rgba(17,17,21,0.9)',
                  border: '1px solid rgba(79,70,229,0.3)',
                  color: '#818cf8',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                14-day streak 🔥
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    'Mood Intelligence', 'Habit Architecture', 'Mira AI', 'Wellness DNA',
    'Reflective Journaling', 'Deep Analytics', 'Sleep Tracking', 'Mindfulness',
    'Progress Reports', 'Contextual Insights',
  ];
  const doubled = [...items, ...items];
  return (
    <div
      className="py-4 overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
    >
      <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'ticker-scroll 28s linear infinite' }}>
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-[11px] font-medium tracking-wide" style={{ color: 'rgba(248,248,255,0.22)' }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: 'rgba(124,58,237,0.5)' }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Features Bento Grid ──────────────────────────────────────────────────────
function FeaturesSection() {
  useScrollReveal();

  return (
    <section id="features" className="py-28 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="scroll-reveal mb-16 max-w-xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', color: '#a78bfa' }}
          >
            Core Capabilities
          </div>
          <h2
            className="font-bold mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.038em', color: '#f8f8ff', lineHeight: 1.08 }}
          >
            Everything your mind needs, nothing it doesn&apos;t.
          </h2>
          <p style={{ color: 'rgba(248,248,255,0.45)', lineHeight: 1.75 }}>
            Six precision-built tools that work together as one unified system.
          </p>
        </div>

        {/* Asymmetric bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Large card — Mira AI (spans 2 cols) */}
          <div className="lg:col-span-2 bento-card-accent rounded-2xl p-8 scroll-reveal">
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
            />
            <div className="relative flex flex-col sm:flex-row gap-6 items-start">
              <div className="feature-icon-wrap" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2C7.2 2 5 4.2 5 7c0 1.8 1 3.4 2.5 4.3V13h5v-1.7C14 10.4 15 8.8 15 7c0-2.8-2.2-5-5-5z" fill="#a78bfa" opacity="0.9" />
                  <path d="M7.5 13h5v1.5a.5.5 0 01-.5.5h-4a.5.5 0 01-.5-.5V13z" fill="#a78bfa" opacity="0.5" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-3" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>
                  Mira — Your AI Wellness Companion
                </h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(248,248,255,0.48)' }}>
                  Mira reads your mood history, journal entries, and habit data to give advice that&apos;s genuinely relevant to your life. Not generic tips — real, contextual guidance from an AI that remembers you.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Contextual memory', 'Evidence-based', 'Empathetic responses', '24/7 available'].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-[11px] font-medium"
                      style={{ background: 'rgba(124,58,237,0.1)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.18)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tall card — Mood Intelligence */}
          <div className="bento-card rounded-2xl p-7 scroll-reveal scroll-reveal-delay-1">
            <div className="feature-icon-wrap mb-5" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.18)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2C6.2 2 4 4.2 4 7c0 1.6.7 3 1.8 4L9 16l3.2-5C13.3 10 14 8.6 14 7c0-2.8-2.2-5-5-5z" fill="#fb7185" opacity="0.85" />
              </svg>
            </div>
            <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>
              Mood Intelligence
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
              Log how you feel in seconds. Mira identifies triggers, patterns, and correlations across your entire wellness profile over time.
            </p>
          </div>

          {/* Normal card — Habit Architecture */}
          <div className="bento-card rounded-2xl p-7 scroll-reveal scroll-reveal-delay-2">
            <div className="feature-icon-wrap mb-5" style={{ background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(2,132,199,0.18)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                <path d="M9 5v4l2.5 2.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>
              Habit Architecture
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
              Build habits that stick using proven loop science. Visual rings, streaks, and smart reminders keep you consistent.
            </p>
          </div>

          {/* Normal card — Reflective Journaling */}
          <div className="bento-card rounded-2xl p-7 scroll-reveal scroll-reveal-delay-3">
            <div className="feature-icon-wrap mb-5" style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.18)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="2" width="12" height="14" rx="2" stroke="#fcd34d" strokeWidth="1.5" fill="none" />
                <path d="M6 6h6M6 9h6M6 12h4" stroke="#fcd34d" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>
              Reflective Journaling
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
              AI-guided prompts that meet you where you are. Sentiment analysis reveals emotional themes over weeks and months.
            </p>
          </div>

          {/* Wide card — Wellness DNA + Analytics (spans 2 cols) */}
          <div className="lg:col-span-2 bento-card rounded-2xl p-7 scroll-reveal scroll-reveal-delay-4">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1">
                <div className="feature-icon-wrap mb-5" style={{ background: 'rgba(192,38,211,0.1)', border: '1px solid rgba(192,38,211,0.18)' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 2l1.5 4.5H15l-3.8 2.8 1.5 4.5L9 11l-3.7 2.8 1.5-4.5L3 6.5h4.5z" fill="#e879f9" opacity="0.85" />
                  </svg>
                </div>
                <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>
                  Wellness DNA
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
                  A living profile across 7 dimensions — emotional, physical, mental, social, purpose, sleep, and resilience. Updated daily as you check in.
                </p>
              </div>
              <div className="flex-1">
                <div className="feature-icon-wrap mb-5" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.18)' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 14l3.5-4 3 2.5L13 7l2 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>
                  Deep Analytics
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
                  Beautiful charts that make your progress impossible to ignore. See growth across days, weeks, and months with clarity.
                </p>
              </div>
            </div>
          </div>

          {/* Stat card */}
          <div className="bento-card rounded-2xl p-7 flex flex-col justify-between scroll-reveal scroll-reveal-delay-5">
            <div>
              <div className="font-bold mb-1" style={{ fontSize: '2.8rem', letterSpacing: '-0.04em', color: '#a78bfa', lineHeight: 1 }}>
                3×
              </div>
              <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(248,248,255,0.42)' }}>
                More likely to maintain habits with AI accountability built in.
              </p>
            </div>
            <div className="mt-6 h-px" style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.4), transparent)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Interactive Demo Showcase ────────────────────────────────────────────────
function DemoShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  useScrollReveal();

  const tabs = [
    {
      id: 'mira',
      label: 'Mira Chat',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1C4.2 1 2 3.2 2 6c0 1.4.6 2.7 1.6 3.6L7 13l3.4-3.4C11.4 8.7 12 7.4 12 6c0-2.8-2.2-5-5-5z" fill="currentColor" opacity="0.85" />
        </svg>
      ),
      content: (
        <div className="p-6 flex flex-col gap-3.5">
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(248,248,255,0.72)' }}>
              I noticed your stress scores have been elevated for 5 days. Your journal mentions &quot;deadline&quot; three times this week. Let&apos;s talk about what&apos;s driving this.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed" style={{ background: 'rgba(124,58,237,0.18)', color: 'rgba(248,248,255,0.82)' }}>
              It&apos;s the presentation on Friday. I keep overthinking it.
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(248,248,255,0.72)' }}>
              That makes sense. Your journal from last month shows you felt the same before your Q2 review — and you rated it 8/10 afterward. You&apos;re more prepared than you feel right now. Want to try a 3-minute grounding exercise?
            </div>
          </div>
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-sm flex-1" style={{ color: 'rgba(248,248,255,0.22)' }}>Talk to Mira...</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'mood',
      label: 'Mood Log',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M4.5 8.5c.7.8 1.6 1.2 2.5 1.2s1.8-.4 2.5-1.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <circle cx="5" cy="6" r="0.8" fill="currentColor" />
          <circle cx="9" cy="6" r="0.8" fill="currentColor" />
        </svg>
      ),
      content: (
        <div className="p-6">
          <div className="text-sm font-medium mb-5" style={{ color: 'rgba(248,248,255,0.45)' }}>How are you feeling right now?</div>
          <div className="flex gap-2.5 mb-6">
            {[{ e: '😔', l: 'Low' }, { e: '😐', l: 'Okay' }, { e: '🙂', l: 'Good' }, { e: '😊', l: 'Great' }, { e: '🤩', l: 'Amazing' }].map((item, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: i === 3 ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border: i === 3 ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  transform: i === 3 ? 'scale(1.06)' : 'scale(1)',
                }}
              >
                <span className="text-xl">{item.e}</span>
                <span className="text-[9px] font-medium" style={{ color: i === 3 ? '#a78bfa' : 'rgba(248,248,255,0.28)' }}>{item.l}</span>
              </div>
            ))}
          </div>
          <div className="text-xs font-medium mb-2" style={{ color: 'rgba(248,248,255,0.32)' }}>Energy Level</div>
          <div className="h-1.5 rounded-full mb-5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full w-3/4" style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {['Work stress', 'Good sleep', 'Exercise', 'Social time'].map((t) => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(124,58,237,0.08)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.16)' }}>{t}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'habits',
      label: 'Habits',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
      content: (
        <div className="p-6">
          <div className="text-sm font-medium mb-5" style={{ color: 'rgba(248,248,255,0.45)' }}>Today&apos;s habits</div>
          <div className="flex flex-col gap-2.5">
            {[
              { name: 'Morning meditation', done: true, streak: 14 },
              { name: '30 min exercise', done: true, streak: 7 },
              { name: 'Read 20 pages', done: false, streak: 5 },
              { name: 'No screens after 10pm', done: false, streak: 3 },
            ].map((h) => (
              <div
                key={h.name}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={h.done ? { background: '#7c3aed' } : { border: '1.5px solid rgba(255,255,255,0.15)' }}
                >
                  {h.done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm flex-1" style={{ color: h.done ? 'rgba(248,248,255,0.45)' : 'rgba(248,248,255,0.78)', textDecoration: h.done ? 'line-through' : 'none' }}>
                  {h.name}
                </span>
                <span className="text-xs" style={{ color: 'rgba(248,248,255,0.28)' }}>🔥 {h.streak}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
      content: (
        <div className="p-6">
          <div className="text-sm font-medium mb-1.5" style={{ color: 'rgba(248,248,255,0.45)' }}>Today&apos;s reflection</div>
          <div className="text-xs italic mb-4" style={{ color: 'rgba(248,248,255,0.22)' }}>&quot;What made you feel most alive today?&quot;</div>
          <div
            className="rounded-xl p-4 text-sm leading-relaxed mb-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(248,248,255,0.58)', minHeight: '90px' }}
          >
            Today I finally finished the presentation I&apos;ve been dreading. The moment I hit send, I felt this wave of relief wash over me. Mira reminded me that I always feel this way before big moments — and she was right...
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(248,248,255,0.28)' }}>
            <span>142 words · 3 min</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Positive sentiment
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="demo" className="py-28 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="scroll-reveal text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.18)', color: '#818cf8' }}
          >
            Interactive Preview
          </div>
          <h2
            className="font-bold mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.038em', color: '#f8f8ff', lineHeight: 1.08 }}
          >
            Experience MindCast before you sign up.
          </h2>
          <p style={{ color: 'rgba(248,248,255,0.45)', lineHeight: 1.75 }}>
            Explore the core tools that make MindCast different.
          </p>
        </div>

        {/* Tab selector */}
        <div className="scroll-reveal scroll-reveal-delay-1 flex justify-center gap-2 mb-8 flex-wrap">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              suppressHydrationWarning
              onClick={() => setActiveTab(i)}
              className={`demo-tab flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium ${activeTab === i ? 'active' : ''}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Preview window */}
        <div
          className="scroll-reveal scroll-reveal-delay-2 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(17,17,21,0.9)',
            border: '1px solid rgba(124,58,237,0.15)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.06)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center gap-3 px-5 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.45)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.45)' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.45)' }} />
            </div>
            <div
              className="flex-1 mx-3 h-6 rounded-md flex items-center px-3 text-xs"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(248,248,255,0.22)' }}
            >
              mindcast.app/{tabs[activeTab].id}
            </div>
          </div>
          {/* Tab content */}
          <div key={activeTab} style={{ animation: 'fade-in 0.3s ease both' }}>
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── About / Product Overview ─────────────────────────────────────────────────
function AboutSection() {
  useScrollReveal();

  return (
    <section id="about" className="py-28 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: visual */}
          <div className="scroll-reveal relative">
            <div
              className="absolute inset-0 rounded-3xl blur-3xl"
              style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.14) 0%, transparent 70%)' }}
            />
            <div
              className="relative rounded-2xl p-8"
              style={{
                background: 'rgba(17,17,21,0.85)',
                border: '1px solid rgba(124,58,237,0.14)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              }}
            >
              {/* Wellness DNA bars */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                    <circle
                      cx="40" cy="40" r="34" fill="none" strokeWidth="5" strokeLinecap="round"
                      stroke="url(#wdna)"
                      strokeDasharray="213.6"
                      strokeDashoffset={213.6 * (1 - 0.78)}
                    />
                    <defs>
                      <linearGradient id="wdna" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-bold text-xl" style={{ color: '#f8f8ff', letterSpacing: '-0.03em' }}>78</div>
                    <div className="text-[9px]" style={{ color: 'rgba(248,248,255,0.35)' }}>DNA</div>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-base mb-1" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>Wellness DNA Profile</div>
                  <div className="text-xs" style={{ color: 'rgba(248,248,255,0.38)' }}>7 dimensions · updated daily</div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Emotional', score: 82, color: '#7c3aed' },
                  { label: 'Mental', score: 88, color: '#4f46e5' },
                  { label: 'Physical', score: 74, color: '#8b5cf6' },
                  { label: 'Social', score: 65, color: '#818cf8' },
                  { label: 'Sleep', score: 71, color: '#a78bfa' },
                  { label: 'Resilience', score: 85, color: '#c4b5fd' },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className="w-16 text-xs text-right" style={{ color: 'rgba(248,248,255,0.38)' }}>{d.label}</div>
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${d.score}%`, background: d.color, opacity: 0.8 }} />
                    </div>
                    <div className="w-6 text-xs font-semibold" style={{ color: 'rgba(248,248,255,0.35)' }}>{d.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: copy */}
          <div className="scroll-reveal scroll-reveal-delay-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', color: '#a78bfa' }}
            >
              What is MindCast?
            </div>
            <h2
              className="font-bold mb-5"
              style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', letterSpacing: '-0.038em', color: '#f8f8ff', lineHeight: 1.1 }}
            >
              Mental wellness,<br />
              <span className="gradient-text">reimagined.</span>
            </h2>
            <p className="leading-relaxed mb-8" style={{ color: 'rgba(248,248,255,0.48)', lineHeight: 1.8, fontSize: '1.05rem' }}>
              MindCast is not another journaling app. It&apos;s a complete mental wellness operating system — powered by AI, grounded in science, and designed to feel like a conversation with someone who truly understands you.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Personalized', desc: 'Unique to your data' },
                { label: 'Dynamic', desc: 'Evolves every day' },
                { label: 'Actionable', desc: 'Mira guides growth' },
                { label: 'Private', desc: 'Only you can see it' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="font-semibold text-sm mb-1" style={{ color: '#f8f8ff' }}>{item.label}</div>
                  <div className="text-xs" style={{ color: 'rgba(248,248,255,0.35)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────
function CTABanner() {
  useScrollReveal();
  return (
    <section className="py-20 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <div
          className="scroll-reveal relative rounded-3xl p-12 md:p-16 text-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.08) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
            boxShadow: '0 0 80px rgba(124,58,237,0.08)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 65%)' }}
          />
          <div className="relative">
            <h2
              className="font-bold mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.038em', color: '#f8f8ff', lineHeight: 1.08 }}
            >
              Start your wellness journey today.
            </h2>
            <p className="mb-10 max-w-lg mx-auto" style={{ color: 'rgba(248,248,255,0.48)', lineHeight: 1.75 }}>
              Free to start. No credit card required. Your mind deserves better care.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-up-login-screen"
                className="btn-primary group flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-white"
              >
                <span>Launch App — It&apos;s Free</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <path d="M2.5 7h9M7.5 3.5l3.5 3.5-3.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/dashboard"
                className="btn-ghost flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-sm"
                style={{ color: 'rgba(248,248,255,0.65)' }}
              >
                Explore Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      className="px-5 sm:px-8 py-14"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
          {/* Brand */}
          <div className="max-w-[240px]">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5C4.8 1.5 3 3.3 3 5.5c0 1.4.7 2.6 1.8 3.3V10h4.4V8.8C10.3 8.1 11 6.9 11 5.5c0-2.2-1.8-4-4-4z" fill="white" opacity="0.9" />
                </svg>
              </div>
              <span className="font-bold" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>MindCast</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.28)' }}>
              AI-powered mental wellness. Built with care, designed for real life.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-12">
            {[
              { heading: 'Product', links: ['Features', 'Dashboard', 'Wellness DNA', 'Analytics'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { heading: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map((col) => (
              <div key={col.heading}>
                <div
                  className="text-[10px] font-semibold uppercase tracking-widest mb-4"
                  style={{ color: 'rgba(248,248,255,0.3)' }}
                >
                  {col.heading}
                </div>
                <div className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'rgba(248,248,255,0.28)' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,248,255,0.65)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,248,255,0.28)')}
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="text-xs" style={{ color: 'rgba(248,248,255,0.2)' }}>
            © 2026 MindCast. All rights reserved.
          </div>
          <div className="text-xs font-mono tracking-wider" style={{ color: 'rgba(248,248,255,0.2)' }}>
            made by aditya naik and vihaan vaghela
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div
      suppressHydrationWarning
      className="lp-root min-h-screen"
      style={{ background: '#0a0a0c', color: '#f8f8ff' }}
    >
      <style>{globalStyles}</style>
      <Background />
      <Navbar />
      <main>
        <HeroSection />
        <Ticker />
        <FeaturesSection />
        <DemoShowcase />
        <AboutSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
