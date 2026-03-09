'use client';

import { useAuth } from '@/hooks/auth';
import { LogOut, Settings, Bell, Home, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { slideDown } from '@/lib/motion';

const routeLabels: Record<string, string> = {
    departments:       'Departments',
    categories:        'Categories',
    units:             'Units',
    suppliers:         'Suppliers',
    items:             'Items',
    employees:         'Employees',
    users:             'User Accounts',
    'item-assets':     'Fixed Assets',
    'asset-assignments': 'Assignments',
    'inventory-stocks':  'Stock Levels',
    'stock-receivals':   'Stock Receivals',
    'stock-issuances':   'Stock Issuances',
    account:           'Account Settings',
};

export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [loggingOut, setLoggingOut] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Build breadcrumb segments from pathname
    const segments = pathname.split('/').filter(Boolean);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        if (profileOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [profileOpen]);

    const handleLogout = async () => {
        setLoggingOut(true);
        setProfileOpen(false);
        await logout();
    };

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-sm flex items-center justify-between px-6 shrink-0">

            {/* Left — Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm">
                <Link href="/" className="text-muted hover:text-gold transition-colors">
                    <Home className="h-4 w-4" />
                </Link>
                {segments.map((seg, i) => {
                    const href = '/' + segments.slice(0, i + 1).join('/');
                    const label = routeLabels[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    const isLast = i === segments.length - 1;
                    return (
                        <span key={seg} className="flex items-center gap-1.5">
                            <ChevronRight className="h-3.5 w-3.5 text-border" />
                            {isLast ? (
                                <span className="font-semibold text-ink">{label}</span>
                            ) : (
                                <Link href={href} className="text-muted hover:text-primary transition-colors">{label}</Link>
                            )}
                        </span>
                    );
                })}
                {segments.length === 0 && (
                    <span className="flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 text-border" />
                        <span className="font-semibold text-ink">Dashboard</span>
                    </span>
                )}
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Notification bell (decorative) */}
                <button className="relative p-2 rounded-lg text-muted hover:text-ink hover:bg-surface transition-colors">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
                </button>

                <div className="h-5 w-px bg-border" />

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                    <button
                        onClick={() => setProfileOpen(v => !v)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-surface transition-colors group"
                    >
                        <div className="bg-linear-to-br from-gold to-amber-400 rounded-full h-7 w-7 flex items-center justify-center shadow-sm shadow-yellow-600/25 shrink-0">
                            <span className="text-[10px] font-bold text-white">{initials}</span>
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-semibold text-ink leading-tight">{user?.name ?? 'User'}</p>
                            <p className="text-[10px] text-muted leading-tight capitalize">
                                {user?.user_type?.replace('_', ' ') ?? 'Employee'}
                            </p>
                        </div>
                    </button>

                    <AnimatePresence>
                        {profileOpen && (
                            <motion.div
                                variants={slideDown}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden"
                            >
                                {/* User card */}
                                <div className="px-4 py-3.5 bg-sidebar flex items-center gap-3">
                                    <div className="bg-linear-to-br from-gold to-amber-400 rounded-full h-9 w-9 flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-xs font-bold text-white">{initials}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{user?.name ?? 'User'}</p>
                                        <p className="text-xs text-sidebar-text truncate">{user?.email ?? ''}</p>
                                    </div>
                                </div>

                                <div className="p-1.5">
                                    <Link
                                        href="/account"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink hover:bg-surface hover:text-primary transition-colors"
                                    >
                                        <Settings className="h-4 w-4 text-muted" />
                                        Account Settings
                                    </Link>

                                    <div className="my-1 h-px bg-border" />

                                    <button
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {loggingOut ? 'Signing out…' : 'Sign Out'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
