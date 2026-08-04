'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { useTheme } from 'next-themes';
import { LayoutDashboard, MessageCircle, BarChart3, BookOpen, Activity, Lightbulb, Settings, LogOut, ChevronLeft, Moon, Sun, Bell, FlaskConical, Heart, Dna, User, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, getStoredUser, isAuthenticated } from '@/lib/api';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


const navItems = [
  { id: 'nav-dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'nav-chat', href: '/ai-chat-with-mira', label: 'Chat with Mira', icon: MessageCircle },
  { id: 'nav-mood', href: '/mood', label: 'Mood', icon: Heart },
  { id: 'nav-habits', href: '/habits', label: 'Habits', icon: Activity },
  { id: 'nav-journal', href: '/journal', label: 'Journal', icon: BookOpen },
  { id: 'nav-analytics', href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'nav-wellness-dna', href: '/wellness-dna', label: 'Wellness DNA', icon: Dna },
  { id: 'nav-assessment', href: '/wellness-assessment', label: 'Assessment', icon: ClipboardList },
  { id: 'nav-experiments', href: '/experiments', label: 'Experiments', icon: FlaskConical },
  { id: 'nav-toolkit', href: '/toolkit', label: 'Toolkit', icon: Lightbulb },
];

const bottomNavItems = [
  { id: 'nav-dashboard', href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'nav-chat', href: '/ai-chat-with-mira', label: 'Mira', icon: MessageCircle },
  { id: 'nav-mood', href: '/mood', label: 'Mood', icon: Heart },
  { id: 'nav-journal', href: '/journal', label: 'Journal', icon: BookOpen },
  { id: 'nav-analytics', href: '/analytics', label: 'Insights', icon: BarChart3 },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.replace('/sign-up-login-screen');
      return;
    }
    const stored = getStoredUser();
    if (stored) setUser({ name: stored.name, email: stored.email });
  }, [router]);

  const handleLogout = () => {
    authApi.logout();
    toast.success('Signed out');
    router.push('/sign-up-login-screen');
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'AC';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out',
          'border-r border-border',
          'glass-light dark:glass-dark',
          collapsed ? 'w-[64px]' : 'w-[232px]'
        )}
        style={{ zIndex: 40 }}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-[60px] px-4 border-b border-border shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl gradient-violet-rose flex items-center justify-center shrink-0 elevation-sm">
              <AppLogo size={16} />
            </div>
            {!collapsed && (
              <span className="font-heading font-bold text-[15px] tracking-tight text-foreground truncate">
                MindCast
              </span>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group',
                  isActive
                    ? 'nav-item-active font-semibold' :'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  collapsed && 'justify-center px-0'
                )}
                data-testid={`nav-${item.id}`}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  className={cn('shrink-0 transition-transform duration-150', !isActive && 'group-hover:scale-110')}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border px-2.5 py-2.5 space-y-0.5 shrink-0">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-muted-foreground hover:bg-muted/70 hover:text-foreground group',
              collapsed && 'justify-center px-0'
            )}
            data-testid="theme-toggle"
          >
            {mounted && (
              theme === 'dark'
                ? <Sun size={16} strokeWidth={1.6} className="shrink-0 group-hover:scale-110 transition-transform" />
                : <Moon size={16} strokeWidth={1.6} className="shrink-0 group-hover:scale-110 transition-transform" />
            )}
            {!collapsed && <span>{mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Toggle Theme'}</span>}
          </button>

          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-muted-foreground hover:bg-muted/70 hover:text-foreground group',
              collapsed && 'justify-center px-0'
            )}
          >
            <User size={16} strokeWidth={1.6} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && <span>Profile</span>}
          </Link>

          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-muted-foreground hover:bg-muted/70 hover:text-foreground group',
              collapsed && 'justify-center px-0'
            )}
          >
            <Settings size={16} strokeWidth={1.6} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 group',
              collapsed && 'justify-center px-0'
            )}
            data-testid="logout-btn"
          >
            <LogOut size={16} strokeWidth={1.6} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* User info + Collapse Toggle */}
        <div className="border-t border-border p-2.5 shrink-0">
          {!collapsed && user && (
            <Link href="/profile" className="flex items-center gap-2.5 px-2 py-2 mb-1.5 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer group">
              <div className="w-7 h-7 rounded-lg gradient-violet-rose flex items-center justify-center text-white text-[11px] font-bold font-heading shrink-0 elevation-xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold font-heading text-foreground truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full h-8 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all duration-150"
            data-testid="sidebar-collapse"
          >
            <ChevronLeft
              size={15}
              strokeWidth={1.8}
              className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
            />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header
          className="h-[60px] border-b border-border shrink-0 flex items-center justify-between px-5 glass-light dark:glass-dark"
          style={{ zIndex: 30 }}
        >
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gradient-violet-rose flex items-center justify-center elevation-xs">
              <AppLogo size={14} />
            </div>
            <span className="font-heading font-bold text-[14px] text-foreground">MindCast</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1.5">
            <button
              className="relative p-2 rounded-xl text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all duration-150"
              data-testid="notifications-btn"
            >
              <Bell size={16} strokeWidth={1.6} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
            </button>
            <Link href="/profile">
              <div className="w-8 h-8 rounded-xl gradient-violet-rose flex items-center justify-center text-white text-[11px] font-bold font-heading cursor-pointer hover:opacity-90 transition-opacity elevation-xs">
                {initials}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border glass-light dark:glass-dark"
        style={{ zIndex: 50 }}
      >
        <div className="flex items-center justify-around h-[60px] px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                data-testid={`mobile-nav-${item.id}`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}