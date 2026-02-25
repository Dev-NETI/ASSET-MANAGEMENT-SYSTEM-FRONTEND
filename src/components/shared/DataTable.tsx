'use client';

import Spinner from '@/components/ui/Spinner';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { rowVariant, staggerContainer } from '@/lib/motion';

export interface Column<T> {
    key: string;
    label: string;
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
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <svg className="h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm">No records found</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-[#9bc6ef]/20 text-xs font-semibold text-[#070505]/70 uppercase tracking-wider">
                    <tr>
                        {columns.map(col => (
                            <th key={col.key} className={cn('px-4 py-3', col.className)}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <AnimatePresence mode="wait">
                    <motion.tbody
                        key={data.length}
                        className="divide-y divide-gray-100"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {data.map((row, i) => (
                            <motion.tr
                                key={keyExtractor ? keyExtractor(row) : i}
                                variants={rowVariant}
                                className="hover:bg-[#9bc6ef]/10 transition-colors"
                            >
                                {columns.map(col => (
                                    <td key={col.key} className={cn('px-4 py-3 text-[#070505]', col.className)}>
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
