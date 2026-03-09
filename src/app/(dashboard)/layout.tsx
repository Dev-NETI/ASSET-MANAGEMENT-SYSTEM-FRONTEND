'use client';

import { useAuth } from '@/hooks/auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Spinner from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuth({ middleware: 'auth' });
    const pathname = usePathname();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-linear-to-br from-gold to-amber-400 rounded-xl p-3 shadow-sm shadow-yellow-600/20">
                        <Spinner size="lg" className="text-white" />
                    </div>
                    <p className="text-sm text-muted font-medium">Loading…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-surface">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { type: 'spring', damping: 24, stiffness: 280 } }}
                            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
