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
            <div className="min-h-screen flex items-center justify-center bg-[#fafaf5]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#fafaf5]">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
