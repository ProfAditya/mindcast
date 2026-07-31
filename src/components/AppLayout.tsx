'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { useTheme } from 'next-themes';
import { LayoutDashboard, MessageCircle, BarChart3, BookOpen, Activity, Lightbulb, Settings, LogOut, ChevronLeft, Moon, Sun, Bell, FlaskConical, Heart, Dna, User,  } from 'lucide-react';
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
    // Guard: redirect to login if no token
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
          'hidden lg:flex flex-col border-r border-border transition-all duration-300 ease-in-out shrink-0',
          'bg-card/50 backdrop-blur-sm',
          collapsed ? 'w-16' : 'w-60'
        )}
        style={{ zIndex: 40 }}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center border-b border-border h-16 px-4',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-violet-rose flex items-center justify-center shrink-0">
              <AppLogo size={18} />
            </div>
            {!collapsed && (
              <span className="font-heading font-700 text-base tracking-tight text-foreground">
                MindCast
              </span>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold' :'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
                data-testid={`nav-${item.id}`}
              >
                <Icon size={17} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border px-2 py-3 space-y-0.5">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
            data-testid="theme-toggle"
          >
            {mounted && (theme === 'dark' ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />)}
            {!collapsed && <span>{mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Toggle Theme'}</span>}
          </button>

          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <User size={17} strokeWidth={1.5} />
            {!collapsed && <span>Profile</span>}
          </Link>

          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <Settings size={17} strokeWidth={1.5} />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
            data-testid="logout-btn"
          >
            <LogOut size={17} strokeWidth={1.5} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* User info + Collapse Toggle */}
        <div className="border-t border-border p-2">
          {!collapsed && user && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-xl hover:bg-muted transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-lg gradient-violet-rose flex items-center justify-center text-white text-xs font-700 font-heading shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold font-heading text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
            data-testid="sidebar-collapse"
          >
            <ChevronLeft
              size={16}
              strokeWidth={1.5}
              className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
            />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border shrink-0 flex items-center justify-between px-5 glass-light dark:glass-dark" style={{ zIndex: 30 }}>
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-violet-rose flex items-center justify-center">
              <AppLogo size={16} />
            </div>
            <span className="font-heading font-700 text-sm text-foreground">MindCast</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <button
              className="relative p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
              data-testid="notifications-btn"
            >
              <Bell size={17} strokeWidth={1.5} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
            </button>
            <Link href="/profile">
              <div className="w-8 h-8 rounded-xl gradient-violet-rose flex items-center justify-center text-white text-xs font-700 font-heading cursor-pointer hover:opacity-90 transition-opacity">
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border glass-light dark:glass-dark" style={{ zIndex: 50 }}>
        <div className="flex items-center justify-around h-16 px-2">
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
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}