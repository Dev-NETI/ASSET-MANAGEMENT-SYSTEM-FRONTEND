'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <motion.div
            className="flex items-start justify-between mb-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
        >
            <div>
                <h1 className="text-2xl font-bold text-[#070505]">{title}</h1>
                {subtitle && (
                    <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </motion.div>
    );
}
