'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

// Map legacy color props to gradient classes
const colorGradient: Record<string, string> = {
    'bg-[#9bc6ef]': 'from-indigo-500 to-violet-600',
    'bg-[#cdac6a]': 'from-amber-400 to-orange-500',
    'bg-red-500':   'from-red-400 to-rose-600',
    'bg-gray-400':  'from-slate-300 to-slate-500',
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
            className="bg-white rounded-2xl border border-[#e2e8f0] p-5 flex items-center gap-4 shadow-sm cursor-default"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={index}
            whileHover={{ y: -3, boxShadow: '0 10px 25px rgba(99,102,241,0.12)' }}
            transition={{ duration: 0.2 }}
        >
            <div className={`rounded-xl p-3 bg-gradient-to-br ${gradient} text-white flex-shrink-0 shadow-sm`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">{label}</p>
                <p className="text-3xl font-bold text-[#1e293b] leading-tight">{value}</p>
                {sub && <p className="text-xs text-[#94a3b8] mt-0.5">{sub}</p>}
            </div>
        </motion.div>
    );
}
