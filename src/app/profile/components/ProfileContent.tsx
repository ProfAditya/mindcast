'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, Edit3, Camera, Shield, Award, TrendingUp, BookOpen, Activity, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoredUser, profileApi } from '@/lib/api';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const STATS = [
  { label: 'Journal Entries', value: '24', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { label: 'Habits Tracked', value: '6', icon: Activity, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { label: 'Mood Check-ins', value: '47', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { label: 'Day Streak', value: '12', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const BADGES = [
  { label: '7-Day Streak', icon: '🔥', earned: true },
  { label: 'First Journal', icon: '📝', earned: true },
  { label: 'Mood Master', icon: '😊', earned: true },
  { label: '30-Day Streak', icon: '⚡', earned: false },
  { label: 'Wellness Pro', icon: '🌟', earned: false },
  { label: 'Habit Builder', icon: '🏆', earned: false },
];

export default function ProfileContent() {
  const [user, setUser] = useState({ name: 'Aria Chen', email: 'aria@mindcast.app', created_at: '2024-01-15' });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [joinDate, setJoinDate] = useState('');

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser({ name: stored.name, email: stored.email, created_at: stored.created_at || '2024-01-15' });
    }
  }, []);

  // Compute joinDate on client only to avoid SSR/client locale mismatch
  useEffect(() => {
    setJoinDate(new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }, [user.created_at]);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await profileApi.update({ name: editName });
      setUser((prev) => ({ ...prev, name: editName }));
      toast.success('Profile updated');
      setEditing(false);
    } catch {
      toast.error('Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and wellness identity</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Profile Card */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Cover gradient */}
          <div className="h-28 gradient-violet-rose relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTYgMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl gradient-violet-rose flex items-center justify-center text-white text-2xl font-700 font-heading border-4 border-card shadow-card-md">
                  {initials}
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm">
                  <Camera size={13} strokeWidth={1.5} />
                </button>
              </div>
              <button
                onClick={() => { setEditing(true); setEditName(user.name); }}
                className="btn-ghost border border-border text-sm flex items-center gap-1.5"
              >
                <Edit3 size={13} strokeWidth={1.5} />
                Edit Profile
              </button>
            </div>

            {editing ? (
              <div className="space-y-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field text-lg font-700 font-heading"
                  placeholder="Your name"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-ghost border border-border text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-heading font-700 text-xl text-foreground">{user.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Mail size={13} strokeWidth={1.5} />{user.email}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={13} strokeWidth={1.5} />{joinDate ? `Joined ${joinDate}` : ''}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3', stat.bg)}>
                  <Icon size={18} strokeWidth={1.5} className={stat.color} />
                </div>
                <p className="text-2xl font-700 font-heading text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>

        {/* Badges */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Award size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-700 text-base text-foreground">Achievements</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {BADGES.map((badge) => (
              <div
                key={badge.label}
                className={cn(
                  'rounded-2xl border p-3 text-center transition-all duration-200',
                  badge.earned
                    ? 'border-primary/20 bg-primary/5 hover:border-primary/40' :'border-border bg-muted/30 opacity-50'
                )}
              >
                <div className="text-2xl mb-1.5">{badge.icon}</div>
                <p className="text-xs font-medium text-foreground leading-tight">{badge.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Account Security */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-700 text-base text-foreground">Account Security</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Change Password', desc: 'Update your account password', action: 'Update' },
              { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security', action: 'Enable' },
              { label: 'Connected Apps', desc: 'Manage third-party integrations', action: 'Manage' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-semibold font-heading text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button className="text-sm text-primary font-semibold hover:underline">{item.action}</button>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
