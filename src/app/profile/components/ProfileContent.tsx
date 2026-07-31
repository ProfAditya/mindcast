'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, Shield } from 'lucide-react';

import { getStoredUser, authApi } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function ProfileContent() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; created_at?: string } | null>(null);
  const [joinDate, setJoinDate] = useState('');

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser({ name: stored.name, email: stored.email, created_at: stored.created_at });
    }
  }, []);

  useEffect(() => {
    if (user?.created_at) {
      setJoinDate(new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    }
  }, [user?.created_at]);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleLogout = () => {
    authApi.logout();
    toast.success('Signed out');
    router.push('/sign-up-login-screen');
  };

  if (!user) {
    return (
      <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-lg mx-auto">
        <div className="rounded-2xl border border-border bg-card h-48 skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="px-5 lg:px-8 xl:px-10 py-7 pb-24 lg:pb-8 max-w-screen-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-7">
        <h1 className="font-heading font-700 text-2xl lg:text-3xl text-foreground tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Your account information</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
        {/* Profile Card */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-28 gradient-violet-rose relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTYgMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="w-20 h-20 rounded-2xl gradient-violet-rose flex items-center justify-center text-white text-2xl font-700 font-heading border-4 border-card shadow-card-md">
                {initials}
              </div>
            </div>

            <div>
              <h2 className="font-heading font-700 text-xl text-foreground">{user.name}</h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail size={13} strokeWidth={1.5} />{user.email}</span>
                {joinDate && (
                  <span className="flex items-center gap-1.5"><Calendar size={13} strokeWidth={1.5} />Joined {joinDate}</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Security — only show what's actually supported */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} strokeWidth={1.5} className="text-primary" />
            <h3 className="font-heading font-700 text-base text-foreground">Account</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-semibold font-heading text-foreground">Email</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold font-heading text-foreground">Sign Out</p>
                <p className="text-xs text-muted-foreground">End your current session</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-rose-600 dark:text-rose-400 font-semibold hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
