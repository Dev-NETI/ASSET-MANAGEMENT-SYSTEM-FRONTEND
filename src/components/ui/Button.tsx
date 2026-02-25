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
    primary:   'bg-[#9bc6ef] text-[#070505] hover:bg-[#78aede] focus:ring-[#9bc6ef]',
    secondary: 'bg-white text-[#070505] border border-gray-300 hover:bg-gray-50 focus:ring-gray-400',
    danger:    'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    ghost:     'text-[#070505] hover:bg-[#9bc6ef]/20 focus:ring-[#9bc6ef]',
    gold:      'bg-[#cdac6a] text-[#070505] hover:bg-[#b89452] focus:ring-[#cdac6a]',
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
