'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileHeart,
  Flag,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Shield,
  Stethoscope,
  User,
  X,
  LineChart,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Logo, LogoMark } from '@/components/brand';
import { cn } from '@/lib/utils';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string[];
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const PATIENT_NAV: NavGroup[] = [
  { label: 'Overview', items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'My Health',
    items: [
      { href: '/medical-records', label: 'Medical records', icon: FileHeart },
      {
        href: '/assessments',
        label: 'Assessment Centre',
        icon: ClipboardList,
        match: ['/assessments'],
      },
      { href: '/assessment-history', label: 'My Results', icon: LineChart },
    ],
  },
  {
    label: 'Daily life',
    items: [
      { href: '/wellbeing', label: 'Wellbeing', icon: Activity },
      { href: '/journal', label: 'Journal', icon: BookOpen },
      { href: '/goals', label: 'Goals', icon: Flag },
      { href: '/reminders', label: 'Reminders', icon: Bell },
    ],
  },
  {
    label: 'Understand',
    items: [
      { href: '/insights', label: 'Insights', icon: BarChart3 },
      { href: '/soul', label: 'SOUL', icon: MessageCircle },
      { href: '/history', label: 'Timeline', icon: History },
    ],
  },
  {
    label: 'Care & privacy',
    items: [
      { href: '/doctor-connection', label: 'Doctor connection', icon: Stethoscope },
      { href: '/privacy', label: 'Privacy centre', icon: Shield },
      { href: '/profile', label: 'Profile', icon: User },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function isActive(path: string, item: NavItem) {
  const roots = item.match ?? [item.href];
  return roots.some((r) => path === r || path.startsWith(`${r}/`));
}

function NavList({
  groups,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          {!collapsed && <p className="label-eyebrow mb-1.5 px-3">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const on = isActive(path, it);
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    title={collapsed ? it.label : undefined}
                    aria-current={on ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                      on
                        ? 'bg-graphite-raised text-ivory'
                        : 'text-stone hover:bg-white/[0.04] hover:text-ivory',
                      collapsed && 'justify-center px-0'
                    )}
                  >
                    {on && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold"
                        aria-hidden
                      />
                    )}
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        on ? 'text-gold' : 'text-stone group-hover:text-ivory'
                      )}
                      aria-hidden
                    />
                    {!collapsed && <span>{it.label}</span>}
                    {collapsed && <span className="sr-only">{it.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserChip({ collapsed }: { collapsed?: boolean }) {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const name = profile?.full_name || profile?.email || 'Account';
  const initials = name
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-bronze bg-graphite-deep p-2.5',
        collapsed && 'flex-col p-2'
      )}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-line bg-graphite text-xs font-semibold text-gold-pale"
        aria-hidden
      >
        {initials || '·'}
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ivory">{name}</p>
          <p className="truncate text-xs text-stone">{profile?.email}</p>
        </div>
      )}
      <button
        onClick={() => signOut().then(() => router.replace('/login'))}
        className="rounded-lg p-2 text-stone hover:bg-white/5 hover:text-rose"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Shell({
  groups,
  home,
  sub,
  children,
  topRight,
}: {
  groups: NavGroup[];
  home: string;
  sub?: string;
  children: React.ReactNode;
  topRight?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('neurix-nav-collapsed') === '1');
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open]);
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('neurix-nav-collapsed', c ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !c;
    });
  };
  const current = groups.flatMap((g) => g.items).find((i) => isActive(path, i));

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-bronze bg-[#141414] transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-bronze px-4',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {collapsed ? (
            <Link href={home} aria-label="NEURIX home">
              <LogoMark />
            </Link>
          ) : (
            <Logo href={home} sub={sub} />
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavList groups={groups} collapsed={collapsed} />
        </div>
        <div className="space-y-2 border-t border-bronze p-3">
          <UserChip collapsed={collapsed} />
          <button
            onClick={toggle}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-1.5 text-xs text-stone hover:text-ivory"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" /> Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col border-r border-bronze bg-[#141414] animate-fade-up">
            <div className="flex h-16 items-center justify-between border-b border-bronze px-4">
              <Logo href={home} sub={sub} />
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-stone hover:text-ivory"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <NavList groups={groups} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-bronze p-3">
              <UserChip />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-bronze bg-obsidian/90 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="-ml-1 rounded-lg p-2 text-stone hover:text-ivory lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <LogoMark className="h-7 w-7" />
          </div>
          <p className="truncate text-sm font-medium text-stone">{current?.label ?? ''}</p>
          <div className="ml-auto flex items-center gap-2">{topRight}</div>
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 animate-fade-up"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
