'use client';

import React, { useState, useEffect } from 'react';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  .mc-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #0a0a0c;
    min-height: 100vh;
    color: #f5f5f5;
  }
  .mc-root * { font-family: 'Plus Jakarta Sans', sans-serif !important; box-sizing: border-box; }

  @keyframes ping-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(1.6); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes orb-float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(30px, 40px) scale(1.08); }
  }

  .mc-animate-in { animation: fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .mc-animate-fade { animation: fade-in 0.4s ease both; }
  .mc-ping { animation: ping-dot 1.4s ease-in-out infinite; }
  .mc-spin { animation: spin 0.9s linear infinite; }
  .mc-orb { animation: orb-float 18s ease-in-out infinite; }

  .mc-glass-nav {
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    background: rgba(10,10,12,0.82);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .mc-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.06);
    transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .mc-card:hover {
    border-color: rgba(255,255,255,0.12);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
  }
  .mc-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(99,102,241,0.05), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .mc-card:hover::before { opacity: 1; }

  .mc-btn-primary {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    box-shadow: 0 4px 20px rgba(99,102,241,0.3);
    transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  .mc-btn-primary:hover:not(:disabled) {
    opacity: 0.95;
    transform: translateY(-1px);
    box-shadow: 0 8px 30px rgba(99,102,241,0.45);
  }
  .mc-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .mc-btn-ghost {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.1);
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .mc-btn-ghost:hover {
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.18);
  }

  .mc-select {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.1);
    color: #f5f5f5;
    transition: border-color 0.2s ease;
    appearance: none;
    -webkit-appearance: none;
  }
  .mc-select:focus {
    outline: none;
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }

  .mc-textarea {
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    color: #f5f5f5;
    transition: border-color 0.2s ease;
    resize: none;
  }
  .mc-textarea:focus {
    outline: none;
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .mc-textarea::placeholder { color: rgba(255,255,255,0.2); }

  .mc-result-card {
    animation: fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  .mc-gradient-text {
    background: linear-gradient(135deg, #818cf8 0%, #c4b5fd 50%, #ffffff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .mc-view-enter {
    animation: fade-in-up 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }

  .mc-progress-bar {
    background: linear-gradient(90deg, #4f46e5, #7c3aed);
    width: 33%;
    height: 100%;
    border-radius: 9999px;
  }

  .mc-scrollbar::-webkit-scrollbar { width: 4px; }
  .mc-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .mc-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
`;

interface EpisodeResult {
  title: string;
  duration: string;
  host: string;
  summary: string;
  transcript: { speaker: string; text: string }[];
}

export default function MindCastUltimateApp() {
  const [currentView, setCurrentView] = useState<'landing' | 'studio'>('landing');
  const [inputTopic, setInputTopic] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Aria & Marcus (Dynamic Duo)');
  const [selectedDepth, setSelectedDepth] = useState('Deep Dive (8-10 min)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [episodeResult, setEpisodeResult] = useState<EpisodeResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewKey, setViewKey] = useState(0);

  const processingSteps = [
    'Ingesting text parameters & analyzing context...',
    'Synthesizing dual-host conversational dynamics...',
    'Applying professional studio mastering & spatial audio...',
    'Compiling final high-fidelity master stream...',
  ];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isProcessing) {
      if (stepIndex < processingSteps.length - 1) {
        timer = setTimeout(() => setStepIndex((prev) => prev + 1), 900);
      } else {
        timer = setTimeout(() => {
          setIsProcessing(false);
          setEpisodeResult({
            title: inputTopic.trim()
              ? `Deep Dive: ${inputTopic}`
              : 'The Architecture of Autonomous Intelligence',
            duration: selectedDepth.includes('Deep') ? '08:45' : selectedDepth.includes('Quick') ? '04:20' : '01:30',
            host: selectedVoice,
            summary:
              'An elite synthetic audio breakdown tailored with multi-speaker neural dynamics, natural cadence variance, and studio-grade mastering.',
            transcript: [
              {
                speaker: 'Host 1 (Aria)',
                text: 'Welcome back to MindCast. Today we are breaking down the exact core parameters of what you just fed into our system.',
              },
              {
                speaker: 'Host 2 (Marcus)',
                text: 'That is right. The implications here shift everything we know about instant audio synthesis and high-speed cognitive structuring.',
              },
              {
                speaker: 'Host 1 (Aria)',
                text: "Let's unpack the primary layer and look at how this impacts the overall ecosystem moving forward.",
              },
            ],
          });
        }, 1200);
      }
    }
    return () => clearTimeout(timer);
  }, [isProcessing, stepIndex]);

  const handleGenerateEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStepIndex(0);
    setEpisodeResult(null);
    setIsPlaying(false);
  };

  const switchView = (view: 'landing' | 'studio') => {
    setCurrentView(view);
    setViewKey((k) => k + 1);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div className="mc-root" style={{ overflowX: 'hidden' }}>
        {/* Background orbs */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div
            className="mc-orb"
            style={{
              position: 'absolute',
              top: '-8rem',
              left: '-8rem',
              width: '600px',
              height: '600px',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4rem',
              right: '-6rem',
              width: '500px',
              height: '500px',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
              animation: 'orb-float 24s ease-in-out infinite reverse',
            }}
          />
        </div>

        {/* ── NAVBAR ── */}
        <nav
          className="mc-glass-nav"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            padding: '0 1.5rem',
          }}
        >
          <div
            style={{
              maxWidth: '80rem',
              margin: '0 auto',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            {/* Logo */}
            <button
              onClick={() => switchView('landing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #818cf8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: '#fff',
                  fontSize: '15px',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                  transition: 'transform 0.2s ease',
                }}
              >
                M
              </div>
              <span style={{ fontWeight: 600, fontSize: '17px', color: '#fff', letterSpacing: '-0.02em' }}>
                MindCast
              </span>
            </button>

            {/* Center links */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.45)',
                fontWeight: 500,
              }}
              className="hidden-mobile"
            >
              <button
                onClick={() => switchView('landing')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                Overview
              </button>
              <a
                href="#features"
                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                Architecture
              </a>
              <a
                href="#features"
                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
              >
                Technology
              </a>
            </div>

            {/* CTA */}
            {currentView === 'landing' ? (
              <button
                onClick={() => switchView('studio')}
                className="mc-btn-primary"
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Launch App
              </button>
            ) : (
              <button
                onClick={() => switchView('landing')}
                className="mc-btn-ghost"
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Back to Overview
              </button>
            )}
          </div>
        </nav>

        {/* ── VIEWS ── */}
        <div key={viewKey} className="mc-view-enter" style={{ position: 'relative', zIndex: 1 }}>
          {currentView === 'landing' ? (
            <LandingView onLaunch={() => switchView('studio')} />
          ) : (
            <StudioView
              inputTopic={inputTopic}
              setInputTopic={setInputTopic}
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              selectedDepth={selectedDepth}
              setSelectedDepth={setSelectedDepth}
              isProcessing={isProcessing}
              stepIndex={stepIndex}
              processingSteps={processingSteps}
              episodeResult={episodeResult}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              handleGenerateEpisode={handleGenerateEpisode}
              onExit={() => switchView('landing')}
            />
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '2rem 1.5rem',
            marginTop: '6rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} MindCast. All rights reserved.
          </p>
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
            }}
          >
            Made by Aditya Naik and Vihaan Vaghela
          </p>
        </footer>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LANDING VIEW
───────────────────────────────────────────────────────────────────────────── */
function LandingView({ onLaunch }: { onLaunch: () => void }) {
  return (
    <>
      {/* HERO */}
      <section
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '7rem 1.5rem 6rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '12px',
            color: '#a5b4fc',
            marginBottom: '2rem',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            className="mc-ping"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '9999px',
              background: '#818cf8',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          Next-Gen Audio Intelligence Platform
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.25rem, 6vw, 4.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.08,
            color: '#fff',
            maxWidth: '52rem',
            marginBottom: '1.5rem',
          }}
        >
          Transform complex data into{' '}
          <span className="mc-gradient-text">immersive audio</span> instantly.
        </h1>

        {/* Subheadline */}
        <p
          style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            maxWidth: '38rem',
            marginBottom: '3rem',
            lineHeight: 1.7,
            fontWeight: 400,
          }}
        >
          MindCast synthesizes raw documents, notes, and ideas into cinematic, studio-quality
          conversational audio streams with zero latency and ultra-realistic voice models.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <button
            onClick={onLaunch}
            className="mc-btn-primary"
            style={{
              padding: '1rem 2rem',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              border: '1px solid rgba(99,102,241,0.3)',
              cursor: 'pointer',
              minWidth: '180px',
            }}
          >
            Launch Studio App
          </button>
          <a
            href="#features"
            style={{
              padding: '1rem 2rem',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.65)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              textDecoration: 'none',
              transition: 'background 0.2s, color 0.2s',
              minWidth: '180px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            Explore Capabilities
          </a>
        </div>
      </section>

      {/* FEATURES BENTO GRID */}
      <section
        id="features"
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '6rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.03em',
              marginBottom: '0.75rem',
            }}
          >
            Engineered for absolute fidelity.
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Built from the ground up for seamless, high-performance audio generation workflows.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[
            {
              num: '01',
              title: 'Neural Voice Synthesis',
              desc: 'Advanced generative models producing natural pacing, organic conversational interruptions, and authentic human emotion.',
            },
            {
              num: '02',
              title: 'Instant Stream Processing',
              desc: 'Lightning-fast compilation pipelines turning raw text blocks into rich multi-format studio podcast episodes.',
            },
            {
              num: '03',
              title: 'Adaptive Formatting',
              desc: 'Smart segmentation that structures deep conversations, outline highlights, and executive summaries fluidly.',
            },
          ].map((feat) => (
            <div
              key={feat.num}
              className="mc-card"
              style={{ padding: '2rem', borderRadius: '24px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a5b4fc',
                  fontWeight: 600,
                  fontSize: '12px',
                  marginBottom: '1.5rem',
                }}
              >
                {feat.num}
              </div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: '0.5rem',
                }}
              >
                {feat.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   STUDIO VIEW
───────────────────────────────────────────────────────────────────────────── */
interface StudioViewProps {
  inputTopic: string;
  setInputTopic: (v: string) => void;
  selectedVoice: string;
  setSelectedVoice: (v: string) => void;
  selectedDepth: string;
  setSelectedDepth: (v: string) => void;
  isProcessing: boolean;
  stepIndex: number;
  processingSteps: string[];
  episodeResult: EpisodeResult | null;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  handleGenerateEpisode: (e: React.FormEvent) => void;
  onExit: () => void;
}

function StudioView({
  inputTopic,
  setInputTopic,
  selectedVoice,
  setSelectedVoice,
  selectedDepth,
  setSelectedDepth,
  isProcessing,
  stepIndex,
  processingSteps,
  episodeResult,
  isPlaying,
  setIsPlaying,
  handleGenerateEpisode,
  onExit,
}: StudioViewProps) {
  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.03em',
              marginBottom: '0.25rem',
            }}
          >
            MindCast Production Studio
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Configure your parameters and generate real-time synthetic audio streams.
          </p>
        </div>
        <button
          onClick={onExit}
          className="mc-btn-ghost"
          style={{
            padding: '0.375rem 0.875rem',
            borderRadius: '10px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ← Exit Studio
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* CONFIG PANEL */}
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Voice */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              Host Persona
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="mc-select"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.25rem 0.75rem 0.875rem',
                  borderRadius: '12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <option>Aria &amp; Marcus (Dynamic Duo)</option>
                <option>Elena (Solo Executive Brief)</option>
                <option>David (Deep Technical Breakdown)</option>
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)',
                  pointerEvents: 'none',
                  fontSize: '10px',
                }}
              >
                ▾
              </span>
            </div>
          </div>

          {/* Depth */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              Episode Depth
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedDepth}
                onChange={(e) => setSelectedDepth(e.target.value)}
                className="mc-select"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.25rem 0.75rem 0.875rem',
                  borderRadius: '12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <option>Deep Dive (8-10 min)</option>
                <option>Quick Summary (3-5 min)</option>
                <option>Executive Highlights (90 sec)</option>
              </select>
              <span
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.3)',
                  pointerEvents: 'none',
                  fontSize: '10px',
                }}
              >
                ▾
              </span>
            </div>
          </div>

          {/* Tip */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '16px',
              background: 'rgba(99,102,241,0.05)',
              border: '1px solid rgba(99,102,241,0.2)',
              fontSize: '12px',
              color: '#a5b4fc',
              lineHeight: 1.6,
            }}
          >
            💡{' '}
            <span style={{ fontWeight: 500, color: '#fff' }}>Pro Tip:</span> Input any complex
            topic or paste markdown notes to experience full multi-speaker neural generation.
          </div>
        </div>

        {/* WORKSPACE */}
        <div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '2rem',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            }}
          >
            <form onSubmit={handleGenerateEpisode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}
                >
                  Topic or Source Text
                </label>
                <textarea
                  rows={4}
                  value={inputTopic}
                  onChange={(e) => setInputTopic(e.target.value)}
                  placeholder="Enter a topic, research question, or paste text content to synthesize..."
                  required
                  className="mc-textarea"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '16px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="mc-btn-primary"
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#fff',
                  border: 'none',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                {isProcessing ? 'Synthesizing Stream...' : 'Generate Podcast Episode'}
              </button>
            </form>

            {/* LOADING */}
            {isProcessing && (
              <div
                className="mc-animate-fade"
                style={{
                  marginTop: '2rem',
                  padding: '2rem',
                  borderRadius: '16px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div
                  className="mc-spin"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9999px',
                    border: '2px solid rgba(99,102,241,0.3)',
                    borderTopColor: '#6366f1',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                    {processingSteps[stepIndex]}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                    Step {stepIndex + 1} of {processingSteps.length}
                  </p>
                </div>
              </div>
            )}

            {/* RESULT */}
            {episodeResult && !isProcessing && (
              <div
                className="mc-result-card"
                style={{
                  marginTop: '2rem',
                  padding: '1.5rem 2rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(to bottom, rgba(99,102,241,0.08), transparent)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {/* Title row */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#a5b4fc',
                        background: 'rgba(99,102,241,0.1)',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '9999px',
                        border: '1px solid rgba(99,102,241,0.2)',
                      }}
                    >
                      {episodeResult.host}
                    </span>
                    <h3
                      style={{
                        fontSize: '17px',
                        fontWeight: 700,
                        color: '#fff',
                        marginTop: '0.5rem',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {episodeResult.title}
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: 'monospace',
                      border: '1px solid rgba(255,255,255,0.1)',
                      flexShrink: 0,
                    }}
                  >
                    {episodeResult.duration}
                  </span>
                </div>

                {/* Summary */}
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                  {episodeResult.summary}
                </p>

                {/* Audio Player */}
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                    }}
                  >
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '9999px',
                        background: '#4f46e5',
                        border: 'none',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0,
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#6366f1')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
                    >
                      {isPlaying ? '❚❚' : '▶'}
                    </button>
                    <div
                      style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                      <div className="mc-progress-bar" />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.4)',
                        fontFamily: 'monospace',
                        flexShrink: 0,
                      }}
                    >
                      01:14 / {episodeResult.duration}
                    </span>
                  </div>
                </div>

                {/* Transcript */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'rgba(255,255,255,0.35)',
                    }}
                  >
                    Interactive Transcript Preview
                  </h4>
                  <div
                    className="mc-scrollbar"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.625rem',
                      maxHeight: '12rem',
                      overflowY: 'auto',
                      paddingRight: '0.25rem',
                    }}
                  >
                    {episodeResult.transcript.map((line, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          borderRadius: '12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#a5b4fc',
                          }}
                        >
                          {line.speaker}
                        </span>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.6)',
                            lineHeight: 1.6,
                          }}
                        >
                          {line.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
