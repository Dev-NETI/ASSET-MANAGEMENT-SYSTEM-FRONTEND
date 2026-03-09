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
    primary:   'bg-primary text-white hover:bg-primary-dark focus:ring-primary/40 shadow-sm shadow-blue-900/20',
    secondary: 'bg-white text-ink border border-border hover:bg-blue-50 hover:border-primary/30 focus:ring-primary/30',
    danger:    'bg-danger text-white hover:bg-red-600 focus:ring-red-400/40 shadow-sm shadow-red-500/20',
    ghost:     'text-muted hover:bg-blue-50 hover:text-ink focus:ring-primary/30',
    gold:      'bg-gold text-white hover:bg-gold-dark focus:ring-gold/40 shadow-sm shadow-yellow-600/20',
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
            whileTap={disabled || loading ? {} : { scale: 0.96, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
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
