'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  sender: 'mira' | 'user';
  text: string;
}

interface MoodEntry {
  day: string;
  mood: string;
  emoji: string;
}

interface JournalEntry {
  date: string;
  snippet: string;
  tag: string;
}

interface Habit {
  name: string;
  done: boolean;
  streak: number;
}

interface User {
  email: string;
  name: string;
}

type View = 'landing' | 'login' | 'signup' | 'dashboard';
type Tab = 'mira' | 'dna' | 'mood' | 'journal' | 'habits' | 'toolkit';

const fadeVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

export default function MindCastPlatform() {
  // Navigation & Auth State
  const [currentView, setCurrentView] = useState<View>('landing');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Dashboard Tab State
  const [activeTab, setActiveTab] = useState<Tab>('mira');

  // MIRA AI Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'mira', text: "Hello! I'm MIRA, your Mind Intelligence & Reflective Assistant. How are you feeling right now?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isMiraTyping, setIsMiraTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Wellness DNA State
  const [dnaData] = useState({
    wellnessScore: 84,
    stress: 'Low-Moderate',
    anxiety: 'Managed',
    happiness: 'High',
    motivation: 'Strong',
    burnoutRisk: 'Minimal'
  });

  // Mood Tracker State
  const [selectedMood, setSelectedMood] = useState('Calm');
  const [moodHistory] = useState<MoodEntry[]>([
    { day: 'Mon', mood: 'Happy', emoji: '😊' },
    { day: 'Tue', mood: 'Calm', emoji: '🌿' },
    { day: 'Wed', mood: 'Stressed', emoji: '🌊' },
    { day: 'Thu', mood: 'Excited', emoji: '✨' },
    { day: 'Fri', mood: 'Calm', emoji: '🌿' },
  ]);

  // Journal State
  const [journalText, setJournalText] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([
    { date: 'Aug 4, 2026', snippet: 'Felt grounded today after finishing the core UI specs.', tag: 'Productive' }
  ]);

  // Habit Tracker State
  const [habits, setHabits] = useState<Habit[]>([
    { name: 'Water Intake (2L)', done: true, streak: 5 },
    { name: '10 Min Meditation', done: false, streak: 3 },
    { name: 'Sleep 8 Hours', done: true, streak: 7 },
    { name: 'Daily Journaling', done: false, streak: 2 }
  ]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isMiraTyping]);

  const handleAuthSubmit = (e: React.FormEvent, _type: string) => {
    e.preventDefault();
    if (!authEmail) return;
    setCurrentUser({ email: authEmail, name: authEmail.split('@')[0] });
    setCurrentView('dashboard');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMsg: ChatMessage = { sender: 'user', text: userInput };
    setChatMessages(prev => [...prev, newMsg]);
    setUserInput('');
    setIsMiraTyping(true);

    setTimeout(() => {
      setIsMiraTyping(false);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'mira',
          text: `I hear you. Based on what you shared, let's take a slow breath together. Remember that consistency beats intensity. How can I help you adjust your focus right now?`
        }
      ]);
    }, 1400);
  };

  const toggleHabit = (index: number) => {
    const updated = [...habits];
    updated[index] = { ...updated[index], done: !updated[index].done };
    setHabits(updated);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 antialiased">

      {/* ================================================================== */}
      {/* NAVIGATION BAR                                                      */}
      {/* ================================================================== */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-[#09090b]/85 border-b border-white/[0.06] px-6 lg:px-12 py-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setCurrentView(currentUser ? 'dashboard' : 'landing')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            M
          </div>
          <div>
            <span className="font-bold tracking-tight text-base text-white">MindCast</span>
            <span className="block text-[10px] text-emerald-400 font-mono tracking-widest uppercase">AI Wellness OS</span>
          </div>
        </div>

        {currentView === 'landing' && (
          <div className="hidden md:flex items-center gap-8 text-sm text-neutral-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#mira-section" className="hover:text-white transition-colors">MIRA AI</a>
            <a href="#dna-section" className="hover:text-white transition-colors">Wellness DNA</a>
          </div>
        )}

        <div className="flex items-center gap-3">
          {currentView === 'landing' && (
            <>
              <button
                onClick={() => setCurrentView('login')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => setCurrentView('signup')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                Get Started
              </button>
            </>
          )}

          {currentView === 'dashboard' && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                Connected as <strong className="text-emerald-300">{currentUser?.email}</strong>
              </span>
              <button
                onClick={() => { setCurrentUser(null); setCurrentView('landing'); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/10 transition-all"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ================================================================== */}
      {/* VIEW ROUTER                                                         */}
      {/* ================================================================== */}
      <AnimatePresence mode="wait">

        {/* LANDING PAGE */}
        {currentView === 'landing' && (
          <motion.div key="landing" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition}>
            <section className="relative px-6 lg:px-12 pt-32 pb-24 max-w-5xl mx-auto text-center flex flex-col items-center">
              <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
                <div className="w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[150px]" />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-emerald-300 mb-8 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Meet MIRA • Your Personal AI Mental Wellness OS
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-white leading-[1.08] mb-6">
                Master your mind with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-white">
                  intelligent balance
                </span>.
              </h1>

              <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mb-12 font-normal leading-relaxed">
                MindCast combines conversational AI, emotional analytics, habit tracking, and clinical wellness DNA profiling into one unified operating system.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                <button
                  onClick={() => setCurrentView('signup')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:opacity-95 transition-all shadow-xl shadow-emerald-600/25 border border-emerald-400/20 text-sm"
                >
                  Start Your Journey Free
                </button>
                <button
                  onClick={() => setCurrentView('login')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] text-neutral-300 border border-white/10 font-medium transition-all text-sm"
                >
                  Log Into Account
                </button>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="px-6 lg:px-12 py-24 max-w-5xl mx-auto border-t border-white/[0.04]">
              <div className="text-center mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">Everything your mind needs.</h2>
                <p className="text-neutral-400 text-sm">A complete wellness operating system built for modern mental health.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { num: '01', title: 'MIRA AI Chat', desc: 'Conversational AI companion with long-term memory and contextual emotional insight.' },
                  { num: '02', title: 'Wellness DNA', desc: 'Deep behavioral profiling derived from your daily check-ins and journaling patterns.' },
                  { num: '03', title: 'Habit & Mood Tracking', desc: 'Streak-based habit system and emotional timeline to surface patterns over time.' },
                ].map((f) => (
                  <div key={f.num} className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 font-semibold text-sm">{f.num}</div>
                    <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* LOGIN VIEW */}
        {currentView === 'login' && (
          <motion.div key="login" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="max-w-md mx-auto px-6 py-20">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
                <p className="text-xs text-neutral-400">Log in securely with your email to access your workspace.</p>
              </div>

              <form onSubmit={(e) => handleAuthSubmit(e, 'login')} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  Sign In to MindCast
                </button>
              </form>

              <div className="text-center pt-2">
                <button onClick={() => setCurrentView('signup')} className="text-xs text-neutral-400 hover:text-white transition-colors">
                  Don&apos;t have an account? <span className="text-emerald-400 underline">Sign up</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* SIGNUP VIEW */}
        {currentView === 'signup' && (
          <motion.div key="signup" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="max-w-md mx-auto px-6 py-20">
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Create Your Account</h2>
                <p className="text-xs text-neutral-400">Join MindCast and activate your AI companion MIRA.</p>
              </div>

              <form onSubmit={(e) => handleAuthSubmit(e, 'signup')} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">Create Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/25"
                >
                  Create Account &amp; Launch MIRA
                </button>
              </form>

              <div className="text-center pt-2">
                <button onClick={() => setCurrentView('login')} className="text-xs text-neutral-400 hover:text-white transition-colors">
                  Already have an account? <span className="text-emerald-400 underline">Log in</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* DASHBOARD VIEW */}
        {currentView === 'dashboard' && (
          <motion.div key="dashboard" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={transition} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

            {/* SUB-NAVIGATION TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-white/[0.06] scrollbar-none">
              {([
                { id: 'mira', label: '🤖 MIRA AI Chat' },
                { id: 'dna', label: '🧬 Wellness DNA' },
                { id: 'mood', label: '😊 Mood Tracking' },
                { id: 'journal', label: '📓 Smart Journal' },
                { id: 'habits', label: '🎯 Habit Tracker' },
                { id: 'toolkit', label: '❤️ Toolkit' },
              ] as { id: Tab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'bg-white/[0.03] text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: MIRA AI CHAT */}
            {activeTab === 'mira' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Info */}
                <div className="lg:col-span-1 p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4 h-fit">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">MIRA Assistant</h3>
                    <p className="text-xs text-neutral-400 mt-1">Mind Intelligence &amp; Reflective Assistant with long-term memory and contextual insight.</p>
                  </div>
                  <div className="pt-2 border-t border-white/10 space-y-2 text-xs text-neutral-400">
                    <p className="flex items-center gap-2">🟢 Active Context Engine</p>
                    <p className="flex items-center gap-2">🔒 End-to-End Encrypted</p>
                  </div>
                </div>

                {/* Chat Window */}
                <div className="lg:col-span-3 flex flex-col h-[650px] rounded-3xl bg-white/[0.02] border border-white/[0.08] overflow-hidden backdrop-blur-xl">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'mira' && (
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
                            M
                          </div>
                        )}
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user' ?'bg-emerald-600 text-white rounded-br-none' :'bg-white/[0.05] border border-white/10 text-neutral-200 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {isMiraTyping && (
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                          M
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 text-neutral-400 text-xs flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> MIRA is reflecting...
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Chat Input Bar */}
                  <div className="p-4 border-t border-white/[0.06] bg-black/40">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Ask MIRA anything or share how you feel..."
                        className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 flex-shrink-0"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: WELLNESS DNA */}
            {activeTab === 'dna' && (
              <div className="space-y-6">
                <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                  <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">🧬 Core Feature</span>
                  <h2 className="text-2xl font-bold text-white mt-2">Your Wellness DNA Profile</h2>
                  <p className="text-sm text-neutral-300 mt-1">Deep analysis derived from your daily check-ins, journals, and behavioral patterns.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Overall Wellness Score</span>
                    <div className="text-4xl font-extrabold text-emerald-400">{dnaData.wellnessScore} <span className="text-sm text-neutral-500">/ 100</span></div>
                    <p className="text-xs text-neutral-400">Trending 4% higher than last week.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Stress Index</span>
                    <div className="text-2xl font-bold text-white">{dnaData.stress}</div>
                    <p className="text-xs text-emerald-400">Well managed through recent habits.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Burnout Risk</span>
                    <div className="text-2xl font-bold text-white">{dnaData.burnoutRisk}</div>
                    <p className="text-xs text-emerald-400">Optimal recovery balance maintained.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Anxiety Level</span>
                    <div className="text-2xl font-bold text-white">{dnaData.anxiety}</div>
                    <p className="text-xs text-emerald-400">Stable with mindful practices.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Happiness Index</span>
                    <div className="text-2xl font-bold text-white">{dnaData.happiness}</div>
                    <p className="text-xs text-emerald-400">Positive trend over 7 days.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Motivation</span>
                    <div className="text-2xl font-bold text-white">{dnaData.motivation}</div>
                    <p className="text-xs text-emerald-400">Driven by consistent habits.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MOOD TRACKING */}
            {activeTab === 'mood' && (
              <div className="space-y-6">
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">How are you feeling right now?</h2>
                    <p className="text-xs text-neutral-400 mt-1">Select your current emotional state to update your timeline.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Happy', emoji: '😊' },
                      { label: 'Calm', emoji: '🌿' },
                      { label: 'Stressed', emoji: '🌊' },
                      { label: 'Excited', emoji: '✨' },
                      { label: 'Tired', emoji: '🌙' },
                      { label: 'Anxious', emoji: '☁️' }
                    ].map((m) => (
                      <button
                        key={m.label}
                        onClick={() => setSelectedMood(m.label)}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                          selectedMood === m.label ? 'border-emerald-500 bg-emerald-500/15' : 'border-white/10 bg-black/30 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-sm font-semibold text-white">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                  <h3 className="text-lg font-bold text-white">Recent Emotional History</h3>
                  <div className="space-y-3">
                    {moodHistory.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                        <span className="text-xs font-mono text-neutral-400">{item.day}</span>
                        <span className="text-sm font-medium text-white flex items-center gap-2">{item.emoji} {item.mood}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SMART JOURNAL */}
            {activeTab === 'journal' && (
              <div className="space-y-6">
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                  <h2 className="text-xl font-bold text-white">Daily AI Journal</h2>
                  <p className="text-xs text-neutral-400">Write freely. Encrypted entries receive instant AI reflection summaries.</p>

                  <textarea
                    rows={5}
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="What went well today? What challenges did you face?"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                  <button
                    onClick={() => {
                      if (!journalText) return;
                      setJournalEntries([{ date: 'Just now', snippet: journalText, tag: 'Reflective' }, ...journalEntries]);
                      setJournalText('');
                    }}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Save &amp; Analyze with MIRA
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Past Entries</h3>
                  {journalEntries.map((entry, idx) => (
                    <div key={idx} className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                        <span>{entry.date}</span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{entry.tag}</span>
                      </div>
                      <p className="text-sm text-neutral-200">{entry.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: HABIT TRACKER */}
            {activeTab === 'habits' && (
              <div className="space-y-6">
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-6">
                  <h2 className="text-xl font-bold text-white">Daily Wellness Habits</h2>
                  <div className="space-y-3">
                    {habits.map((habit, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={habit.done}
                            onChange={() => toggleHabit(idx)}
                            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                          />
                          <span className={`text-sm font-medium ${habit.done ? 'line-through text-neutral-500' : 'text-white'}`}>{habit.name}</span>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">🔥 {habit.streak} Day Streak</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TOOLKIT */}
            {activeTab === 'toolkit' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                  <span className="text-xs font-mono text-emerald-400">BREATHING EXERCISE</span>
                  <h3 className="text-xl font-bold text-white">Box Breathing (4-4-4-4)</h3>
                  <p className="text-sm text-neutral-400">Regulate your nervous system instantly with guided pacing.</p>
                  <div className="w-32 h-32 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto animate-pulse">
                    <span className="text-xs text-emerald-300 font-bold">Breathe In</span>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                  <span className="text-xs font-mono text-emerald-400">EMERGENCY CALMING</span>
                  <h3 className="text-xl font-bold text-white">Grounding Sanctuary</h3>
                  <p className="text-sm text-neutral-400">Instant ambient soundscapes and quiet visual focus.</p>
                  <button className="w-full py-3 rounded-xl bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition-all">
                    Activate Calming Mode
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

      {/* ================================================================== */}
      {/* FOOTER WITH REQUIRED CREDIT                                        */}
      {/* ================================================================== */}
      <footer className="border-t border-white/[0.06] py-8 px-6 lg:px-12 mt-24 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="text-xs text-neutral-500">
          © 2026 MindCast. AI Mental Wellness Operating System.
        </div>
        <div className="text-xs text-neutral-500 font-mono tracking-wider">
          Made by Aditya Naik and Vihaan Vaghela
        </div>
      </footer>
    </div>
  );
}