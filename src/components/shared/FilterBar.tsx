'use client';

import { Search, X } from 'lucide-react';
import { ReactNode } from 'react';

interface FilterBarProps {
    search: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    children?: ReactNode; // additional filter dropdowns
}

export default function FilterBar({ search, onSearchChange, placeholder = 'Search…', children }: FilterBarProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-white border border-border/80 rounded-xl p-3 shadow-sm">
            {/* Search input */}
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-border bg-surface text-ink placeholder:text-sidebar-text focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                />
                {search && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-sidebar-text hover:text-ink transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Extra filter slots */}
            {children && (
                <div className="flex flex-wrap gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
