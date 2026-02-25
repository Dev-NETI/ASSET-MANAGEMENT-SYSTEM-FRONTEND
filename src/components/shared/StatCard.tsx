'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: ReactNode;
    color?: string;
    sub?: string;
    index?: number;
}

export default function StatCard({ label, value, icon, color = 'bg-[#9bc6ef]', sub, index = 0 }: StatCardProps) {
    return (
        <motion.div
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm cursor-default"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={index}
            whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
            transition={{ duration: 0.2 }}
        >
            <div className={cn('rounded-xl p-3 text-white flex-shrink-0', color)}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-[#070505]">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </motion.div>
    );
}
