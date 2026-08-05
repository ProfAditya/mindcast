'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Global Styles ────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  :root {
    --obsidian: #0a0a0c;
    --s1: #111115;
    --s2: #18181e;
    --s3: #1f1f28;
    --violet: #7c3aed;
    --violet-l: #a78bfa;
    --indigo: #4f46e5;
    --indigo-l: #818cf8;
    --neon: #8b5cf6;
    --border-s: rgba(255,255,255,0.06);
    --border-m: rgba(255,255,255,0.10);
    --tp: #f8f8ff;
    --ts: rgba(248,248,255,0.55);
    --tm: rgba(248,248,255,0.30);
  }

  .mc-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; }

  @keyframes orb1 {
    0%,100%{transform:translate(0,0) scale(1);}
    40%{transform:translate(60px,80px) scale(1.12);}
    70%{transform:translate(-30px,40px) scale(0.94);}
  }
  @keyframes orb2 {
    0%,100%{transform:translate(0,0) scale(1);}
    35%{transform:translate(-80px,50px) scale(1.08);}
    65%{transform:translate(50px,-70px) scale(1.04);}
  }
  @keyframes orb3 {
    0%,100%{transform:translate(0,0) scale(1);}
    50%{transform:translate(70px,-60px) scale(1.1);}
  }
  @keyframes grad-text {
    0%,100%{background-position:0% 50%;}
    50%{background-position:100% 50%;}
  }
  @keyframes float-card {
    0%,100%{transform:translateY(0px) rotate(-0.8deg);}
    50%{transform:translateY(-14px) rotate(-0.8deg);}
  }
  @keyframes glow-pulse {
    0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3);}
    50%{box-shadow:0 0 40px rgba(124,58,237,0.65), 0 0 80px rgba(124,58,237,0.2);}
  }
  @keyframes fade-up {
    from{opacity:0;transform:translateY(28px);}
    to{opacity:1;transform:translateY(0);}
  }
  @keyframes fade-in {
    from{opacity:0;}
    to{opacity:1;}
  }
  @keyframes waveform {
    0%,100%{transform:scaleY(0.4);}
    50%{transform:scaleY(1);}
  }
  @keyframes spin-slow {
    from{transform:rotate(0deg);}
    to{transform:rotate(360deg);}
  }
  @keyframes progress-fill {
    from{width:0%;}
    to{width:62%;}
  }
  @keyframes ticker-scroll {
    0%{transform:translateX(0);}
    100%{transform:translateX(-50%);}
  }

  .animate-fade-up { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-fade-in { animation: fade-in 0.5s ease both; }
  .delay-100{animation-delay:0.1s;} .delay-200{animation-delay:0.2s;}
  .delay-300{animation-delay:0.3s;} .delay-400{animation-delay:0.4s;}
  .delay-500{animation-delay:0.5s;} .delay-600{animation-delay:0.6s;}

  .gradient-text {
    background: linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #c4b5fd 80%, #a78bfa 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: grad-text 5s ease infinite;
  }

  .btn-primary {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
    box-shadow: 0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
    transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
    position: relative; overflow: hidden;
  }
  .btn-primary::before {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    opacity:0; transition:opacity 0.25s ease;
  }
  .btn-primary:hover::before{opacity:1;}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15);}
  .btn-primary:active{transform:translateY(0);}
  .btn-primary span{position:relative;z-index:1;}

  .btn-ghost {
    border:1px solid rgba(255,255,255,0.10);
    transition:all 0.25s cubic-bezier(0.22,1,0.36,1);
    background:rgba(255,255,255,0.03);
  }
  .btn-ghost:hover{border-color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);transform:translateY(-1px);}

  .glass-nav {
    backdrop-filter:blur(24px) saturate(180%);
    -webkit-backdrop-filter:blur(24px) saturate(180%);
    background:rgba(10,10,12,0.78);
    border-bottom:1px solid rgba(255,255,255,0.06);
  }

  .bento-card {
    background:var(--s1);
    border:1px solid var(--border-s);
    transition:all 0.3s cubic-bezier(0.22,1,0.36,1);
    position:relative; overflow:hidden;
  }
  .bento-card::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(135deg,rgba(124,58,237,0.04) 0%,transparent 60%);
    opacity:0; transition:opacity 0.3s ease;
  }
  .bento-card:hover{border-color:rgba(124,58,237,0.28);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.4),0 0 0 1px rgba(124,58,237,0.12);}
  .bento-card:hover::before{opacity:1;}

  .bento-accent {
    background:linear-gradient(135deg,rgba(124,58,237,0.08) 0%,rgba(79,70,229,0.05) 100%);
    border:1px solid rgba(124,58,237,0.18);
    transition:all 0.3s cubic-bezier(0.22,1,0.36,1);
    position:relative; overflow:hidden;
  }
  .bento-accent:hover{border-color:rgba(124,58,237,0.4);transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.4),0 0 30px rgba(124,58,237,0.15);}

  .scroll-reveal {
    opacity:0; transform:translateY(24px);
    transition:opacity 0.7s cubic-bezier(0.22,1,0.36,1),transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .scroll-reveal.visible{opacity:1;transform:translateY(0);}
  .sr-d1{transition-delay:0.1s;} .sr-d2{transition-delay:0.2s;}
  .sr-d3{transition-delay:0.3s;} .sr-d4{transition-delay:0.4s;}
  .sr-d5{transition-delay:0.5s;}

  .noise-overlay {
    position:fixed; inset:0; pointer-events:none; z-index:1; opacity:0.022;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .waveform-bar {
    width: 3px;
    border-radius: 2px;
    background: linear-gradient(180deg, #a78bfa, #4f46e5);
    transform-origin: center bottom;
  }
  .waveform-bar.playing {
    animation: waveform 0.8s ease-in-out infinite;
  }

  .audio-progress {
    animation: progress-fill 2.5s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  .studio-input:focus {
    outline: none;
    border-color: rgba(124,58,237,0.45) !important;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }

  .view-toggle-btn {
    transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
  }
  .view-toggle-btn.active {
    background: rgba(124,58,237,0.15);
    border-color: rgba(124,58,237,0.3) !important;
    color: #a78bfa;
  }
  .view-toggle-btn:not(.active) {
    color: rgba(248,248,255,0.4);
  }
  .view-toggle-btn:not(.active):hover {
    background: rgba(255,255,255,0.04);
    color: rgba(248,248,255,0.7);
  }
`;

// ─── Scroll Reveal Hook ───────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── Background ───────────────────────────────────────────────────────────────
function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{ background: '#0a0a0c' }} />
      <div className="absolute -top-32 -left-32 w-[640px] h-[640px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(124,58,237,0.16) 0%,transparent 70%)', animation: 'orb1 22s ease-in-out infinite' }} />
      <div className="absolute top-1/2 -right-48 w-[560px] h-[560px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(79,70,229,0.10) 0%,transparent 70%)', animation: 'orb2 28s ease-in-out infinite' }} />
      <div className="absolute -bottom-20 left-1/4 w-[480px] h-[480px] rounded-full"
        style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)', animation: 'orb3 34s ease-in-out infinite' }} />
      <div className="absolute inset-0"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px)', backgroundSize: '72px 72px' }} />
      <div className="noise-overlay" />
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ view, setView }: { view: 'landing' | 'studio'; setView: (v: 'landing' | 'studio') => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500">
      <div className={`transition-all duration-500 ${scrolled ? 'glass-nav' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => setView('landing')} className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2a3 3 0 00-3 3v1.5l-1 2.5h8l-1-2.5V5a3 3 0 00-3-3z" fill="white" opacity="0.95" />
                <path d="M5.5 9.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" stroke="white" strokeWidth="1.2" fill="none" opacity="0.6" />
                <line x1="8" y1="12" x2="8" y2="14" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
            <span className="font-bold text-[17px]" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>MindCast</span>
          </button>

          {/* View Toggle — desktop */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['landing', 'studio'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`view-toggle-btn px-4 py-1.5 rounded-full text-xs font-semibold border border-transparent ${view === v ? 'active' : ''}`}>
                {v === 'landing' ? 'Overview' : '✦ App Studio'}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-up-login-screen"
              className="px-4 py-2 text-[13px] font-medium transition-colors duration-200"
              style={{ color: 'rgba(248,248,255,0.45)' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f8f8ff')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,248,255,0.45)')}>
              Sign in
            </Link>
            <button onClick={() => setView('studio')}
              className="btn-primary px-5 py-2.5 rounded-full text-[13px] font-semibold text-white">
              <span>Launch App</span>
            </button>
          </div>

          {/* Mobile toggle */}
          <button suppressHydrationWarning className="md:hidden p-2 rounded-lg"
            style={{ color: 'rgba(248,248,255,0.6)' }} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              {menuOpen
                ? <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                : <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden" style={{ background: 'rgba(10,10,12,0.96)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-5 py-4 flex flex-col gap-2">
            {(['landing', 'studio'] as const).map((v) => (
              <button key={v} onClick={() => { setView(v); setMenuOpen(false); }}
                className="px-4 py-3 text-sm font-medium rounded-xl text-left transition-colors"
                style={{ color: view === v ? '#a78bfa' : 'rgba(248,248,255,0.55)', background: view === v ? 'rgba(124,58,237,0.1)' : 'transparent' }}>
                {v === 'landing' ? 'Overview' : '✦ App Studio'}
              </button>
            ))}
            <div className="mt-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => { setView('studio'); setMenuOpen(false); }}
                className="btn-primary w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-white text-center">
                <span>Launch App</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ onLaunch }: { onLaunch: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 sm:px-8 pt-24 pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)', color: '#a78bfa' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 6px rgba(167,139,250,0.8)', animation: 'glow-pulse 2s ease-in-out infinite' }} />
              AI Audio Generation · Instant Deep-Dives
            </div>

            <h1 className="animate-fade-up delay-100 font-bold leading-[1.04] mb-6"
              style={{ fontSize: 'clamp(2.6rem,5.5vw,4.8rem)', letterSpacing: '-0.04em', color: '#f8f8ff' }}>
              Turn any text<br className="hidden sm:block" />
              <span className="gradient-text">into a podcast.</span>
            </h1>

            <p className="animate-fade-up delay-200 leading-relaxed mb-10 max-w-lg"
              style={{ fontSize: 'clamp(1rem,1.8vw,1.15rem)', color: 'rgba(248,248,255,0.5)', lineHeight: '1.75' }}>
              Paste an article, research paper, or any topic — MindCast&apos;s AI transforms it into a rich, narrated audio deep-dive in seconds. Knowledge, on demand, in your ears.
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap items-center gap-3 mb-12">
              <button onClick={onLaunch}
                className="btn-primary group flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-white text-sm">
                <span>Launch App</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">
                  <path d="M2.5 7h9M7.5 3.5l3.5 3.5-3.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <a href="#features"
                className="btn-ghost flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm"
                style={{ color: 'rgba(248,248,255,0.7)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5.5 4.5l4 2.5-4 2.5V4.5z" fill="currentColor" />
                </svg>
                See how it works
              </a>
            </div>

            <div className="animate-fade-up delay-400 flex items-center gap-5 flex-wrap">
              {['No account needed to try', 'Instant generation', 'Export-ready audio'].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(248,248,255,0.32)' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l2.5 2.5L10 3" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating audio card */}
          <div className="animate-fade-up delay-500 relative flex items-center justify-center">
            <div className="absolute inset-8 rounded-3xl blur-3xl"
              style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.22) 0%,transparent 70%)' }} />

            <div className="relative w-full max-w-sm" style={{ animation: 'float-card 6s ease-in-out infinite' }}>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(17,17,21,0.88)', border: '1px solid rgba(124,58,237,0.2)', backdropFilter: 'blur(24px)', boxShadow: '0 32px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(124,58,237,0.08)' }}>
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1a3 3 0 00-3 3v1l-.8 2h7.6L10 5V4a3 3 0 00-3-3z" fill="white" opacity="0.9" />
                        <path d="M4.5 7c0 1.4 1.1 2.5 2.5 2.5S9.5 8.4 9.5 7" stroke="white" strokeWidth="1.1" fill="none" opacity="0.6" />
                        <line x1="7" y1="9.5" x2="7" y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: '#f8f8ff' }}>MindCast AI</div>
                      <div className="text-[10px]" style={{ color: 'rgba(248,248,255,0.35)' }}>Generating audio…</div>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                    12 min
                  </div>
                </div>

                {/* Waveform preview */}
                <div className="px-5 py-5">
                  <div className="text-xs font-semibold mb-1" style={{ color: '#f8f8ff' }}>The Science of Deep Work</div>
                  <div className="text-[10px] mb-4" style={{ color: 'rgba(248,248,255,0.38)' }}>AI Deep-Dive · 12 min · Generated just now</div>
                  <div className="flex items-end gap-[3px] h-10 mb-4">
                    {Array.from({ length: 38 }).map((_, i) => {
                      const heights = [30,55,40,70,45,85,60,35,75,50,90,40,65,30,80,55,45,70,35,60,85,40,55,75,30,65,50,80,40,70,55,35,90,45,60,75,40,55];
                      const h = heights[i % heights.length];
                      const isPlayed = i < 14;
                      return (
                        <div key={i} className={`waveform-bar ${i >= 12 && i <= 16 ? 'playing' : ''}`}
                          style={{ height: `${h}%`, background: isPlayed ? 'linear-gradient(180deg,#a78bfa,#4f46e5)' : 'rgba(255,255,255,0.1)', animationDelay: `${(i % 5) * 0.15}s` }} />
                      );
                    })}
                  </div>
                  {/* Progress bar */}
                  <div className="h-0.5 rounded-full mb-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{ width: '38%', background: 'linear-gradient(90deg,#7c3aed,#4f46e5)' }} />
                  </div>
                  <div className="flex justify-between text-[10px]" style={{ color: 'rgba(248,248,255,0.3)' }}>
                    <span>4:32</span><span>12:05</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-5 px-5 pb-5">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                    style={{ color: 'rgba(248,248,255,0.4)' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M12 3L5 8l7 5V3z" fill="currentColor" opacity="0.7" />
                      <line x1="3" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    </svg>
                  </button>
                  <button className="w-11 h-11 flex items-center justify-center rounded-full"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 16px rgba(124,58,237,0.45)' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="4" y="3" width="3" height="10" rx="1" fill="white" />
                      <rect x="9" y="3" width="3" height="10" rx="1" fill="white" />
                    </svg>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                    style={{ color: 'rgba(248,248,255,0.4)' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 3l7 5-7 5V3z" fill="currentColor" opacity="0.7" />
                      <line x1="13" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Floating chips */}
              <div className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(17,17,21,0.92)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                ✦ AI Generated
              </div>
              <div className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'rgba(17,17,21,0.92)', border: '1px solid rgba(79,70,229,0.3)', color: '#818cf8', backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
                Ready in &lt;10s ⚡
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
  const items = ['AI Narration', 'Deep-Dive Audio', 'Research Summaries', 'Instant Podcasts', 'Text to Speech', 'Topic Exploration', 'Export MP3', 'Smart Chapters', 'Voice Synthesis', 'Knowledge Audio'];
  const doubled = [...items, ...items];
  return (
    <div className="py-4 overflow-hidden"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
      <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'ticker-scroll 30s linear infinite' }}>
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
        <div className="scroll-reveal mb-16 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', color: '#a78bfa' }}>
            Core Capabilities
          </div>
          <h2 className="font-bold mb-4"
            style={{ fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.038em', color: '#f8f8ff', lineHeight: 1.08 }}>
            From raw text to rich audio,<br />in one step.
          </h2>
          <p style={{ color: 'rgba(248,248,255,0.45)', lineHeight: 1.75 }}>
            Everything you need to transform written knowledge into immersive listening experiences.
          </p>
        </div>

        {/* Asymmetric bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Large accent card — AI Engine (spans 2 cols) */}
          <div className="lg:col-span-2 bento-accent rounded-2xl p-8 scroll-reveal">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)' }} />
            <div className="relative flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a4 4 0 00-4 4v1.5L4.5 11h11L14 7.5V6a4 4 0 00-4-4z" fill="#a78bfa" opacity="0.9" />
                  <path d="M7 11c0 1.7 1.3 3 3 3s3-1.3 3-3" stroke="#a78bfa" strokeWidth="1.3" fill="none" opacity="0.6" />
                  <line x1="10" y1="14" x2="10" y2="16" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-3" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>
                  Neural Audio Synthesis Engine
                </h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(248,248,255,0.48)' }}>
                  MindCast&apos;s AI doesn&apos;t just read your text — it understands it. The engine extracts key arguments, restructures them into a narrative arc, and delivers a natural, engaging narration with proper pacing, emphasis, and chapter breaks.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Natural prosody', 'Chapter detection', 'Narrative restructuring', 'Multi-voice support'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-[11px] font-medium"
                      style={{ background: 'rgba(124,58,237,0.1)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.18)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tall card — Instant Generation */}
          <div className="bento-card rounded-2xl p-7 scroll-reveal sr-d1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.18)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2l1.5 4H15l-3.5 2.5 1.5 4L9 10l-4 2.5 1.5-4L3 6h4.5z" fill="#4ade80" opacity="0.85" />
              </svg>
            </div>
            <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>Sub-10s Generation</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
              Paste your content and receive a fully narrated audio file in under 10 seconds. No queues, no waiting — just instant knowledge.
            </p>
          </div>

          {/* Card — Smart Summarization */}
          <div className="bento-card rounded-2xl p-7 scroll-reveal sr-d2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(2,132,199,0.18)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="2" width="12" height="14" rx="2" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                <path d="M6 6h6M6 9h6M6 12h4" stroke="#38bdf8" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>Smart Summarization</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
              Automatically distills long-form content into focused, digestible audio summaries without losing the core insights.
            </p>
          </div>

          {/* Card — Topic Deep-Dives */}
          <div className="bento-card rounded-2xl p-7 scroll-reveal sr-d3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.18)' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke="#fcd34d" strokeWidth="1.5" fill="none" />
                <path d="M9 5v4l2.5 2.5" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>Topic Deep-Dives</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
              Type any topic and MindCast generates a structured, research-backed audio exploration — no source material needed.
            </p>
          </div>

          {/* Wide card — Export + Chapters (spans 2 cols) */}
          <div className="lg:col-span-2 bento-card rounded-2xl p-7 scroll-reveal sr-d4">
            <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(192,38,211,0.1)', border: '1px solid rgba(192,38,211,0.18)' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3v9M5 9l4 4 4-4" stroke="#e879f9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 14h12" stroke="#e879f9" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>Export-Ready Audio</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
                  Download your generated audio as high-quality MP3 or stream directly. Share as a personal podcast episode or save for offline listening.
                </p>
              </div>
              <div className="flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.18)' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 14l3.5-4 3 2.5L13 7l2 3" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <h3 className="font-bold text-base mb-2.5" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>Auto Chapter Markers</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.42)' }}>
                  Every generated audio includes smart chapter markers so you can jump to specific sections, just like a real podcast.
                </p>
              </div>
            </div>
          </div>

          {/* Stat card */}
          <div className="bento-card rounded-2xl p-7 flex flex-col justify-between scroll-reveal sr-d5">
            <div>
              <div className="font-bold mb-1" style={{ fontSize: '2.8rem', letterSpacing: '-0.04em', color: '#a78bfa', lineHeight: 1 }}>
                &lt;10s
              </div>
              <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(248,248,255,0.42)' }}>
                Average time from text input to fully narrated audio output.
              </p>
            </div>
            <div className="mt-6 h-px" style={{ background: 'linear-gradient(90deg,rgba(124,58,237,0.4),transparent)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── App Studio Simulator ─────────────────────────────────────────────────────
interface AudioOutput {
  title: string;
  duration: string;
  summary: string;
  chapters: string[];
}

function AppStudio() {
  const [topic, setTopic] = useState('');
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [output, setOutput] = useState<AudioOutput | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadingMessages = [
    'Parsing your topic…',
    'Structuring narrative arc…',
    'Synthesizing audio layers…',
    'Applying voice prosody…',
    'Finalising deep-dive…',
  ];

  const generateOutput = (t: string): AudioOutput => {
    const trimmed = t.trim() || 'Artificial Intelligence';
    const mins = 8 + Math.floor(trimmed.length % 7);
    const secs = (trimmed.length * 13) % 60;
    return {
      title: `Deep-Dive: ${trimmed.charAt(0).toUpperCase() + trimmed.slice(1)}`,
      duration: `${mins}:${secs.toString().padStart(2, '0')}`,
      summary: `This AI-generated audio explores the core principles, historical context, and modern implications of "${trimmed}". The narration covers foundational concepts, key debates in the field, and actionable takeaways — structured as a focused, research-backed deep-dive designed for curious minds.`,
      chapters: [
        `Introduction to ${trimmed.split(' ')[0]}`,
        'Historical Context & Origins',
        'Core Mechanisms Explained',
        'Real-World Applications',
        'Key Takeaways',
      ],
    };
  };

  const handleGenerate = () => {
    if (!topic.trim() || phase === 'loading') return;
    setPhase('loading');
    setOutput(null);
    setPlayProgress(0);
    setIsPlaying(false);

    let msgIdx = 0;
    setLoadingMsg(loadingMessages[0]);
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 700);

    setTimeout(() => {
      clearInterval(msgInterval);
      setOutput(generateOutput(topic));
      setPhase('done');
    }, 3500);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (progressRef.current) clearInterval(progressRef.current);
    } else {
      setIsPlaying(true);
      progressRef.current = setInterval(() => {
        setPlayProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            if (progressRef.current) clearInterval(progressRef.current);
            return 100;
          }
          return p + 0.4;
        });
      }, 80);
    }
  };

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const waveHeights = [30,55,40,70,45,85,60,35,75,50,90,40,65,30,80,55,45,70,35,60,85,40,55,75,30,65,50,80,40,70,55,35,90,45,60,75,40,55,30,50,70,45,80,35,65,55,40,75];

  return (
    <div className="min-h-screen pt-24 pb-20 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)', color: '#a78bfa' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#a78bfa', animation: 'glow-pulse 2s ease-in-out infinite' }} />
            Interactive App Studio
          </div>
          <h1 className="font-bold mb-4" style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', letterSpacing: '-0.04em', color: '#f8f8ff', lineHeight: 1.06 }}>
            Generate your audio<br /><span className="gradient-text">deep-dive now.</span>
          </h1>
          <p style={{ color: 'rgba(248,248,255,0.45)', lineHeight: 1.75, maxWidth: '480px', margin: '0 auto' }}>
            Type any topic or paste text below. MindCast&apos;s AI will transform it into a narrated audio deep-dive instantly.
          </p>
        </div>

        {/* Input form */}
        <div className="animate-fade-up delay-200 rounded-2xl p-6 mb-6"
          style={{ background: 'rgba(17,17,21,0.9)', border: '1px solid rgba(124,58,237,0.15)', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
          <label className="block text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'rgba(248,248,255,0.35)' }}>
            Topic or Text
          </label>
          <textarea
            className="studio-input w-full rounded-xl px-4 py-3.5 text-sm resize-none mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#f8f8ff', minHeight: '110px', lineHeight: 1.7 }}
            placeholder="e.g. The neuroscience of habit formation, or paste an article…"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
            disabled={phase === 'loading'}
          />

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              {['Quick (3 min)', 'Standard (8 min)', 'Deep (15 min)'].map((opt, i) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ border: `1.5px solid ${i === 1 ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`, background: i === 1 ? '#7c3aed' : 'transparent' }}>
                    {i === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs" style={{ color: i === 1 ? '#a78bfa' : 'rgba(248,248,255,0.38)' }}>{opt}</span>
                </label>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={!topic.trim() || phase === 'loading'}
              className="btn-primary flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
              <span>{phase === 'loading' ? 'Generating…' : 'Generate Audio'}</span>
              {phase !== 'loading' && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="relative z-10">
                  <path d="M2.5 7h9M7.5 3.5l3.5 3.5-3.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {phase === 'loading' && (
          <div className="animate-fade-in rounded-2xl p-8 text-center"
            style={{ background: 'rgba(17,17,21,0.9)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <div className="flex items-center justify-center mb-5">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ animation: 'spin-slow 1.2s linear infinite' }}>
                  <circle cx="11" cy="11" r="9" stroke="rgba(124,58,237,0.25)" strokeWidth="2" fill="none" />
                  <path d="M11 2a9 9 0 019 9" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-semibold mb-2" style={{ color: '#f8f8ff' }}>{loadingMsg}</div>
            <div className="text-xs" style={{ color: 'rgba(248,248,255,0.35)' }}>Crafting your personalised audio deep-dive…</div>
            <div className="mt-5 flex items-end justify-center gap-[3px] h-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="waveform-bar playing"
                  style={{ height: `${30 + (i % 5) * 14}%`, opacity: 0.5, animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Output card */}
        {phase === 'done' && output && (
          <div className="animate-fade-in rounded-2xl overflow-hidden"
            style={{ background: 'rgba(17,17,21,0.95)', border: '1px solid rgba(124,58,237,0.22)', boxShadow: '0 24px 80px rgba(0,0,0,0.5),0 0 40px rgba(124,58,237,0.08)' }}>
            {/* Output header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(124,58,237,0.05)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1a3 3 0 00-3 3v1l-.8 2h7.6L10 5V4a3 3 0 00-3-3z" fill="white" opacity="0.9" />
                    <path d="M4.5 7c0 1.4 1.1 2.5 2.5 2.5S9.5 8.4 9.5 7" stroke="white" strokeWidth="1.1" fill="none" opacity="0.6" />
                    <line x1="7" y1="9.5" x2="7" y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#f8f8ff' }}>MindCast AI</div>
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(248,248,255,0.35)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Audio ready
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{ background: 'rgba(124,58,237,0.12)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                  {output.duration}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                  ✓ Generated
                </span>
              </div>
            </div>

            {/* Title + Summary */}
            <div className="px-6 pt-6 pb-4">
              <h3 className="font-bold text-lg mb-3" style={{ color: '#f8f8ff', letterSpacing: '-0.025em' }}>{output.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.52)', lineHeight: 1.75 }}>{output.summary}</p>
            </div>

            {/* Waveform + player */}
            <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-end gap-[2.5px] h-12 mb-4">
                {waveHeights.map((h, i) => {
                  const played = (i / waveHeights.length) * 100 < playProgress;
                  return (
                    <div key={i} className={`waveform-bar ${isPlaying && Math.abs(i - Math.floor((playProgress / 100) * waveHeights.length)) < 3 ? 'playing' : ''}`}
                      style={{ height: `${h}%`, background: played ? 'linear-gradient(180deg,#a78bfa,#4f46e5)' : 'rgba(255,255,255,0.09)', animationDelay: `${(i % 5) * 0.12}s`, flex: '1', maxWidth: '4px' }} />
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1 rounded-full mb-2 overflow-hidden cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.07)' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = ((e.clientX - rect.left) / rect.width) * 100;
                  setPlayProgress(Math.max(0, Math.min(100, pct)));
                }}>
                <div className="h-full rounded-full transition-all duration-100"
                  style={{ width: `${playProgress}%`, background: 'linear-gradient(90deg,#7c3aed,#4f46e5)' }} />
              </div>
              <div className="flex justify-between text-[10px] mb-5" style={{ color: 'rgba(248,248,255,0.3)' }}>
                <span>{Math.floor((playProgress / 100) * parseInt(output.duration))}:{String(Math.floor(((playProgress / 100) * parseInt(output.duration) * 60) % 60)).padStart(2, '0')}</span>
                <span>{output.duration}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6">
                <button className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
                  style={{ color: 'rgba(248,248,255,0.4)' }}
                  onClick={() => setPlayProgress(Math.max(0, playProgress - 10))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M14 4L7 9l7 5V4z" fill="currentColor" opacity="0.7" />
                    <line x1="4" y1="4" x2="4" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
                  </svg>
                </button>
                <button onClick={togglePlay}
                  className="w-13 h-13 flex items-center justify-center rounded-full transition-all"
                  style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 6px 24px rgba(124,58,237,0.5)' }}>
                  {isPlaying
                    ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4" y="3" width="3.5" height="12" rx="1.2" fill="white" /><rect x="10.5" y="3" width="3.5" height="12" rx="1.2" fill="white" /></svg>
                    : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 4l9 5-9 5V4z" fill="white" /></svg>
                  }
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
                  style={{ color: 'rgba(248,248,255,0.4)' }}
                  onClick={() => setPlayProgress(Math.min(100, playProgress + 10))}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 4l7 5-7 5V4z" fill="currentColor" opacity="0.7" />
                    <line x1="14" y1="4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chapters */}
            <div className="px-6 pb-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-3 pt-5" style={{ color: 'rgba(248,248,255,0.3)' }}>
                Chapters
              </div>
              <div className="flex flex-col gap-2">
                {output.chapters.map((ch, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={{ background: i === 0 ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{ background: i === 0 ? '#7c3aed' : 'rgba(255,255,255,0.08)', color: i === 0 ? 'white' : 'rgba(248,248,255,0.35)' }}>
                      {i + 1}
                    </div>
                    <span className="text-xs font-medium" style={{ color: i === 0 ? '#c4b5fd' : 'rgba(248,248,255,0.55)' }}>{ch}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 px-6 pb-6 flex-wrap">
              <button className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="relative z-10">
                  <path d="M6 2v6M3 6l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 10h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Download MP3</span>
              </button>
              <button className="btn-ghost flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold"
                style={{ color: 'rgba(248,248,255,0.6)' }}
                onClick={() => { setPhase('idle'); setOutput(null); setTopic(''); setPlayProgress(0); setIsPlaying(false); }}>
                Generate Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ onLaunch }: { onLaunch: () => void }) {
  return (
    <footer className="px-5 sm:px-8 py-14" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
          {/* Brand */}
          <div className="max-w-[240px]">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1a3 3 0 00-3 3v1l-.8 2h7.6L10 5V4a3 3 0 00-3-3z" fill="white" opacity="0.9" />
                  <path d="M4.5 7c0 1.4 1.1 2.5 2.5 2.5S9.5 8.4 9.5 7" stroke="white" strokeWidth="1.1" fill="none" opacity="0.6" />
                </svg>
              </div>
              <span className="font-bold" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>MindCast</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(248,248,255,0.28)' }}>
              AI-powered audio generation. Turn any text into a podcast deep-dive.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-12">
            {[
              { heading: 'Product', links: ['Features', 'App Studio', 'Audio Export', 'Chapters'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { heading: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map((col) => (
              <div key={col.heading}>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(248,248,255,0.3)' }}>
                  {col.heading}
                </div>
                <div className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <a key={link} href="#" className="text-sm transition-colors duration-200"
                      style={{ color: 'rgba(248,248,255,0.28)' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,248,255,0.65)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,248,255,0.28)')}>
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA strip */}
        <div className="rounded-2xl p-8 mb-10 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div>
            <div className="font-bold text-base mb-1" style={{ color: '#f8f8ff', letterSpacing: '-0.02em' }}>Ready to try MindCast?</div>
            <div className="text-sm" style={{ color: 'rgba(248,248,255,0.4)' }}>Generate your first audio deep-dive in under 10 seconds.</div>
          </div>
          <button onClick={onLaunch}
            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white flex-shrink-0">
            <span>Open App Studio</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="relative z-10">
              <path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-xs" style={{ color: 'rgba(248,248,255,0.2)' }}>
            © 2026 MindCast. All rights reserved.
          </div>
          <div className="text-xs text-neutral-500 font-mono tracking-wider">
            Made by Aditya Naik and Vihaan Vaghela
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing View ─────────────────────────────────────────────────────────────
function LandingView({ onLaunch }: { onLaunch: () => void }) {
  return (
    <>
      <HeroSection onLaunch={onLaunch} />
      <Ticker />
      <FeaturesSection />
      <Footer onLaunch={onLaunch} />
    </>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [view, setView] = useState<'landing' | 'studio'>('landing');

  useEffect(() => {
    if (view === 'landing') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  return (
    <div suppressHydrationWarning className="mc-root min-h-screen" style={{ background: '#0a0a0c', color: '#f8f8ff' }}>
      <style>{globalStyles}</style>
      <Background />
      <Navbar view={view} setView={setView} />
      <main>
        {view === 'landing'
          ? <LandingView onLaunch={() => setView('studio')} />
          : <AppStudio />
        }
      </main>
    </div>
  );
}
