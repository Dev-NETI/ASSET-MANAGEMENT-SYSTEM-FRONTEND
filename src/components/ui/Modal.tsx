'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { backdropVariant, scaleIn } from '@/lib/motion';

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
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        variants={backdropVariant}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />
                    {/* Dialog */}
                    <motion.div
                        className={cn(
                            'relative z-10 w-full bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] flex flex-col max-h-[90vh]',
                            sizes[size]
                        )}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f1f5f9]">
                            <h2 className="text-lg font-semibold text-[#1e293b]">{title}</h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 text-[#94a3b8] hover:text-[#6366f1] hover:bg-indigo-50 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {/* Body */}
                        <div className="px-6 py-4 overflow-y-auto flex-1">
                            {children}
                        </div>
                        {/* Footer */}
                        {footer && (
                            <div className="px-6 py-4 border-t border-[#f1f5f9] flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
