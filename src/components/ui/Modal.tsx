'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { backdropVariant } from '@/lib/motion';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-sidebar/65 backdrop-blur-md"
                        variants={backdropVariant}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />
                    {/* Dialog */}
                    <motion.div
                        className={cn(
                            'relative z-10 w-full bg-white rounded-2xl shadow-2xl border border-border/60 flex flex-col max-h-[90vh]',
                            sizes[size]
                        )}
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 28, stiffness: 350 } }}
                        exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } }}
                    >
                        {/* Header — deep navy */}
                        <div className="flex items-center justify-between px-6 py-4 bg-sidebar rounded-t-2xl">
                            <h2 className="text-base font-semibold text-white tracking-wide">{title}</h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-sidebar-text hover:text-gold hover:bg-white/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="px-6 py-5 overflow-y-auto flex-1">
                            {children}
                        </div>
                        {/* Footer */}
                        {footer && (
                            <div className="px-6 py-4 border-t border-border/60 flex justify-end gap-3 bg-surface/50 rounded-b-2xl">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
