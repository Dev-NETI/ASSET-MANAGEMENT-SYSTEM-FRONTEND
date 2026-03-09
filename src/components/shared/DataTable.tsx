'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { rowVariant, staggerContainer } from '@/lib/motion';

export interface Column<T> {
    key: string;
    label: ReactNode;
    className?: string;
    render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    keyExtractor?: (row: T) => string | number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
    columns,
    data,
    loading = false,
    keyExtractor,
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-sidebar">
                        <tr>
                            {[...Array(4)].map((_, i) => (
                                <th key={i} className="px-4 py-3">
                                    <div className="h-3 rounded bg-white/10 animate-pulse" style={{ width: `${60 + i * 15}%` }} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {[...Array(5)].map((_, r) => (
                            <tr key={r}>
                                {[...Array(4)].map((_, c) => (
                                    <td key={c} className="px-4 py-3.5">
                                        <div className="h-3.5 rounded bg-slate-100 animate-pulse" style={{ width: `${45 + ((r + c) % 4) * 14}%` }} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-border bg-white shadow-sm">
                <div className="bg-sidebar/8 rounded-2xl p-5 mb-4 border border-sidebar/10">
                    <svg className="h-10 w-10 text-sidebar/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <p className="text-sm font-semibold text-ink">No records found</p>
                <p className="text-xs text-muted mt-1">Try adjusting your search or filters</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-sidebar text-xs font-semibold text-sidebar-text uppercase tracking-wider">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} className={cn('px-4 py-3.5', col.className)}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <AnimatePresence mode="wait">
                    <motion.tbody
                        key={data.length > 0 && keyExtractor ? `${keyExtractor(data[0])}-${data.length}` : data.length}
                        className="divide-y divide-border/50"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {data.map((row, i) => (
                            <motion.tr
                                key={keyExtractor ? keyExtractor(row) : i}
                                variants={rowVariant}
                                className="group border-l-2 border-transparent hover:border-gold hover:bg-blue-50/40 transition-all"
                            >
                                {columns.map(col => (
                                    <td key={col.key} className={cn('px-4 py-3 text-ink', col.className)}>
                                        {col.render
                                            ? col.render(row)
                                            : ((row[col.key] as ReactNode) ?? '—')}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </motion.tbody>
                </AnimatePresence>
            </table>
        </div>
    );
}
