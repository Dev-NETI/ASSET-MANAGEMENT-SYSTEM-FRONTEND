'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, perPage, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const from = (page - 1) * perPage + 1;
    const to   = Math.min(page * perPage, total);

    // Build page range with ellipsis
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (page > 3) pages.push('...');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
        if (page < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center justify-between px-1 pt-3 text-sm text-muted">
            <span>
                Showing <span className="font-semibold text-ink">{from}–{to}</span> of{' '}
                <span className="font-semibold text-ink">{total}</span> records
            </span>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-border bg-white text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 py-1 text-sidebar-text">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            className={cn(
                                'min-w-8 h-8 px-2 rounded-lg text-sm font-medium transition-all border',
                                p === page
                                    ? 'bg-gold text-white border-gold shadow-sm shadow-yellow-600/25'
                                    : 'bg-white border-border text-muted hover:border-primary hover:text-primary'
                            )}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-border bg-white text-muted hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
