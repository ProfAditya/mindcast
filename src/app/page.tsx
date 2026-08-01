'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Animated Background ────────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#06080F]" />
      {/* Orbs */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
          animation: 'orbFloat1 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-1/3 -right-60 w-[600px] h-[600px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, #FB7185 0%, transparent 70%)',
          animation: 'orbFloat2 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)',
          animation: 'orbFloat3 26s ease-in-out infinite',
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <style>{`
        @keyframes orbFloat1 {
          0%,100%{transform:translate(0,0) scale(1);}
          33%{transform:translate(80px,60px) scale(1.1);}
          66%{transform:translate(-40px,100px) scale(0.95);}
        }
        @keyframes orbFloat2 {
          0%,100%{transform:translate(0,0) scale(1);}
          33%{transform:translate(-100px,80px) scale(1.05);}
          66%{transform:translate(60px,-60px) scale(1.1);}
        }
        @keyframes orbFloat3 {
          0%,100%{transform:translate(0,0) scale(1);}
          50%{transform:translate(80px,-80px) scale(1.08);}
        }
        @keyframes floatY {
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(-12px);}
        }
        @keyframes spinSlow {
          from{transform:rotate(0deg);}
          to{transform:rotate(360deg);}
        }
        @keyframes pulseRing {
          0%{transform:scale(1);opacity:0.6;}
          100%{transform:scale(1.8);opacity:0;}
        }
        @keyframes gradientShift {
          0%,100%{background-position:0% 50%;}
          50%{background-position:100% 50%;}
        }
        @keyframes ticker {
          0%{transform:translateX(0);}
          100%{transform:translateX(-50%);}
        }
        @keyframes fadeSlideUp {
          from{opacity:0;transform:translateY(24px);}
          to{opacity:1;transform:translateY(0);}
        }
        @keyframes fadeIn {
          from{opacity:0;}
          to{opacity:1;}
        }
        .anim-fade-slide-up { animation: fadeSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-fade-in { animation: fadeIn 0.6s ease both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
      `}</style>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'About', href: '#about' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? 'rgba(6,8,15,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #FB7185)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.8 2 4 3.8 4 6c0 1.5.8 2.8 2 3.5V11h4V9.5C11.2 8.8 12 7.5 12 6c0-2.2-1.8-4-4-4z" fill="white" opacity="0.9"/>
              <path d="M6 11h4v1.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5V11z" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <span className="font-heading font-bold text-white text-lg tracking-tight">MindCast</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/sign-up-login-screen"
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            href="/sign-up-login-screen"
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-full transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
            }}
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-white/70 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {menuOpen ? (
              <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            ) : (
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ background: 'rgba(6,8,15,0.95)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 pt-3 border-t flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <Link href="/sign-up-login-screen" className="px-4 py-3 text-sm font-medium text-white/70 hover:text-white text-center rounded-lg hover:bg-white/5 transition-colors">
                Login
              </Link>
              <Link
                href="/sign-up-login-screen"
                className="px-4 py-3 text-sm font-semibold text-white text-center rounded-full"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
      {/* Floating badge */}
      <div className="anim-fade-slide-up mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        Introducing Mira — Your AI Wellness Companion
      </div>

      {/* Headline */}
      <h1 className="anim-fade-slide-up delay-100 font-heading font-bold text-white leading-[1.05] tracking-tight max-w-4xl"
        style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)' }}>
        Your mind deserves{' '}
        <span
          className="inline-block"
          style={{
            background: 'linear-gradient(135deg, #A78BFA 0%, #FB7185 50%, #F59E0B 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientShift 4s ease infinite',
          }}
        >
          better care.
        </span>
      </h1>

      {/* Tagline */}
      <p className="anim-fade-slide-up delay-200 mt-6 text-white/55 max-w-2xl leading-relaxed"
        style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)' }}>
        MindCast blends AI-powered insights, mood tracking, habit science, and journaling into one beautifully calm experience — built for the way your mind actually works.
      </p>

      {/* CTA Buttons */}
      <div className="anim-fade-slide-up delay-300 mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/sign-up-login-screen"
          className="group flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-white text-sm transition-all duration-300 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
            boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
          }}
        >
          Start Free
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-0.5 transition-transform">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <button
          suppressHydrationWarning
          className="flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-white/80 text-sm transition-all duration-300 hover:text-white hover:bg-white/8 hover:-translate-y-0.5"
          style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6.5 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/>
          </svg>
          Watch Demo
        </button>
      </div>

      {/* Social proof */}
      <div className="anim-fade-slide-up delay-400 mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {['#7C3AED','#FB7185','#0EA5E9','#F59E0B'].map((c, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-[#06080F] flex items-center justify-center text-white text-xs font-bold"
                style={{ background: c }}>
                {['A','B','C','D'][i]}
              </div>
            ))}
          </div>
          <span>12,000+ people improving daily</span>
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map(i => (
            <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#F59E0B">
              <path d="M7 1l1.5 4H13l-3.5 2.5 1.5 4L7 9 3 11.5l1.5-4L1 5h4.5z"/>
            </svg>
          ))}
          <span className="ml-1">4.9 / 5 rating</span>
        </div>
      </div>

      {/* Hero Dashboard Preview */}
      <div className="anim-fade-slide-up delay-500 mt-16 w-full max-w-5xl mx-auto relative">
        {/* Glow behind */}
        <div className="absolute inset-x-20 top-4 h-40 blur-3xl opacity-30 rounded-full"
          style={{ background: 'linear-gradient(90deg, #7C3AED, #FB7185)' }} />
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 mx-4 h-6 rounded-md flex items-center px-3 text-xs text-white/30"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              mindcast.app/dashboard
            </div>
          </div>
          {/* Dashboard mockup */}
          <div className="p-6 grid grid-cols-12 gap-4 min-h-[340px]">
            {/* Sidebar */}
            <div className="col-span-2 hidden md:flex flex-col gap-3">
              {['Dashboard','Mood','Habits','Journal','Analytics'].map((item, i) => (
                <div key={item} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: i === 0 ? 'rgba(124,58,237,0.2)' : 'transparent',
                    color: i === 0 ? '#A78BFA' : 'rgba(255,255,255,0.35)',
                  }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#A78BFA' : 'rgba(255,255,255,0.2)' }} />
                  {item}
                </div>
              ))}
            </div>
            {/* Main content */}
            <div className="col-span-12 md:col-span-10 grid grid-cols-3 gap-4">
              {/* Wellness score */}
              <div className="col-span-1 rounded-xl p-4 flex flex-col items-center justify-center gap-2"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div className="text-3xl font-bold font-heading text-white">87</div>
                <div className="text-xs text-white/50">Wellness Score</div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '87%', background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }} />
                </div>
              </div>
              {/* Mood chart */}
              <div className="col-span-2 rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs text-white/40 mb-3">Mood Trend — 7 days</div>
                <div className="flex items-end gap-1.5 h-16">
                  {[60,75,55,80,70,85,90].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(to top, #7C3AED, #FB7185)`,
                        opacity: 0.6 + i * 0.06,
                      }} />
                  ))}
                </div>
              </div>
              {/* Habit rings */}
              <div className="col-span-3 rounded-xl p-4 flex items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs text-white/40 mr-2">Today's Habits</div>
                {[
                  { label: 'Meditate', pct: 100, color: '#7C3AED' },
                  { label: 'Exercise', pct: 75, color: '#FB7185' },
                  { label: 'Journal', pct: 100, color: '#0EA5E9' },
                  { label: 'Sleep', pct: 60, color: '#F59E0B' },
                ].map((h) => (
                  <div key={h.label} className="flex flex-col items-center gap-1">
                    <div className="relative w-10 h-10">
                      <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                        <circle cx="20" cy="20" r="16" fill="none" stroke={h.color} strokeWidth="3"
                          strokeDasharray={`${h.pct} 100`} strokeLinecap="round"
                          style={{ strokeDasharray: `${(h.pct / 100) * 100.5} 100.5` }}/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{h.pct}%</div>
                    </div>
                    <div className="text-[9px] text-white/40">{h.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ticker / Social Proof ───────────────────────────────────────────────────
function TickerSection() {
  const items = ['Mood Tracking', 'AI Insights', 'Habit Science', 'Journal Prompts', 'Wellness DNA', 'Mira AI', 'Analytics', 'Sleep Tracking', 'Mindfulness', 'Progress Reports'];
  const doubled = [...items, ...items];
  return (
    <div className="py-6 overflow-hidden border-y" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
      <div className="flex gap-8 whitespace-nowrap" style={{ animation: 'ticker 20s linear infinite' }}>
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-medium text-white/30">
            <span className="w-1 h-1 rounded-full bg-violet-500/60" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Product Overview ────────────────────────────────────────────────────────
function ProductOverview() {
  return (
    <section id="about" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.25)', color: '#FB7185' }}>
            What is MindCast?
          </div>
          <h2 className="font-heading font-bold text-white mb-5" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            Mental wellness, reimagined<br />for the modern mind.
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto leading-relaxed text-lg">
            MindCast is not another journaling app. It's a complete mental wellness operating system — powered by AI, grounded in science, and designed to feel like a conversation with someone who truly understands you.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Large card */}
          <div className="lg:col-span-2 rounded-2xl p-8 relative overflow-hidden group cursor-default"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)' }}>
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 3C7.7 3 5 5.7 5 9c0 2.2 1.2 4.1 3 5.2V16h6v-1.8C15.8 13.1 17 11.2 17 9c0-3.3-2.7-6-6-6z" fill="white" opacity="0.9"/>
                  <path d="M8 16h6v1.5a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5V16z" fill="white" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="font-heading font-bold text-white text-xl mb-3">Your personal wellness OS</h3>
              <p className="text-white/50 leading-relaxed">
                Track how you feel, what you do, and how you grow — all in one place. MindCast connects the dots between your mood, habits, sleep, and energy to reveal patterns you'd never notice alone.
              </p>
            </div>
          </div>

          {/* Tall card */}
          <div className="rounded-2xl p-7 relative overflow-hidden group cursor-default"
            style={{ background: 'rgba(251,113,133,0.07)', border: '1px solid rgba(251,113,133,0.15)' }}>
            <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #FB7185, transparent)' }} />
            <div className="relative">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #FB7185, #F43F5E)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2l1.8 5.4H17l-4.6 3.3 1.8 5.4L9 13l-5.2 3.1 1.8-5.4L1 7.4h6.2z" fill="white"/>
                </svg>
              </div>
              <h3 className="font-heading font-bold text-white text-lg mb-2">Science-backed</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Built on CBT, positive psychology, and habit loop research. Every feature is designed to create lasting change.
              </p>
            </div>
          </div>

          {/* Stats cards */}
          {[
            { value: '94%', label: 'of users report improved mood within 2 weeks', color: '#0EA5E9' },
            { value: '3×', label: 'more likely to maintain habits with AI accountability', color: '#F59E0B' },
            { value: '12min', label: 'average daily check-in time — fits any schedule', color: '#D946EF' },
          ].map((stat) => (
            <div key={stat.value} className="rounded-2xl p-7 group cursor-default"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="font-heading font-bold text-3xl mb-2" style={{ color: stat.color }}>{stat.value}</div>
              <p className="text-white/45 text-sm leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      icon: '🧠',
      title: 'Mira AI — Your Wellness Companion',
      desc: 'Mira learns your patterns, remembers your history, and offers compassionate, evidence-based guidance whenever you need it. Not a chatbot — a companion.',
      color: '#7C3AED',
      size: 'large',
    },
    {
      icon: '🌡️',
      title: 'Mood Intelligence',
      desc: 'Log how you feel in seconds. Mira identifies triggers, patterns, and correlations across your entire wellness profile.',
      color: '#FB7185',
      size: 'normal',
    },
    {
      icon: '🔄',
      title: 'Habit Architecture',
      desc: 'Build habits that stick using proven loop science. Visual rings, streaks, and smart reminders keep you on track.',
      color: '#0EA5E9',
      size: 'normal',
    },
    {
      icon: '📓',
      title: 'Reflective Journaling',
      desc: 'AI-guided prompts that meet you where you are. Sentiment analysis reveals emotional themes over time.',
      color: '#F59E0B',
      size: 'normal',
    },
    {
      icon: '🧬',
      title: 'Wellness DNA',
      desc: 'A living profile of your mental and physical health across 7 dimensions — updated daily as you check in.',
      color: '#D946EF',
      size: 'normal',
    },
    {
      icon: '📊',
      title: 'Deep Analytics',
      desc: 'Beautiful charts and insights that show your growth over days, weeks, and months. Know yourself better.',
      color: '#10B981',
      size: 'normal',
    },
  ];

  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', color: '#38BDF8' }}>
            Features
          </div>
          <h2 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            Everything your mind needs.
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">Six powerful tools, one unified experience.</p>
        </div>

        {/* Asymmetric bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Large feature */}
          <div className="lg:col-span-2 lg:row-span-1 rounded-2xl p-8 relative overflow-hidden group"
            style={{ background: `rgba(124,58,237,0.08)`, border: `1px solid rgba(124,58,237,0.2)` }}>
            <div className="absolute top-0 right-0 w-64 h-64 opacity-10 group-hover:opacity-20 transition-opacity"
              style={{ background: `radial-gradient(circle at top right, #7C3AED, transparent)` }} />
            <div className="relative flex flex-col md:flex-row gap-6 items-start">
              <div className="text-5xl">{features[0].icon}</div>
              <div>
                <h3 className="font-heading font-bold text-white text-xl mb-3">{features[0].title}</h3>
                <p className="text-white/50 leading-relaxed">{features[0].desc}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Empathetic responses', 'Memory across sessions', 'Evidence-based guidance', 'Available 24/7'].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Normal features */}
          {features.slice(1).map((f) => (
            <div key={f.title} className="rounded-2xl p-7 relative overflow-hidden group cursor-default transition-all duration-300 hover:-translate-y-1"
              style={{ background: `rgba(255,255,255,0.03)`, border: `1px solid rgba(255,255,255,0.07)` }}>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-15 transition-opacity"
                style={{ background: `radial-gradient(circle, ${f.color}, transparent)` }} />
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-heading font-semibold text-white text-base mb-2">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Check in daily', desc: 'A 2-minute mood and energy check-in sets the tone. Mira notices patterns you miss.', color: '#7C3AED' },
    { num: '02', title: 'Build your habits', desc: 'Choose from science-backed habits or create your own. Visual rings track your streaks.', color: '#FB7185' },
    { num: '03', title: 'Reflect and journal', desc: 'AI prompts guide your writing. Sentiment analysis reveals emotional themes over time.', color: '#0EA5E9' },
    { num: '04', title: 'Grow with insights', desc: 'Weekly reports and Mira\'s analysis show exactly how you\'re improving — and where to focus.', color: '#F59E0B' },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#FCD34D' }}>
            How it works
          </div>
          <h2 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            Four steps to a clearer mind.
          </h2>
        </div>

        {/* Horizontal cards — not a vertical timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <div key={step.num}
              className="relative rounded-2xl p-7 group cursor-default transition-all duration-300 hover:-translate-y-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-2.5 w-5 h-px z-10"
                  style={{ background: 'rgba(255,255,255,0.1)' }} />
              )}
              <div className="font-heading font-bold text-4xl mb-4 opacity-20" style={{ color: step.color }}>{step.num}</div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${step.color}20`, border: `1px solid ${step.color}30` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: step.color }} />
              </div>
              <h3 className="font-heading font-semibold text-white text-base mb-2">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Mira AI Showcase ────────────────────────────────────────────────────────
function MiraShowcase() {
  const messages = [
    { role: 'user', text: "I\'ve been feeling anxious about work lately." },
    { role: 'mira', text: "I noticed your stress scores have been elevated for 5 days. Let's explore what's driving this — is it a specific project, or more of a general feeling?" },
    { role: 'user', text: "It\'s the presentation on Friday. I keep overthinking it." },
    { role: 'mira', text: "That makes sense. Your journal from last month shows you felt the same before your Q2 review — and you rated it 8/10 afterward. You\'re more prepared than you feel right now. Want to try a 3-minute grounding exercise?" },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.25)', color: '#E879F9' }}>
              Meet Mira
            </div>
            <h2 className="font-heading font-bold text-white mb-5" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', letterSpacing: '-0.03em' }}>
              An AI that actually<br />
              <span style={{ color: '#A78BFA' }}>remembers you.</span>
            </h2>
            <p className="text-white/50 leading-relaxed mb-8 text-lg">
              Mira isn't just a chatbot. She reads your mood history, journal entries, and habit data to give you advice that's actually relevant to your life — not generic wellness tips.
            </p>
            <div className="flex flex-col gap-4">
              {[
                { icon: '🧠', text: 'Remembers your history across every session' },
                { icon: '💬', text: 'Responds with empathy, not scripts' },
                { icon: '📈', text: 'Connects patterns across mood, habits, and journal' },
                { icon: '🔒', text: 'Your data stays private — always' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-white/60 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: chat UI */}
          <div className="relative">
            <div className="absolute inset-0 blur-3xl opacity-20 rounded-3xl"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #D946EF)' }} />
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #D946EF)' }}>M</div>
                <div>
                  <div className="text-sm font-semibold text-white">Mira</div>
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Online — here for you
                  </div>
                </div>
              </div>
              {/* Messages */}
              <div className="p-5 flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={msg.role === 'user'
                        ? { background: 'rgba(124,58,237,0.25)', color: 'rgba(255,255,255,0.85)', borderBottomRightRadius: '4px' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', borderBottomLeftRadius: '4px' }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {/* Typing indicator */}
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
                    style={{ background: 'rgba(255,255,255,0.06)', borderBottomLeftRadius: '4px' }}>
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                        style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
              {/* Input */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-white/25 text-sm flex-1">Talk to Mira...</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Wellness DNA Section ────────────────────────────────────────────────────
function WellnessDNASection() {
  const dimensions = [
    { label: 'Emotional', score: 82, color: '#7C3AED' },
    { label: 'Physical', score: 74, color: '#FB7185' },
    { label: 'Mental', score: 88, color: '#0EA5E9' },
    { label: 'Social', score: 65, color: '#F59E0B' },
    { label: 'Purpose', score: 79, color: '#D946EF' },
    { label: 'Sleep', score: 71, color: '#10B981' },
    { label: 'Resilience', score: 85, color: '#F97316' },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: DNA visualization */}
          <div className="relative">
            <div className="absolute inset-0 blur-3xl opacity-15 rounded-3xl"
              style={{ background: 'linear-gradient(135deg, #D946EF, #7C3AED)' }} />
            <div className="relative rounded-2xl p-8"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Score ring */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
                    <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
                    <circle cx="48" cy="48" r="40" fill="none" strokeWidth="6" strokeLinecap="round"
                      stroke="url(#dnaGrad)"
                      strokeDasharray="213.6"
                      strokeDashoffset={213.6 * (1 - 0.78)}
                    />
                    <defs>
                      <linearGradient id="dnaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7C3AED"/>
                        <stop offset="100%" stopColor="#D946EF"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="font-heading font-bold text-2xl text-white">78</div>
                    <div className="text-[10px] text-white/40">DNA Score</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white text-lg mb-1">Your Wellness DNA</h3>
                  <p className="text-white/45 text-sm">7 dimensions, updated daily</p>
                </div>
              </div>
              {/* Dimension bars */}
              <div className="flex flex-col gap-3">
                {dimensions.map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-white/50 text-right">{d.label}</div>
                    <div className="flex-1 h-2 rounded-full bg-white/6 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${d.score}%`, background: d.color, opacity: 0.8 }} />
                    </div>
                    <div className="w-8 text-xs text-white/40 font-medium">{d.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.25)', color: '#E879F9' }}>
              Wellness DNA
            </div>
            <h2 className="font-heading font-bold text-white mb-5" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', letterSpacing: '-0.03em' }}>
              Know yourself<br />
              <span style={{ color: '#D946EF' }}>across 7 dimensions.</span>
            </h2>
            <p className="text-white/50 leading-relaxed mb-8 text-lg">
              Your Wellness DNA is a living profile that evolves as you check in. It maps your emotional, physical, mental, social, and spiritual health — giving you a complete picture of who you are and where to grow.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Personalized', desc: 'Unique to your data' },
                { label: 'Dynamic', desc: 'Updates every day' },
                { label: 'Actionable', desc: 'Mira guides improvement' },
                { label: 'Private', desc: 'Only you can see it' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="font-semibold text-white text-sm mb-1">{item.label}</div>
                  <div className="text-white/40 text-xs">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Feature Previews (Mood, Habit, Journal) ─────────────────────────────────
function FeaturePreviews() {
  const [active, setActive] = useState(0);
  const tabs = [
    {
      label: 'Mood Tracker',
      icon: '🌡️',
      color: '#FB7185',
      preview: (
        <div className="p-6">
          <div className="text-sm text-white/40 mb-4">How are you feeling today?</div>
          <div className="flex gap-3 mb-6">
            {['😔','😐','🙂','😊','🤩'].map((e, i) => (
              <div key={i} className={`flex-1 aspect-square rounded-2xl flex items-center justify-center text-2xl cursor-pointer transition-all hover:scale-110 ${i === 3 ? 'ring-2 ring-rose-400 scale-110' : ''}`}
                style={{ background: i === 3 ? 'rgba(251,113,133,0.2)' : 'rgba(255,255,255,0.04)' }}>
                {e}
              </div>
            ))}
          </div>
          <div className="text-xs text-white/30 mb-2">Energy Level</div>
          <div className="h-2 rounded-full bg-white/6 mb-4 overflow-hidden">
            <div className="h-full rounded-full w-3/4" style={{ background: 'linear-gradient(90deg, #FB7185, #F43F5E)' }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['Work stress','Good sleep','Exercise','Social'].map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-xs"
                style={{ background: 'rgba(251,113,133,0.12)', color: '#FB7185', border: '1px solid rgba(251,113,133,0.2)' }}>{t}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: 'Habit Tracker',
      icon: '🔄',
      color: '#0EA5E9',
      preview: (
        <div className="p-6">
          <div className="text-sm text-white/40 mb-5">Today's habits</div>
          <div className="flex flex-col gap-3">
            {[
              { name: 'Morning meditation', done: true, streak: 12 },
              { name: '30min exercise', done: true, streak: 7 },
              { name: 'Read 20 pages', done: false, streak: 4 },
              { name: 'No screens after 10pm', done: false, streak: 3 },
            ].map((h) => (
              <div key={h.name} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${h.done ? '' : 'border border-white/20'}`}
                  style={h.done ? { background: '#0EA5E9' } : {}}>
                  {h.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </div>
                <span className={`text-sm flex-1 ${h.done ? 'text-white/70 line-through' : 'text-white/80'}`}>{h.name}</span>
                <span className="text-xs text-white/30">🔥 {h.streak}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: 'Journal',icon: '📓',color: '#F59E0B',
      preview: (
        <div className="p-6">
          <div className="text-sm text-white/40 mb-2">Today's reflection</div>
          <div className="text-xs text-white/25 mb-4 italic">"What made you feel most alive today?"</div>
          <div className="rounded-xl p-4 text-sm text-white/60 leading-relaxed mb-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minHeight: '100px' }}>
            Today I finally finished the presentation I've been dreading. The moment I hit send, I felt this wave of relief wash over me. Mira reminded me that I always feel this way before big moments — and she was right...
          </div>
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>142 words · 3 min read</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span>Positive sentiment</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            Built for real life.
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">Three tools, one seamless experience.</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {tabs.map((tab, i) => (
            <button key={tab.label} onClick={() => setActive(i)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
              style={active === i
                ? { background: `${tab.color}20`, color: tab.color, border: `1px solid ${tab.color}40` }
                : { color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }
              }>
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="text-xs text-white/25 ml-2">mindcast.app/{tabs[active].label.toLowerCase().replace(' ', '-')}</div>
          </div>
          {tabs[active].preview}
        </div>
      </div>
    </section>
  );
}

// ─── Analytics Preview ───────────────────────────────────────────────────────
function AnalyticsPreview() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}>
            Analytics
          </div>
          <h2 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            See your growth in numbers.
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">Beautiful charts that make your progress impossible to ignore.</p>
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="font-heading font-semibold text-white">Analytics Dashboard</div>
            <div className="flex gap-2">
              {['7D','30D','90D'].map((p, i) => (
                <button key={p} className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={i === 1 ? { background: 'rgba(124,58,237,0.2)', color: '#A78BFA' } : { color: 'rgba(255,255,255,0.3)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Avg Mood', value: '7.8', change: '+0.4', color: '#FB7185' },
              { label: 'Habit Rate', value: '84%', change: '+12%', color: '#0EA5E9' },
              { label: 'Journal Streak', value: '14d', change: '+3d', color: '#F59E0B' },
              { label: 'Wellness Score', value: '87', change: '+5', color: '#7C3AED' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs text-white/40 mb-2">{stat.label}</div>
                <div className="font-heading font-bold text-2xl text-white mb-1">{stat.value}</div>
                <div className="text-xs font-medium" style={{ color: stat.color }}>{stat.change} this month</div>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="px-6 pb-6">
            <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-xs text-white/30 mb-4">Mood & Energy — 30 days</div>
              <div className="flex items-end gap-1 h-32">
                {Array.from({ length: 30 }, (_, i) => ({
                  mood: 50 + Math.sin(i * 0.4) * 25 + ((i * 7 + 3) % 15),
                  energy: 45 + Math.cos(i * 0.3) * 20 + ((i * 11 + 5) % 15),
                })).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full rounded-t-sm opacity-70" style={{ height: `${d.mood}%`, background: '#7C3AED' }} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-white/30">
                  <div className="w-3 h-1.5 rounded-full bg-violet-500" />Mood
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Security & Privacy ──────────────────────────────────────────────────────
function SecuritySection() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl p-12 md:p-16 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #10B981, transparent)' }} />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399' }}>
                🔒 Security & Privacy
              </div>
              <h2 className="font-heading font-bold text-white mb-5" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.03em' }}>
                Your mental health data<br />
                <span style={{ color: '#34D399' }}>is sacred to us.</span>
              </h2>
              <p className="text-white/50 leading-relaxed text-lg">
                We built MindCast with privacy as a first principle — not an afterthought. Your data is encrypted, never sold, and always under your control.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🔐', title: 'End-to-end encryption', desc: 'All data encrypted at rest and in transit' },
                { icon: '🚫', title: 'Zero data selling', desc: 'We never sell or share your personal data' },
                { icon: '🗑️', title: 'Delete anytime', desc: 'Full data deletion on request, instantly' },
                { icon: '🌍', title: 'GDPR compliant', desc: 'Full compliance with global privacy laws' },
                { icon: '🔑', title: 'You own your data', desc: 'Export everything, anytime, in any format' },
                { icon: '👁️', title: 'No ads, ever', desc: 'Your wellness data is never used for ads' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xl mb-2">{item.icon}</div>
                  <div className="font-semibold text-white text-sm mb-1">{item.title}</div>
                  <div className="text-white/40 text-xs">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const faqs = [
    { q: 'Is MindCast free to use?', a: 'Yes — MindCast has a generous free tier that includes mood tracking, basic habit tracking, and limited Mira conversations. Premium plans unlock unlimited AI, advanced analytics, and Wellness DNA.' },
    { q: 'How is Mira different from other AI chatbots?', a: 'Mira is trained specifically for mental wellness and has access to your personal data (with your permission) — your mood history, journal entries, and habits. This lets her give advice that\'s actually relevant to your life, not generic tips.' },
    { q: 'Is my data private and secure?', a: 'Absolutely. All data is encrypted end-to-end. We never sell your data, never use it for advertising, and you can delete everything at any time. We\'re fully GDPR compliant.' },
    { q: 'Can MindCast replace therapy?', a: 'No — and we\'re clear about that. MindCast is a wellness tool, not a clinical service. Mira is not a therapist. We always encourage professional support for serious mental health concerns and provide resources to find help.' },
    { q: 'What devices does MindCast work on?', a: 'MindCast is a web app that works beautifully on any device — desktop, tablet, or mobile. Native iOS and Android apps are coming soon.' },
    { q: 'How long does the daily check-in take?', a: 'Most users complete their daily check-in in under 3 minutes. The full journaling and habit review takes about 10-15 minutes if you want to go deeper.' },
  ];

  return (
    <section id="faq" className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
            Frequently asked questions.
          </h2>
          <p className="text-white/50">Everything you need to know before you start.</p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i}
              className="rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
              style={{ background: open === i ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', border: open === i ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.07)' }}
              onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-semibold text-white text-sm pr-4">{faq.q}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}
                  style={{ background: open === i ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              {open === i && (
                <div className="px-6 pb-5 text-white/50 text-sm leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ─────────────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)', color: '#38BDF8' }}>
              Get in touch
            </div>
            <h2 className="font-heading font-bold text-white mb-5" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', letterSpacing: '-0.03em' }}>
              We'd love to<br />hear from you.
            </h2>
            <p className="text-white/50 leading-relaxed mb-10">
              Questions, feedback, or just want to say hi? Our team typically responds within a few hours.
            </p>
            <div className="flex flex-col gap-5">
              {[
                { icon: '📧', label: 'Email', value: 'hello@mindcast.app' },
                { icon: '🐦', label: 'Twitter', value: '@mindcastapp' },
                { icon: '💬', label: 'Discord', value: 'discord.gg/mindcast' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs text-white/30 mb-0.5">{item.label}</div>
                    <div className="text-sm text-white/70">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-2xl p-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>✓</div>
                <h3 className="font-heading font-bold text-white text-xl">Message sent!</h3>
                <p className="text-white/50 text-sm">We'll get back to you within a few hours.</p>
                <button onClick={() => setSent(false)} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5" suppressHydrationWarning>
                <div>
                  <label className="block text-xs text-white/40 mb-2 font-medium">Name</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2 font-medium">Email</label>
                  <input
                    suppressHydrationWarning
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2 font-medium">Message</label>
                  <textarea
                    suppressHydrationWarning
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <button suppressHydrationWarning type="submit"
                  className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 4px 16px rgba(124,58,237,0.35)' }}>
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ──────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(251,113,133,0.15) 100%)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.4) 0%, transparent 70%)' }} />
          <div className="relative">
            <h2 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
              Start your wellness journey today.
            </h2>
            <p className="text-white/55 mb-10 text-lg max-w-xl mx-auto">
              Join 12,000+ people who check in with MindCast every day. Free to start, no credit card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-up-login-screen"
                className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}>
                Start Free — No card needed
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t px-6 py-12" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #FB7185)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5C4.8 1.5 3 3.3 3 5.5c0 1.4.7 2.6 1.8 3.3V10h4.4V8.8C10.3 8.1 11 6.9 11 5.5c0-2.2-1.8-4-4-4z" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <span className="font-heading font-bold text-white">MindCast</span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed">
              Your AI-powered mental wellness companion. Built with care, designed for real life.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-12">
            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
              { heading: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] },
            ].map((col) => (
              <div key={col.heading}>
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">{col.heading}</div>
                <div className="flex flex-col gap-2.5">
                  {col.links.map(link => (
                    <a key={link} href="#" className="text-sm text-white/35 hover:text-white/70 transition-colors">{link}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="text-xs text-white/25">© 2026 MindCast. All rights reserved.</div>
          <div className="flex items-center gap-1 text-xs text-white/25">
            Made with <span className="text-rose-400 mx-1">♥</span> for mental wellness
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div suppressHydrationWarning className="min-h-screen text-white" style={{ background: '#06080F' }}>
      <AnimatedBackground />
      <Navbar />
      <main>
        <HeroSection />
        <TickerSection />
        <ProductOverview />
        <FeaturesSection />
        <HowItWorks />
        <MiraShowcase />
        <WellnessDNASection />
        <FeaturePreviews />
        <AnalyticsPreview />
        <SecuritySection />
        <FAQSection />
        <ContactSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
