// Shared Framer Motion animation variants
import type { Variants } from 'framer-motion';

export const fadeUp: Variants = {
    hidden:  { opacity: 0, y: 16 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1] },
    }),
};

export const fadeIn: Variants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export const scaleIn: Variants = {
    hidden:  { opacity: 0, scale: 0.96 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', damping: 28, stiffness: 350 },
    },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } },
};

export const springScale: Variants = {
    hidden:  { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', damping: 20, stiffness: 300 },
    },
    exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
};

export const slideDown: Variants = {
    hidden:  { opacity: 0, y: -10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', damping: 25, stiffness: 300 },
    },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
};

export const slideLeft: Variants = {
    hidden:  { opacity: 0, x: -12 },
    visible: (i: number = 0) => ({
        opacity: 1,
        x: 0,
        transition: { type: 'spring', damping: 22, stiffness: 280, delay: i * 0.04 },
    }),
};

export const floatCard: Variants = {
    rest:  { y: 0, boxShadow: '0 1px 3px rgba(10,22,40,0.08)' },
    hover: {
        y: -4,
        boxShadow: '0 12px 28px rgba(10,22,40,0.16)',
        transition: { type: 'spring', damping: 18, stiffness: 300 },
    },
};

export const staggerContainer: Variants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.04 } },
};

export const rowVariant: Variants = {
    hidden:  { opacity: 0, x: -6 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] } },
};

export const backdropVariant: Variants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit:    { opacity: 0, transition: { duration: 0.15 } },
};
