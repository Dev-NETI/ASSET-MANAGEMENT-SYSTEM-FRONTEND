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
            <div className="border-l-4 border-gold pl-4">
                <h1 className="text-2xl font-bold text-ink">{title}</h1>
                {subtitle && (
                    <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </motion.div>
    );
}
