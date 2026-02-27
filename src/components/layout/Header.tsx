'use client';

import { useAuth } from '@/hooks/auth';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Header() {
    const { user, logout } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
    };

    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <header className="h-16 bg-white border-b border-border shadow-sm flex items-center justify-between px-6 shrink-0">
            <div />
            <div className="flex items-center gap-3">
                {/* Clickable user info → account settings */}
                <Link
                    href="/account"
                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-[#f1f5f9] transition-colors group"
                >
                    <div className="bg-linear-to-br from-primary to-violet-600 rounded-full h-8 w-8 flex items-center justify-center shadow-sm shadow-indigo-500/30 shrink-0">
                        <span className="text-xs font-bold text-white">{initials}</span>
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-semibold text-ink leading-tight">{user?.name ?? 'User'}</p>
                        <p className="text-xs text-muted leading-tight capitalize">
                            {user?.user_type?.replace('_', ' ') ?? 'Employee'}
                        </p>
                    </div>
                    <Settings className="h-3.5 w-3.5 text-[#94a3b8] group-hover:text-primary transition-colors hidden sm:block" />
                </Link>

                <div className="h-6 w-px bg-border" />

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-1.5 text-sm text-muted hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                </motion.button>
            </div>
        </header>
    );
}
