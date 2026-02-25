'use client';

import { useAuth } from '@/hooks/auth';
import { LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Header() {
    const { user, logout } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
    };

    return (
        <header className="h-16 bg-[#fafaf5] border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
            <div />
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-[#070505]">
                    <div className="bg-[#9bc6ef] rounded-full p-1.5">
                        <User className="h-4 w-4 text-[#070505]" />
                    </div>
                    <span className="font-medium">{user?.name ?? 'User'}</span>
                </div>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-1.5 text-sm text-[#070505]/60 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </motion.button>
            </div>
        </header>
    );
}
