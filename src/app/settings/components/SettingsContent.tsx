'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Moon, Sun, Shield, Trash2, LogOut, ChevronRight, Check, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import Icon from '@/components/ui/AppIcon';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-semibold font-heading text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsContent() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyInsights: true,
    habitAlerts: false,
    miraMessages: true,
  });

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    toast.success('Signed out successfully');
    router.push('/sign-up-login-screen');
  };

  const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize your MindCast experience</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Appearance */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Moon size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-700 text-base text-foreground">Appearance</h3>
          </div>
          <div>
            <p className="text-sm font-semibold font-heading text-foreground mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200',
                      isActive
                        ? 'border-primary bg-primary/5 text-primary' :'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    )}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                    <span className="text-xs font-semibold font-heading">{opt.label}</span>
                    {isActive && <Check size={12} strokeWidth={2.5} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-700 text-base text-foreground">Notifications</h3>
          </div>
          <div>
            <SettingRow label="Daily Reminder" desc="Get a gentle nudge to check in each day">
              <ToggleSwitch checked={notifications.dailyReminder} onChange={(v) => setNotifications((p) => ({ ...p, dailyReminder: v }))} />
            </SettingRow>
            <SettingRow label="Weekly Insights" desc="Receive your weekly wellness summary">
              <ToggleSwitch checked={notifications.weeklyInsights} onChange={(v) => setNotifications((p) => ({ ...p, weeklyInsights: v }))} />
            </SettingRow>
            <SettingRow label="Habit Alerts" desc="Reminders when habits are due">
              <ToggleSwitch checked={notifications.habitAlerts} onChange={(v) => setNotifications((p) => ({ ...p, habitAlerts: v }))} />
            </SettingRow>
            <SettingRow label="Mira Messages" desc="Receive insights and check-ins from Mira">
              <ToggleSwitch checked={notifications.miraMessages} onChange={(v) => setNotifications((p) => ({ ...p, miraMessages: v }))} />
            </SettingRow>
          </div>
        </motion.div>

        {/* Privacy & Data */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-700 text-base text-foreground">Privacy & Data</h3>
          </div>
          <div>
            {[
              { label: 'Export My Data', desc: 'Download all your wellness data as JSON' },
              { label: 'Data Retention', desc: 'Manage how long your data is stored' },
              { label: 'Privacy Policy', desc: 'Read our privacy policy' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-4 border-b border-border last:border-0 cursor-pointer group">
                <div>
                  <p className="text-sm font-semibold font-heading text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trash2 size={16} strokeWidth={1.5} className="text-rose-500" />
            <h3 className="font-heading font-700 text-base text-rose-600 dark:text-rose-400">Danger Zone</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card hover:border-rose-500/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <LogOut size={16} strokeWidth={1.5} className="text-muted-foreground group-hover:text-rose-500 transition-colors" />
                <div className="text-left">
                  <p className="text-sm font-semibold font-heading text-foreground">Sign Out</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors group">
              <div className="flex items-center gap-3">
                <Trash2 size={16} strokeWidth={1.5} className="text-rose-500" />
                <div className="text-left">
                  <p className="text-sm font-semibold font-heading text-rose-600 dark:text-rose-400">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete all your data</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={1.5} className="text-rose-500" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
