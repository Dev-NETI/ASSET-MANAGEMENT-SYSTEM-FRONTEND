'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: ReactNode;
}

const variants = {
    primary:   'bg-[#6366f1] text-white hover:bg-[#4f46e5] focus:ring-[#6366f1] shadow-sm shadow-indigo-500/25',
    secondary: 'bg-white text-[#1e293b] border border-[#e2e8f0] hover:bg-[#f8fafc] focus:ring-[#6366f1]',
    danger:    'bg-[#ef4444] text-white hover:bg-red-600 focus:ring-red-400',
    ghost:     'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] focus:ring-[#6366f1]',
    gold:      'bg-[#f59e0b] text-white hover:bg-amber-500 focus:ring-amber-400 shadow-sm shadow-amber-400/25',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <motion.button
            whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                className
            )}
            {...(props as React.ComponentProps<typeof motion.button>)}
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </motion.button>
    );
}
