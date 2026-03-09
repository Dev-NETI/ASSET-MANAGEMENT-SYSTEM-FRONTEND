'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

const colorGradient: Record<string, string> = {
    'bg-[#9bc6ef]': 'from-primary to-blue-400',
    'bg-[#cdac6a]': 'from-gold to-amber-400',
    'bg-red-500':   'from-red-500 to-rose-600',
    'bg-gray-400':  'from-slate-400 to-slate-500',
};

interface StatCardProps {
    label: string;
    value: string | number;
    icon: ReactNode;
    color?: string;
    sub?: string;
    index?: number;
}

export default function StatCard({ label, value, icon, color = 'bg-[#9bc6ef]', sub, index = 0 }: StatCardProps) {
    const gradient = colorGradient[color] ?? 'from-indigo-500 to-violet-600';

    return (
        <motion.div
            className="relative bg-white rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm overflow-hidden cursor-default"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={index}
            whileHover={{ y: -4, boxShadow: '0 16px 32px rgba(10,22,40,0.14)', transition: { type: 'spring', stiffness: 300, damping: 18 } }}
        >
            {/* Decorative corner dots */}
            <div className="absolute top-3 right-3 grid grid-cols-3 gap-0.5 opacity-[0.07]">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-1 w-1 rounded-full bg-sidebar" />
                ))}
            </div>
            <div className={`rounded-xl p-3 bg-linear-to-br ${gradient} text-white shrink-0 shadow-sm`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-bold text-ink leading-tight">{value}</p>
                {sub && <p className="text-xs text-sidebar-text mt-0.5 truncate">{sub}</p>}
            </div>
        </motion.div>
    );
}
