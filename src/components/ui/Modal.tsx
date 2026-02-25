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
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        variants={backdropVariant}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />
                    {/* Dialog */}
                    <motion.div
                        className={cn(
                            'relative z-10 w-full bg-[#fafaf5] rounded-xl shadow-xl flex flex-col max-h-[90vh]',
                            sizes[size]
                        )}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-[#070505]">{title}</h2>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 text-gray-400 hover:text-[#070505] hover:bg-[#9bc6ef]/20 transition-colors"
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
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
